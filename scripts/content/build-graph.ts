// Builds the two-layer knowledge graph. The document layer comes from resolved
// wiki links; the semantic layer comes from curated entities and `relations`
// frontmatter. Layout coordinates are deterministic so the graph never jumps
// between builds or between loads.

import type {
  BlockNode, EdgeType, Entity, GraphData, GraphEdge, GraphNode, GraphSlice, Journey,
  NodeKind, PageSummary, Period, Place, RelatedPage,
  SourceEntry,
} from '../../src/types/content.js';
import type { BuildProblem } from './build-content.js';
import { UndirectedGraph } from 'graphology';
import communitiesLouvain from 'graphology-communities-louvain';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness.js';
import { route } from './lib/site.js';

export const EDGE_TYPES: EdgeType[] = [
  'links_to', 'draws_from', 'part_of', 'appears_in', 'associated_with', 'practiced_at',
  'changes_during', 'precedes', 'maintains', 'threatens', 'restores', 'contrasts_with',
  'contested_by', 'depicted_in',
  'transmitted_through', 'adapted_by', 'reinterpreted_by', 'manifested_in', 'encountered_at',
];

const EDGE_SET = new Set<string>(EDGE_TYPES);

export const NODE_KINDS: NodeKind[] = [
  'article', 'concept', 'deity', 'place', 'period', 'practice',
  'text', 'object', 'role', 'source', 'journey',
];

/** Edges the build derives from the pages. Everything else was written by hand. */
const DERIVED_TYPES = new Set<EdgeType>(['links_to', 'draws_from']);

/** Archive index and catalogue pages that link to everything without carrying an argument. */
export const CONTROL_SLUGS = new Set([
  'index', 'log', 'coverage-map', 'reading-audit', 'source-catalog', 'course-reading-guide',
  'course-materials-deep-notes', 'four-week-relearning-plan', 'exam-recovery-guide',
  'student-work-reconstruction', 'web-research-supplement', 'course-reconstruction',
]);

interface ParsedLike {
  page: { slug: string; frontmatter: { relations?: { target: string; type: EdgeType; note?: string }[] } };
  blocks: BlockNode[];
  links: { slug: string; hash: string | null; context: string }[];
  sourceIds: string[];
}

interface BuildGraphInput {
  pages: PageSummary[];
  parsed: ParsedLike[];
  entities: Entity[];
  periods: Period[];
  places: Place[];
  journeys: Journey[];
  sources?: SourceEntry[];
  problems: BuildProblem[];
}

export interface GraphBuild {
  data: GraphData;
  neighborhood(slug: string): GraphSlice;
  relatedBySlug: Map<string, RelatedPage[]>;
}

