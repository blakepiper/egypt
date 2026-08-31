// Reads `llm-wiki/` and `content/` once and emits everything the application
// needs into `src/generated/`. The output is disposable: a clean build has to be
// able to recreate all of it from the Markdown and the curated JSON.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { parseMarkdown, flatten, titleize, slugifyHeading, annotateGlossary, type LinkResolver } from './lib/markdown.js';
import { BASE, REPOSITORY_URL, route, SECTION_BY_SLUG, FEATURE_PAGES, SECTION_LABELS, HUBS } from './lib/site.js';
import { buildGraph } from './build-graph.js';
import { buildSearchIndex } from './build-search.js';
import type {
  ArticlePayload, Backlink, ContentManifest, EvidenceKind, HeadingRef, MediaRecord,
  PageFrontmatter, PageSummary, Period, Place, Entity, SectionId, SourceEntry,
  Journey, KnowledgePath, NavSection, BlockNode, InlineNode,
} from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WIKI = join(ROOT, 'llm-wiki');
const CONTENT = join(ROOT, 'content');
const OUT = join(ROOT, 'src/generated');

export interface BuildProblem { file: string; message: string; severity: 'error' | 'warning' }

export interface BuildResult {
  manifest: ContentManifest;
  problems: BuildProblem[];
  pages: PageSummary[];
}

interface RawPage {
  slug: string;
  file: string;
  frontmatter: PageFrontmatter;
  body: string;
  title: string;
}

const IGNORED = new Set(['AGENTS.md']);

function readWikiFiles(): RawPage[] {
  const files = readdirSync(WIKI).filter((f) => f.endsWith('.md') && !IGNORED.has(f)).sort();
  return files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const source = readFileSync(join(WIKI, file), 'utf8');
    const { frontmatter, body } = splitFrontmatter(source);
    const titleMatch = body.match(/^#\s+(.+)$/m);
    return {
      slug,
      file,
      frontmatter,
      body,
      title: titleMatch ? titleMatch[1].trim() : titleize(slug),
    };
  });
}

function splitFrontmatter(source: string): { frontmatter: PageFrontmatter; body: string } {
  if (!source.startsWith('---\n')) {
    return { frontmatter: { type: 'note', tags: [] }, body: source };
  }
  const end = source.indexOf('\n---', 4);
  const raw = source.slice(4, end);
  const body = source.slice(end + 4).replace(/^\n/, '');
  const parsed = (loadYaml(raw) ?? {}) as Partial<PageFrontmatter>;
  return {
    frontmatter: {
      type: parsed.type ?? 'note',
      tags: parsed.tags ?? [],
      course: parsed.course,
      updated: parsed.updated ? String(parsed.updated) : undefined,
      summary: parsed.summary,
      aliases: parsed.aliases ?? [],
      periods: parsed.periods ?? [],
      places: parsed.places ?? [],
      entities: parsed.entities ?? [],
      media: parsed.media ?? [],
      relations: parsed.relations ?? [],
      review: parsed.review,
    },
    body,
  };
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function readJsonDir<T>(dir: string): T[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      const value = readJson<T | T[]>(join(dir, f));
      return Array.isArray(value) ? value : [value];
    });
}

/** Section for a page: explicit override, feature hub, or the encyclopedia. */
function sectionFor(slug: string): SectionId {
  return SECTION_BY_SLUG[slug] ?? 'encyclopedia';
}

function routeFor(slug: string): string {
  return route('wiki', slug);
}

/** The strongest evidence label the page carries, used for badges and filters. */
function evidenceFor(page: RawPage): EvidenceKind {
  const type = page.frontmatter.type;
  const tags = page.frontmatter.tags;
  if (type === 'object-study' || type === 'text-study') return 'primary';
  if (tags.includes('contested') || tags.includes('speculative') || page.slug === 'contested-interpretations') return 'speculative';
  if (['audit', 'source-catalog', 'course-map', 'course-guide', 'reading-notes', 'study-guide', 'study-plan', 'archive-synthesis'].includes(type)) return 'course';
  if (page.frontmatter.course && ['index', 'overview'].includes(type)) return 'course';
  return 'scholarship';
}