export function buildGraph(input: BuildGraphInput): GraphBuild {
  const { pages, parsed, entities, periods, places, journeys, problems } = input;
  const sources = input.sources ?? [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const sourceRoute = (id: string): string => `${route('archive', 'sources')}${sourceById.get(id)?.origin === 'supplemental' ? '?catalog=research' : ''}#${id.toLowerCase()}`;
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const pageBySlug = new Map(pages.map((p) => [p.slug, p]));

  const addNode = (node: Omit<GraphNode, 'degree' | 'semanticDegree' | 'community' | 'betweenness' | 'x' | 'y'>) => {
    if (!nodes.has(node.id)) nodes.set(node.id, { ...node, degree: 0, semanticDegree: 0, community: -1, betweenness: 0, x: 0, y: 0 });
    return nodes.get(node.id)!;
  };

  for (const page of pages) {
    addNode({
      id: `page:${page.slug}`,
      kind: 'article',
      label: page.title,
      summary: page.summary,
      route: page.route,
      slug: page.slug,
      periods: page.periods,
      places: page.places,
      evidence: page.evidence,
      origin: page.origin,
      ...(CONTROL_SLUGS.has(page.slug) ? { control: true } : {}),
    });
  }
  for (const entity of entities) {
    addNode({
      id: `entity:${entity.id}`,
      kind: entity.kind,
      label: entity.label,
      summary: entity.summary,
      route: entity.slug ? (pageBySlug.get(entity.slug)?.route ?? null) : null,
      slug: entity.slug,
      periods: entity.periods ?? [],
      places: entity.places ?? [],
      evidence: entity.evidence ?? 'scholarship',
      origin: entity.origin ?? 'course',
    });
  }
  for (const place of places) {
    addNode({
      id: `place:${place.id}`, kind: 'place', label: place.label, summary: place.summary,
      route: `${route('atlas')}?place=${place.id}`, slug: place.slug, periods: [], places: [place.id], evidence: 'scholarship', origin: place.origin ?? 'course',
    });
  }
  for (const period of periods) {
    addNode({
      id: `period:${period.id}`, kind: 'period', label: period.label, summary: period.summary,
      route: `${route('chronology')}?period=${period.id}`, slug: period.slug, periods: [period.id], places: [], evidence: 'scholarship', origin: 'supplemental',
    });
  }
  for (const journey of journeys) {
    addNode({
      id: `journey:${journey.id}`, kind: 'journey', label: journey.title, summary: journey.subtitle,
      route: route('journeys', journey.id), periods: [], places: [], evidence: journey.origin === 'course' ? 'archive' : 'scholarship', origin: journey.origin,
    });
  }

  const nodeIdFor = (target: string): string | null => {
    if (nodes.has(`page:${target}`)) return `page:${target}`;
    if (nodes.has(`entity:${target}`)) return `entity:${target}`;
    if (nodes.has(`place:${target}`)) return `place:${target}`;
    if (nodes.has(`period:${target}`)) return `period:${target}`;
    return null;
  };

  const addEdge = (from: string, to: string, type: EdgeType, source: string, note?: string, weight = 1) => {
    if (!EDGE_SET.has(type)) {
      problems.push({ file: source, message: `unknown relation type "${type}"`, severity: 'error' });
      return;
    }
    if (from === to) return;
    const existing = edges.find((e) => e.from === from && e.to === to && e.type === type);
    if (existing) { existing.weight += weight; return; }
    edges.push({ from, to, type, note, source, weight });
  };

  // Document layer: one edge per resolved wiki link, weighted by repetition.
  for (const p of parsed) {
    const from = `page:${p.page.slug}`;
    const counts = new Map<string, number>();
    for (const link of p.links) counts.set(link.slug, (counts.get(link.slug) ?? 0) + 1);
    for (const [slug, count] of counts) {
      if (slug === p.page.slug) continue;
      addEdge(from, `page:${slug}`, 'links_to', `llm-wiki/${p.page.slug}.md`, undefined, count);
    }
    // Citation layer: a page that cites a source draws from it.
    for (const id of p.sourceIds) {
      const nodeId = `source:${id}`;
      const source = sourceById.get(id);
      addNode({
        id: nodeId,
        kind: 'source',
        label: id,
        summary: source?.title ?? `Source group ${id} in the archive catalog.`,
        route: sourceRoute(id),
        periods: [], places: [], evidence: 'archive', origin: source?.origin ?? 'course',
      });
      addEdge(from, nodeId, 'draws_from', `llm-wiki/${p.page.slug}.md`);
    }
  }

  // Semantic layer: curated relations from frontmatter and entity records.
  const related = new Map<string, RelatedPage[]>();
  const addCurated = (fromId: string, target: string, type: EdgeType, source: string, note?: string) => {
    const toId = nodeIdFor(target);
    if (!toId) {
      problems.push({ file: source, message: `curated relation target "${target}" does not exist`, severity: 'error' });
      return;
    }
    addEdge(fromId, toId, type, source, note, 3);
  };

  for (const p of parsed) {
    for (const relation of p.page.frontmatter.relations ?? []) {
      addCurated(`page:${p.page.slug}`, relation.target, relation.type, `llm-wiki/${p.page.slug}.md`, relation.note);
    }
  }
  for (const entity of entities) {
    for (const relation of entity.relations ?? []) {
      addCurated(`entity:${entity.id}`, relation.target, relation.type, `content/entities (${entity.id})`, relation.note);
    }
  }
  for (const place of places) {
    if (place.slug) addCurated(`place:${place.id}`, place.slug, 'appears_in', `content/places.json (${place.id})`, `${place.label} is described on this page.`);
    for (const deity of place.deities) {
      const deityNode = nodeIdFor(deity);
      if (!deityNode) {
        problems.push({ file: `content/places.json (${place.id})`, message: `no entity for deity "${deity}"`, severity: 'warning' });
        continue;
      }
      addEdge(deityNode, `place:${place.id}`, 'practiced_at', `content/places.json (${place.id})`, `Cult presence at ${place.label}.`, 3);
    }
  }
  for (const period of periods) {
    if (period.slug) addCurated(`period:${period.id}`, period.slug, 'changes_during', `content/periods.json (${period.id})`, `${period.label} is set out on this page.`);
  }
  for (const journey of journeys) {
    for (const slug of journey.sourcePages) addCurated(`journey:${journey.id}`, slug, 'draws_from', `content/journeys/${journey.id}.json`, `${journey.title} is built from this article.`);
    // Legacy journeys predate scene-level semantic relations. Keep one
    // editorial anchor so their otherwise valid source-page links are visible
    // in the curated graph as well as the document layer.
    if (journey.sourcePages[0]) {
      addCurated(`journey:${journey.id}`, journey.sourcePages[0], 'associated_with', `content/journeys/${journey.id}.json`, `${journey.title} is anchored by its first reading page.`);
    }
    for (const id of journey.sourceIds) {
      const sourceNode = `source:${id}`;
      const source = sourceById.get(id);
      if (!nodes.has(sourceNode)) {
        addNode({ id: sourceNode, kind: 'source', label: id, summary: source?.title ?? `Source group ${id} in the archive catalog.`, route: sourceRoute(id), periods: [], places: [], evidence: 'archive', origin: source?.origin ?? journey.origin });
      }
      addEdge(`journey:${journey.id}`, sourceNode, 'draws_from', `content/journeys/${journey.id}.json`, undefined, 3);
    }
    for (const scene of journey.scenes) {
      for (const target of [...(scene.sourcePages ?? []), ...(scene.place ? [scene.place] : [])]) {
        const placeId = places.find((place) => place.id === target || place.label.toLowerCase() === target.toLowerCase())?.id;
        const targetId = nodeIdFor(placeId ?? target);
        if (targetId) addEdge(`journey:${journey.id}`, targetId, 'encountered_at', `content/journeys/${journey.id}.json#${scene.id}`, `${scene.title} is a documented stage in this journey.`, 2);
      }
    }
  }

  // Related pages for the article shell: curated edges first, strong links after.
  for (const page of pages) {
    const fromId = `page:${page.slug}`;
    const seen = new Set<string>();
    const list: RelatedPage[] = [];
    // Archive control pages link to everything; they are not "related reading".
    const consider = (edge: GraphEdge, otherId: string) => {
      const other = nodes.get(otherId);
      if (!other || other.kind === 'source' || !other.slug || other.slug === page.slug) return;
      if (seen.has(other.slug)) return;
      if (edge.type === 'links_to' && CONTROL_SLUGS.has(other.slug) && !CONTROL_SLUGS.has(page.slug)) return;
      const target = pageBySlug.get(other.slug);
      if (!target) return;
      seen.add(other.slug);
      // When the connection runs through a curated entity, name it, so the
      // panel can explain why the two pages are related rather than asserting it.
      const note = other.kind === 'article' || !other.label
        ? edge.note
        : `${other.label}${edge.note ? ` — ${edge.note}` : ' connects these pages.'}`;
      list.push({ slug: target.slug, title: target.title, route: target.route, relation: edge.type, note, summary: target.summary });
    };
    for (const edge of edges) {
      if (edge.type === 'links_to' || edge.type === 'draws_from') continue;
      if (edge.from === fromId) consider(edge, edge.to);
      else if (edge.to === fromId) consider(edge, edge.from);
    }
    for (const edge of edges.filter((e) => e.type === 'links_to').sort((a, b) => b.weight - a.weight)) {
      if (list.length >= 8) break;
      if (edge.from === fromId) consider(edge, edge.to);
      else if (edge.to === fromId) consider(edge, edge.from);
    }
    related.set(page.slug, list.slice(0, 8));
  }

  for (const edge of edges) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) continue;
    from.degree += 1;
    to.degree += 1;
    if (!DERIVED_TYPES.has(edge.type)) {
      from.semanticDegree += 1;
      to.semanticDegree += 1;
    }
  }

  reportGaps(nodes, edges, problems);

  const communities = addGraphAnalytics(nodes, edges);
  layout([...nodes.values()], edges);

  const data: GraphData = {
    generated: 'deterministic',
    nodes: [...nodes.values()],
    edges,
    edgeTypes: EDGE_TYPES,
    communities,
  };

  const adjacency = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    (adjacency.get(edge.from) ?? adjacency.set(edge.from, []).get(edge.from)!).push(edge);
    (adjacency.get(edge.to) ?? adjacency.set(edge.to, []).get(edge.to)!).push(edge);
  }

  return {
    data,
    relatedBySlug: related,
    neighborhood(slug: string): GraphSlice {
      const origin = `page:${slug}`;
      const local = (adjacency.get(origin) ?? [])
        .filter((edge) => edge.type !== 'draws_from' || edge.weight > 1)
        .sort((a, b) => rank(b) - rank(a))
        .slice(0, 18);
      const ids = new Set<string>([origin]);
      for (const edge of local) { ids.add(edge.from); ids.add(edge.to); }
      return {
        nodes: [...ids].map((id) => nodes.get(id)!).filter(Boolean),
        edges: local,
      };
    },
  };
}

function seededRng(seed = 0x6d2b79f5): () => number {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

/** Adds build-time analytics for the reviewed semantic graph. */
function addGraphAnalytics(nodes: Map<string, GraphNode>, edges: GraphEdge[]): GraphData['communities'] {
  const curatedEdges = edges
    .filter((edge) => !DERIVED_TYPES.has(edge.type))
    .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.type.localeCompare(b.type));
  const graph = new UndirectedGraph();
  const curatedIds = new Set<string>();
  for (const edge of curatedEdges) {
    curatedIds.add(edge.from);
    curatedIds.add(edge.to);
  }
  for (const id of [...curatedIds].sort()) graph.addNode(id);
  for (const edge of curatedEdges) graph.mergeUndirectedEdge(edge.from, edge.to, { weight: edge.weight });

  communitiesLouvain.assign(graph, { rng: seededRng() });
  const centrality = betweennessCentrality(graph);
  const members = new Map<number, GraphNode[]>();

  for (const node of nodes.values()) {
    if (!graph.hasNode(node.id)) {
      node.community = -1;
      node.betweenness = 0;
      continue;
    }
    node.community = graph.getNodeAttribute(node.id, 'community') as number;
    node.betweenness = Math.max(0, Math.min(1, centrality[node.id] ?? 0));
    const community = members.get(node.community) ?? [];
    community.push(node);
    members.set(node.community, community);
  }

  return [...members.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, community]) => {
      const representative = [...community].sort((a, b) =>
        b.betweenness - a.betweenness || a.label.localeCompare(b.label) || a.id.localeCompare(b.id),
      )[0];
      return { id, label: `Around: ${representative.label}`, size: community.length };
    });
}