/** First substantive paragraph, trimmed to a preview length. */
function deriveSummary(blocks: BlockNode[]): string {
  for (const block of blocks) {
    if (block.t !== 'paragraph') continue;
    const text = flatten(block.c).trim();
    if (text.length < 40) continue;
    if (text.length <= 260) return text;
    const cut = text.slice(0, 260);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
    return stop > 120 ? cut.slice(0, stop + 1) : `${cut.trimEnd()}…`;
  }
  return '';
}

/** Parse `## C07 — Blue water-lily research project` blocks out of the catalog. */
function readSourceCatalog(page: RawPage): SourceEntry[] {
  const entries: SourceEntry[] = [];
  const lines = page.body.split('\n');
  let current: SourceEntry | null = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(C\d{2})\s+—\s+(.+)$/);
    if (heading) {
      current = { id: heading[1], title: heading[2].trim(), status: '', use: '', files: [], citedBy: [] };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const status = line.match(/^\*\*Status:\*\*\s*(.+?)\s*$/);
    if (status) { current.status = status[1].replace(/\s+$/, ''); continue; }
    const use = line.match(/^\*\*Use:\*\*\s*(.+)$/);
    if (use) { current.use = use[1]; continue; }
    const file = line.match(/^-\s*\[([^\]]+)\]\(<?([^)>]+)>?\)/);
    if (file) current.files.push({ label: file[1], path: file[2] });
  }
  return entries;
}

/** Turn the deity field guide's table into entity records. */
function readDeityTable(blocks: BlockNode[]): Entity[] {
  const table = blocks.find((b): b is Extract<BlockNode, { t: 'table' }> => b.t === 'table');
  if (!table) return [];
  return table.rows.map((row) => {
    const label = flatten(row[0]?.c ?? []).trim();
    const id = slugifyHeading(label.split('/')[0]);
    return {
      id,
      kind: 'deity' as const,
      label,
      aliases: label.split('/').map((part) => part.trim()).filter(Boolean),
      summary: flatten(row[2]?.c ?? []).trim(),
      iconography: splitList(flatten(row[1]?.c ?? [])),
      cultCenters: splitList(flatten(row[3]?.c ?? [])),
      slug: 'deity-field-guide',
      evidence: 'scholarship' as const,
      sourceIds: ['C02', 'C03', 'C04'],
    };
  });
}

function splitList(value: string): string[] {
  return value.split(/[;,]/).map((part) => part.trim()).filter(Boolean);
}

/** The glossary table, used for inline definitions on first use. */
function readGlossary(blocks: BlockNode[]): { term: string; definition: string }[] {
  const table = blocks.find((block): block is Extract<BlockNode, { t: 'table' }> => block.t === 'table');
  if (!table) return [];
  return table.rows
    .map((row) => ({ term: flatten(row[0]?.c ?? []).trim(), definition: flatten(row[1]?.c ?? []).trim() }))
    .filter((entry) => entry.term && entry.definition);
}

/** Sign and crown tables from the visual decoder, grouped by their heading. */
function readDecoder(blocks: BlockNode[]): { group: string; rows: { term: string; meaning: string }[] }[] {
  const groups: { group: string; rows: { term: string; meaning: string }[] }[] = [];
  let heading = 'Signs';
  for (const block of blocks) {
    if (block.t === 'heading' && block.level === 2) heading = block.text;
    if (block.t === 'table') {
      const rows = block.rows
        .map((row) => ({ term: flatten(row[0]?.c ?? []).trim(), meaning: flatten(row[1]?.c ?? []).trim() }))
        .filter((row) => row.term && row.meaning);
      if (rows.length) groups.push({ group: heading, rows });
    }
    if (block.t === 'list' && /crown|cue/i.test(heading)) {
      const rows = block.items
        .map((item) => {
          const text = item.map((b) => (b.t === 'paragraph' ? flatten(b.c) : '')).join(' ').trim();
          const split = text.split(/:\s|\s—\s/);
          return { term: split[0]?.replace(/\*\*/g, '').trim() ?? '', meaning: split.slice(1).join(': ').trim() };
        })
        .filter((row) => row.term && row.meaning);
      if (rows.length) groups.push({ group: heading, rows });
    }
  }
  return groups;
}


/** Every internal wiki slug referenced in a run of inline nodes. */
function allSlugs(nodes: InlineNode[]): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    if (node.t === 'link' && node.kind === 'internal' && node.slug) out.push(node.slug);
    if ('c' in node) out.push(...allSlugs(node.c));
  }
  return [...new Set(out)];
}