/**
 * Warns about entities the graph cannot show. A missing relation is a gap in
 * the writing, so these stay warnings and the archive still ships while the
 * gap is filled.
 */
function reportGaps(nodes: Map<string, GraphNode>, edges: GraphEdge[], problems: BuildProblem[]): void {
  const joined = new Set<string>();
  for (const edge of edges) {
    joined.add(`${edge.from}\u0000${edge.to}`);
    joined.add(`${edge.to}\u0000${edge.from}`);
  }

  const all = [...nodes.values()];
  const compare = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const articleByLabel = new Map(all.filter((node) => node.kind === 'article').map((node) => [compare(node.label), node]));
  // Point the warning at the file where the relation would be written. Deities
  // come out of the field guide table, but a curated entity record overrides
  // that table, so the record is where their relations belong.
  const origin = (id: string) => {
    if (id.startsWith('journey:')) return 'content/journeys';
    if (id.startsWith('place:')) return 'content/places.json';
    if (id.startsWith('period:')) return 'content/periods.json';
    return 'content/entities';
  };

  for (const node of all) {
    if (node.kind === 'article' || node.kind === 'source') continue;
    if (node.semanticDegree === 0) {
      problems.push({
        file: origin(node.id),
        message: `${node.kind} "${node.label}" has no curated relation, so no path through the graph reaches it`,
        severity: 'warning',
      });
    }
    const article = articleByLabel.get(compare(node.label));
    if (article && !joined.has(`${node.id}\u0000${article.id}`)) {
      problems.push({
        file: origin(node.id),
        message: `${node.kind} "${node.label}" duplicates an article of the same name, and no relation joins them`,
        severity: 'warning',
      });
    }
  }

  for (const kind of NODE_KINDS) {
    if (!all.some((node) => node.kind === kind)) {
      problems.push({
        file: 'src/types/content.ts',
        message: `node kind "${kind}" is declared but no node uses it`,
        severity: 'warning',
      });
    }
  }
}

function rank(edge: GraphEdge): number {
  return (edge.type === 'links_to' ? 0 : 10) + edge.weight;
}

/**
 * Deterministic layout. A seeded radial placement gives a stable starting point,
 * then a fixed number of force iterations with no randomness anywhere. The same
 * input always produces the same coordinates, so the graph does not move on load
 * and reduced-motion users get the final positions immediately.
 */
function layout(nodes: GraphNode[], edges: GraphEdge[]): void {
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const kindAngle: Record<string, number> = {
    article: 0, concept: 0.7, deity: 1.4, place: 2.1, period: 2.8,
    practice: 3.5, text: 4.2, object: 4.6, role: 5.0, source: 5.6, journey: 6.0,
  };
  nodes.forEach((node, i) => {
    const spread = 1 + ((i * 2654435761) % 1000) / 1000;
    const angle = (kindAngle[node.kind] ?? 0) + (i % 37) * 0.17;
    const radius = 120 + spread * 260 - Math.min(node.degree, 20) * 9;
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
  });

  const positions = nodes.map((node) => ({ x: node.x, y: node.y }));
  const links = edges
    .map((edge) => ({ a: index.get(edge.from)!, b: index.get(edge.to)!, w: Math.min(edge.weight, 4) }))
    .filter((link) => link.a !== undefined && link.b !== undefined);

  for (let step = 0; step < 220; step += 1) {
    const cooling = 1 - step / 220;
    // Repulsion, computed on a coarse grid so this stays linear enough to run at build time.
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const distanceSq = dx * dx + dy * dy || 0.01;
        if (distanceSq > 90000) continue;
        const force = (2600 / distanceSq) * cooling;
        positions[i].x += dx * force;
        positions[i].y += dy * force;
        positions[j].x -= dx * force;
        positions[j].y -= dy * force;
      }
    }
    for (const link of links) {
      const dx = positions[link.b].x - positions[link.a].x;
      const dy = positions[link.b].y - positions[link.a].y;
      const distance = Math.hypot(dx, dy) || 0.01;
      const target = 150 - link.w * 12;
      const force = ((distance - target) / distance) * 0.045 * cooling * link.w;
      positions[link.a].x += dx * force;
      positions[link.a].y += dy * force;
      positions[link.b].x -= dx * force;
      positions[link.b].y -= dy * force;
    }
    for (const position of positions) {
      position.x *= 1 - 0.004 * cooling;
      position.y *= 1 - 0.004 * cooling;
    }
  }

  nodes.forEach((node, i) => {
    node.x = Math.round(positions[i].x * 10) / 10;
    node.y = Math.round(positions[i].y * 10) / 10;
  });
}