/** First internal wiki link inside a run of inline nodes, if there is one. */
function firstSlug(nodes: InlineNode[]): string | undefined {
  for (const node of nodes) {
    if (node.t === 'link' && node.kind === 'internal' && node.slug) return node.slug;
    if ('c' in node) {
      const nested = firstSlug(node.c);
      if (nested) return nested;
    }
  }
  return undefined;
}

function tablesIn(blocks: BlockNode[]): Extract<BlockNode, { t: 'table' }>[] {
  return blocks.filter((block): block is Extract<BlockNode, { t: 'table' }> => block.t === 'table');
}

/** Blocks that sit under a given level-2 heading. */
function sectionBlocks(blocks: BlockNode[], headingText: RegExp): BlockNode[] {
  const start = blocks.findIndex((block) => block.t === 'heading' && block.level === 2 && headingText.test(block.text));
  if (start === -1) return [];
  const rest = blocks.slice(start + 1);
  const end = rest.findIndex((block) => block.t === 'heading' && block.level === 2);
  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * The interactive views are generated from the wiki's own tables and sections,
 * so a visualisation cannot drift away from the article it illustrates.
 */
function buildVisualizations(parsedBySlug: Map<string, { blocks: BlockNode[] }>) {
  const personhoodPage = parsedBySlug.get('personhood-and-the-afterlife');
  const personhoodTable = personhoodPage ? tablesIn(personhoodPage.blocks)[0] : undefined;
  const personhood = {
    rows: (personhoodTable?.rows ?? []).map((row, index) => ({
      id: slugifyHeading(flatten(row[0]?.c ?? []).split('/')[0]),
      term: flatten(row[0]?.c ?? []).trim(),
      meaning: flatten(row[1]?.c ?? []).trim(),
      image: flatten(row[2]?.c ?? []).trim(),
      // A ring layout, computed here so the diagram is identical in every build.
      angle: Math.round(((index / Math.max(1, personhoodTable?.rows.length ?? 1)) * 360 - 90) * 10) / 10,
    })),
    problems: (sectionBlocks(personhoodPage?.blocks ?? [], /afterlife problem set/i)
      .find((block): block is Extract<BlockNode, { t: 'list' }> => block.t === 'list')?.items ?? [])
      .map((item) => {
        const text = item.map((block) => (block.t === 'paragraph' ? flatten(block.c) : '')).join(' ').trim();
        const [label, ...rest] = text.split(/:\s+/);
        return { label: label.replace(/[:*]/g, '').trim(), body: rest.join(': ').trim() };
      })
      .filter((entry) => entry.label && entry.body),
  };

  const corpusPage = parsedBySlug.get('funerary-text-tradition');
  const corpusTable = corpusPage ? tablesIn(corpusPage.blocks)[0] : undefined;
  const corpora = (corpusTable?.rows ?? []).map((row) => ({
    label: flatten(row[0]?.c ?? []).trim(),
    slug: firstSlug(row[0]?.c ?? []),
    prominence: flatten(row[1]?.c ?? []).trim(),
    medium: flatten(row[2]?.c ?? []).trim(),
    user: flatten(row[3]?.c ?? []).trim(),
    emphases: flatten(row[4]?.c ?? []).trim(),
  }));

  const creationPage = parsedBySlug.get('creation-traditions');
  const creation: { id: string; place: string; creator: string; body: string[] }[] = [];
  if (creationPage) {
    // The traditions are the level-2 sections between the shared grammar and the
    // page's closing discussion. Some are named "Place — creator"; others are not.
    let collecting = false;
    let current: { id: string; place: string; creator: string; body: string[] } | null = null;
    for (const block of creationPage.blocks) {
      if (block.t === 'heading' && block.level === 2) {
        const text = block.text;
        if (/recurrent grammar/i.test(text)) { collecting = true; current = null; continue; }
        if (/creation of humans|why temples|sources in this archive/i.test(text)) { collecting = false; current = null; continue; }
        if (!collecting) { current = null; continue; }
        const match = text.match(/^(.+?)\s+—\s+(.+)$/);
        current = match
          ? { id: block.id, place: match[1].trim(), creator: match[2].trim(), body: [] }
          : { id: block.id, place: text.trim(), creator: '', body: [] };
        creation.push(current);
        continue;
      }
      if (current && block.t === 'paragraph') current.body.push(flatten(block.c).trim());
    }
  }

  const grammar = sectionBlocks(creationPage?.blocks ?? [], /recurrent grammar/i)
    .find((block): block is Extract<BlockNode, { t: 'list' }> => block.t === 'list')?.items
    .map((item) => item.map((block) => (block.t === 'paragraph' ? flatten(block.c) : '')).join(' ').trim()) ?? [];

  // The four-week plan and the exam guide are turned into checklists the reader
  // can tick off locally. The text is the wiki's; only the structure is added.
  const planPage = parsedBySlug.get('four-week-relearning-plan');
  const weeks: { id: string; title: string; steps: { id: string; text: string; slugs: string[] }[]; checkpoint: string }[] = [];
  if (planPage) {
    let current: (typeof weeks)[number] | null = null;
    for (const block of planPage.blocks) {
      if (block.t === 'heading' && block.level === 2) {
        current = /^week\s/i.test(block.text) ? { id: block.id, title: block.text, steps: [], checkpoint: '' } : null;
        if (current) weeks.push(current);
        continue;
      }
      if (!current) continue;
      if (block.t === 'list' && block.ordered) {
        current.steps = block.items.map((item, index) => {
          const inline = item.flatMap((entry) => (entry.t === 'paragraph' ? entry.c : []));
          return { id: `${current!.id}-${index + 1}`, text: flatten(inline).trim(), slugs: allSlugs(inline) };
        });
      }
      if (block.t === 'paragraph') {
        const text = flatten(block.c).trim();
        if (/^checkpoint:/i.test(text)) current.checkpoint = text.replace(/^checkpoint:\s*/i, '');
      }
    }
  }

  const examPage = parsedBySlug.get('exam-recovery-guide');
  const exams: { id: string; title: string; lead: string; prompts: string[]; caution: string }[] = [];
  if (examPage) {
    let current: (typeof exams)[number] | null = null;
    for (const block of examPage.blocks) {
      if (block.t === 'heading' && block.level === 2) {
        current = /^exam\s/i.test(block.text) ? { id: block.id, title: block.text, lead: '', prompts: [], caution: '' } : null;
        if (current) exams.push(current);
        continue;
      }
      if (!current) continue;
      if (block.t === 'list' && !block.ordered) {
        current.prompts = block.items.map((item) => item.map((entry) => (entry.t === 'paragraph' ? flatten(entry.c) : '')).join(' ').trim().replace(/;$/, ''));
      }
      if (block.t === 'paragraph') {
        const text = flatten(block.c).trim();
        if (/^possible corrections/i.test(text)) current.caution = text;
        else if (!current.lead) current.lead = text;
      }
    }
  }

  return { personhood, corpora, creation, grammar, weeks, exams };
}

export function build(): BuildResult {
  const problems: BuildProblem[] = [];
  const raw = readWikiFiles();
  const bySlug = new Map(raw.map((page) => [page.slug, page]));

  const periods = readJson<Period[]>(join(CONTENT, 'periods.json'));
  const places = readJson<Place[]>(join(CONTENT, 'places.json'));
  const entities = readJsonDir<Entity>(join(CONTENT, 'entities'));
  const paths = readJsonDir<KnowledgePath>(join(CONTENT, 'paths'));
  const journeys = readJsonDir<Journey>(join(CONTENT, 'journeys'));
  const objects = readJsonDir<{ id: string; slug: string; sourceIds: string[] }>(join(CONTENT, 'objects'));
  const media = readJson<MediaRecord[]>(join(CONTENT, 'media-manifest.json'));

  const catalogPage = bySlug.get('source-catalog');
  const sources = catalogPage ? readSourceCatalog(catalogPage) : [];
  const sourceIds = new Set(sources.map((s) => s.id));
  const mediaById = new Map(media.map((m) => [m.id, m]));

  const resolver: LinkResolver = {
    route: (slug) => (bySlug.has(slug) ? routeFor(slug) : null),
    hasSource: (id) => sourceIds.has(id),
    sourceRoute: (id) => `${routeFor('source-catalog')}#${id.toLowerCase()}`,
  };

  // --- Pass 1: parse every page -------------------------------------------
  interface Parsed {
    page: RawPage;
    blocks: BlockNode[];
    toc: HeadingRef[];
    links: { slug: string; hash: string | null; context: string }[];
    sourceIds: string[];
    mediaIds: string[];
    words: number;
    text: string;
    summary: string;
  }

  const parsed: Parsed[] = raw.map((page) => {
    const result = parseMarkdown(page.body, resolver, page.slug);
    for (const problem of result.problems) {
      problems.push({ file: page.file, message: problem, severity: 'error' });
    }
    const seen = new Set<string>();
    for (const heading of result.toc) {
      if (seen.has(heading.id)) problems.push({ file: page.file, message: `duplicate heading id "${heading.id}"`, severity: 'error' });
      seen.add(heading.id);
    }
    for (const id of result.mediaIds) {
      const record = mediaById.get(id);
      if (!record) problems.push({ file: page.file, message: `unknown media id "${id}"`, severity: 'error' });
      else if (record.status !== 'cleared') problems.push({ file: page.file, message: `media "${id}" is ${record.status} and cannot be published`, severity: 'error' });
    }
    return {
      page,
      blocks: result.blocks,
      toc: result.toc,
      links: result.links,
      sourceIds: result.sourceIds,
      mediaIds: result.mediaIds,
      words: result.words,
      text: result.text,
      summary: page.frontmatter.summary ?? deriveSummary(result.blocks),
    };
  });

  const parsedBySlug = new Map(parsed.map((p) => [p.page.slug, p]));

  // --- Pass 2: page summaries ---------------------------------------------
  const pages: PageSummary[] = parsed.map((p) => {
    const section = sectionFor(p.page.slug);
    return {
      slug: p.page.slug,
      title: p.page.title,
      route: routeFor(p.page.slug),
      type: p.page.frontmatter.type,
      section,
      tags: p.page.frontmatter.tags,
      summary: p.summary,
      aliases: p.page.frontmatter.aliases ?? [],
      periods: p.page.frontmatter.periods ?? [],
      places: p.page.frontmatter.places ?? [],
      entities: p.page.frontmatter.entities ?? [],
      updated: p.page.frontmatter.updated ?? null,
      course: p.page.frontmatter.course ?? null,
      words: p.words,
      readingMinutes: Math.max(1, Math.round(p.words / 220)),
      headingCount: p.toc.length,
      hasSources: p.toc.some((h) => h.text.toLowerCase().startsWith('sources in this archive')),
      sourceIds: p.sourceIds,
      evidence: evidenceFor(p.page),
    };
  });
  const pageBySlug = new Map(pages.map((p) => [p.slug, p]));

  // --- Pass 3: registries derived from wiki tables -------------------------
  const deityPage = parsedBySlug.get('deity-field-guide');
  const deities = deityPage ? readDeityTable(deityPage.blocks) : [];
  const glossaryPage = parsedBySlug.get('glossary');
  const glossary = glossaryPage ? readGlossary(glossaryPage.blocks) : [];
  const decoderPage = parsedBySlug.get('visual-decoder');
  const decoder = decoderPage ? readDecoder(decoderPage.blocks) : [];
  const visualizations = buildVisualizations(parsedBySlug);

  // Some ideas are both a concept and a deity — Maat, Heka, and Nun above all.
  // The curated record stays primary and absorbs the field guide's iconography
  // rather than being shadowed by a duplicate node.
  const curatedById = new Map(entities.map((entity) => [entity.id, entity]));
  const freshDeities: Entity[] = [];
  for (const deity of deities) {
    const existing = curatedById.get(deity.id);
    if (!existing) { freshDeities.push(deity); continue; }
    existing.iconography = deity.iconography;
    existing.cultCenters = deity.cultCenters;
    existing.aliases = [...new Set([...existing.aliases, ...deity.aliases])];
  }
  const allEntities = [...entities, ...freshDeities];
  const duplicates = allEntities.map((entity) => entity.id).filter((id, index, list) => list.indexOf(id) !== index);
  for (const id of new Set(duplicates)) {
    problems.push({ file: 'content/entities', message: `duplicate entity id "${id}"`, severity: 'error' });
  }

  // --- Pass 3b: graph ------------------------------------------------------
  const graph = buildGraph({ pages, parsed, entities: allEntities, periods, places, journeys, problems });

  // Backlinks, grouped by the relationship that produced them.
  const backlinks = new Map<string, Backlink[]>();
  for (const p of parsed) {
    const from = pageBySlug.get(p.page.slug)!;
    const grouped = new Map<string, string[]>();
    for (const link of p.links) {
      if (link.slug === p.page.slug) continue;
      const list = grouped.get(link.slug) ?? [];
      if (!list.includes(link.context)) list.push(link.context);
      grouped.set(link.slug, list);
    }
    for (const [target, contexts] of grouped) {
      const curated = (p.page.frontmatter.relations ?? []).find((r) => r.target === target);
      const list = backlinks.get(target) ?? [];
      list.push({ slug: from.slug, title: from.title, route: from.route, contexts, relation: curated?.type ?? 'links_to' });
      backlinks.set(target, list);
    }
  }

  // Glossary annotation happens after every page is parsed, because the term
  // list itself is read out of one of those pages.
  for (const p of parsed) {
    if (p.page.slug === 'glossary') continue;
    annotateGlossary(p.blocks, glossary);
  }

  // --- Pass 4: article payloads -------------------------------------------
  mkdirSync(join(OUT, 'articles'), { recursive: true });
  for (const p of parsed) {
    const meta = pageBySlug.get(p.page.slug)!;
    const outgoingSlugs = [...new Set(p.links.map((l) => l.slug))].filter((s) => s !== p.page.slug);
    const related = graph.relatedBySlug.get(p.page.slug) ?? [];
    const payload: ArticlePayload = {
      slug: p.page.slug,
      title: p.page.title,
      route: meta.route,
      meta,
      blocks: p.blocks,
      toc: p.toc,
      sourceIds: p.sourceIds,
      outgoing: outgoingSlugs.map((slug) => {
        const target = pageBySlug.get(slug)!;
        return { slug, title: target.title, route: target.route };
      }),
      backlinks: (backlinks.get(p.page.slug) ?? []).sort((a, b) => a.title.localeCompare(b.title)),
      related,
      neighborhood: graph.neighborhood(p.page.slug),
      sourcePath: `llm-wiki/${p.page.file}`,
    };
    writeFileSync(join(OUT, 'articles', `${p.page.slug}.json`), JSON.stringify(payload));
  }

  // --- Pass 5: curated registry validation ---------------------------------
  const entityIds = new Set(allEntities.map((e) => e.id));
  for (const entity of entities) {
    for (const relation of entity.relations ?? []) {
      if (!bySlug.has(relation.target) && !entityIds.has(relation.target) && !places.some((pl) => pl.id === relation.target) && !periods.some((pe) => pe.id === relation.target)) {
        problems.push({ file: `content/entities (${entity.id})`, message: `relation target "${relation.target}" does not exist`, severity: 'error' });
      }
    }
  }
  for (const list of [periods.map((p) => p.slug), places.map((p) => p.slug), paths.flatMap((p) => p.steps.map((s) => s.slug)), journeys.flatMap((j) => j.sourcePages), objects.map((o) => o.slug)]) {
    for (const slug of list) {
      if (slug && !bySlug.has(slug)) problems.push({ file: 'content/', message: `curated reference to unknown page "${slug}"`, severity: 'error' });
    }
  }
  for (const id of [...periods.flatMap((p) => p.sourceIds ?? []), ...places.flatMap((p) => p.sourceIds ?? []), ...entities.flatMap((e) => e.sourceIds ?? []), ...journeys.flatMap((j) => j.sourceIds), ...objects.flatMap((o) => o.sourceIds)]) {
    if (!sourceIds.has(id)) problems.push({ file: 'content/', message: `curated reference to unknown source "${id}"`, severity: 'error' });
  }

  // --- Pass 6: navigation --------------------------------------------------
  const navigation = buildNavigation(pages, pageBySlug, journeys, paths);

  // --- Pass 7: search ------------------------------------------------------
  const searchIndex = buildSearchIndex(parsed.map((p) => ({
    meta: pageBySlug.get(p.page.slug)!,
    toc: p.toc,
    text: p.text,
  })));

  const manifest: ContentManifest = {
    generated: new Date().toISOString(),
    base: BASE,
    repositoryUrl: REPOSITORY_URL,
    pages,
    routes: [...new Set([...pages.map((p) => p.route), ...staticRoutes(journeys)])],
    counts: {
      pages: pages.length,
      words: pages.reduce((total, page) => total + page.words, 0),
      sources: sources.length,
      entities: allEntities.length,
      places: places.length,
      periods: periods.length,
      journeys: journeys.length,
      paths: paths.length,
      nodes: graph.data.nodes.length,
      edges: graph.data.edges.length,
      media: media.length,
      clearedMedia: media.filter((m) => m.status === 'cleared').length,
    },
  };

  // Route collisions would silently overwrite generated HTML entry points.
  const seenRoutes = new Set<string>();
  for (const r of manifest.routes) {
    if (seenRoutes.has(r)) problems.push({ file: 'routes', message: `duplicate route ${r}`, severity: 'error' });
    seenRoutes.add(r);
  }

  // Orphan check: every page must be reachable from a hub, another page, or a listing.
  const hubSlugs = new Set(HUBS.flatMap((h) => h.slugs));
  const linked = new Set(parsed.flatMap((p) => p.links.map((l) => l.slug)));
  for (const page of pages) {
    if (page.slug === 'index') continue;
    const listed = navigation.some((section) => section.groups.some((g) => g.pages.some((entry) => entry.slug === page.slug)));
    if (!hubSlugs.has(page.slug) && !linked.has(page.slug) && !listed) {
      problems.push({ file: `llm-wiki/${page.slug}.md`, message: 'page is not reachable from a hub, a link, or a listing', severity: 'error' });
    }
    if (!page.summary) problems.push({ file: `llm-wiki/${page.slug}.md`, message: 'no summary could be derived', severity: 'warning' });
    if (page.words > 400 && !page.hasSources && !['index', 'log', 'coverage-map', 'source-catalog', 'web-research-supplement'].includes(page.slug)) {
      problems.push({ file: `llm-wiki/${page.slug}.md`, message: 'substantive page has no "Sources in this archive" section', severity: 'warning' });
    }
  }

  // --- Write ---------------------------------------------------------------
  write('content-manifest.json', manifest);
  write('navigation.json', navigation);
  write('search-index.json', searchIndex);
  write('graph.json', graph.data);
  write('entities.json', allEntities);
  write('periods.json', periods);
  write('places.json', places);
  write('media.json', media.filter((m) => m.status === 'cleared'));
  write('sources.json', withCitations(sources, pages));
  write('journeys.json', journeys);
  write('paths.json', paths);
  write('decoder.json', decoder);
  write('objects.json', objects);
  write('visualizations.json', visualizations);
  write('glossary.json', glossary);
  writeFileSync(join(OUT, 'index.ts'), GENERATED_INDEX);

  return { manifest, problems, pages };
}

function withCitations(sources: SourceEntry[], pages: PageSummary[]): SourceEntry[] {
  return sources.map((source) => ({
    ...source,
    citedBy: pages.filter((page) => page.sourceIds.includes(source.id)).map((page) => page.slug),
  }));
}

function staticRoutes(journeys: Journey[]): string[] {
  return [
    route(),
    route('wiki'),
    route('atlas'),
    route('chronology'),
    route('graph'),
    route('journeys'),
    ...journeys.map((j) => route('journeys', j.id)),
    route('objects'),
    route('objects', 'plate-30'),
    route('objects', 'decoder'),
    route('learn'),
    route('archive'),
    route('archive', 'sources'),
    route('field-guide'),
    route('search'),
    route('browse'),
    route('specimen'),
    route('about'),
  ];
}

function buildNavigation(
  pages: PageSummary[],
  bySlug: Map<string, PageSummary>,
  journeys: Journey[],
  paths: KnowledgePath[],
): NavSection[] {
  const entry = (slug: string) => {
    const page = bySlug.get(slug);
    return page ? [{ slug, title: page.title, route: page.route, summary: page.summary }] : [];
  };
  const bySection = (section: SectionId) =>
    pages.filter((page) => page.section === section).map((page) => ({ slug: page.slug, title: page.title, route: page.route, summary: page.summary }));

  return [
    { id: 'encyclopedia', label: SECTION_LABELS.encyclopedia, route: route('wiki'),
      blurb: 'Every article in the archive, grouped the way the course grouped them.',
      groups: HUBS.map((hub) => ({ label: hub.label, pages: hub.slugs.flatMap(entry) })) },
    { id: 'atlas', label: SECTION_LABELS.atlas, route: route('atlas'),
      blurb: 'Sacred geography, cult centres, and the orientation errors worth correcting first.',
      groups: [{ label: 'Reading', pages: [...entry('sacred-geography'), ...entry('sobek'), ...entry('egypt-trip-field-guide')] }] },
    { id: 'chronology', label: SECTION_LABELS.chronology, route: route('chronology'),
      blurb: 'Periods, overlapping corpora, and what survives from each stretch of time.',
      groups: [{ label: 'Reading', pages: [...entry('chronology'), ...entry('funerary-text-tradition'), ...entry('amarna-and-late-transformations')] }] },
    { id: 'journeys', label: SECTION_LABELS.journeys, route: route('journeys'),
      blurb: 'Guided sequences with their evidence and limits stated in the same view.',
      groups: [
        { label: 'Guided experiences', pages: journeys.map((j) => ({ slug: j.id, title: j.title, route: route('journeys', j.id), summary: j.subtitle })) },
        { label: 'Knowledge paths', pages: paths.map((p) => ({ slug: p.id, title: p.title, route: `${route('graph')}?path=${p.id}`, summary: p.blurb })) },
      ] },
    { id: 'objects', label: SECTION_LABELS.objects, route: route('objects'),
      blurb: 'Close reading of texts and images.',
      groups: [{ label: 'Studies', pages: Object.keys(FEATURE_PAGES).filter((slug) => FEATURE_PAGES[slug] === 'objects').flatMap(entry) }] },
    { id: 'learn', label: SECTION_LABELS.learn, route: route('learn'),
      blurb: 'The course as it ran, and a route back through it.',
      groups: [{ label: 'Course', pages: bySection('learn') }] },
    { id: 'archive', label: SECTION_LABELS.archive, route: route('archive'),
      blurb: 'Sources, audits, student work, and the maintenance record.',
      groups: [{ label: 'Provenance and control', pages: bySection('archive') }] },
    { id: 'field-guide', label: SECTION_LABELS['field-guide'], route: route('field-guide'),
      blurb: 'What to notice at sites and museums.',
      groups: [{ label: 'In the field', pages: [...bySection('field-guide'), ...entry('visual-decoder'), ...entry('deity-field-guide')] }] },
  ];
}

function write(name: string, value: unknown): void {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, name), JSON.stringify(value));
}

const GENERATED_INDEX = `// Generated by scripts/content/build-content.ts. Do not edit.
import manifest from './content-manifest.json';
import navigation from './navigation.json';
import entities from './entities.json';
import periods from './periods.json';
import places from './places.json';
import media from './media.json';
import sources from './sources.json';
import journeys from './journeys.json';
import paths from './paths.json';
import decoder from './decoder.json';
import objects from './objects.json';
import visualizations from './visualizations.json';
import glossary from './glossary.json';
import type {
  ContentManifest, NavSection, Entity, Period, Place, MediaRecord, SourceEntry, Journey, KnowledgePath, ObjectStudy, VisualizationData,
} from '../types/content';

export const contentManifest = manifest as unknown as ContentManifest;
export const navigationSections = navigation as unknown as NavSection[];
export const allEntities = entities as unknown as Entity[];
export const allPeriods = periods as unknown as Period[];
export const allPlaces = places as unknown as Place[];
export const allMedia = media as unknown as MediaRecord[];
export const allSources = sources as unknown as SourceEntry[];
export const allJourneys = journeys as unknown as Journey[];
export const allPaths = paths as unknown as KnowledgePath[];
export const decoderGroups = decoder as unknown as { group: string; rows: { term: string; meaning: string }[] }[];
export const allObjects = objects as unknown as ObjectStudy[];
export const visualizationData = visualizations as unknown as VisualizationData;
export const glossaryTerms = glossary as unknown as { term: string; definition: string }[];
export const allPages = contentManifest.pages;
`;

// Running the script directly performs a clean build and reports problems.
if (import.meta.url === `file://${process.argv[1]}`) {
  rmSync(OUT, { recursive: true, force: true });
  const result = build();
  const errors = result.problems.filter((p) => p.severity === 'error');
  const warnings = result.problems.filter((p) => p.severity === 'warning');
  for (const problem of result.problems) {
    console.log(`${problem.severity === 'error' ? 'error' : 'warn '}  ${problem.file}: ${problem.message}`);
  }
  console.log(`\n${result.pages.length} pages, ${result.manifest.counts.words.toLocaleString()} words, ${result.manifest.counts.nodes} graph nodes, ${result.manifest.counts.edges} edges`);
  console.log(`${errors.length} errors, ${warnings.length} warnings`);
  if (errors.length) process.exitCode = 1;
}
