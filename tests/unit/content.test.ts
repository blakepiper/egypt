// Content-pipeline tests. They run against the real wiki, so a regression in
// parsing, linking, search ranking, or graph layout fails here first.

import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../scripts/content/build-content';
import { parseMarkdown, slugifyHeading, parseWikiTarget, annotateGlossary } from '../../scripts/content/lib/markdown';
import { buildSearchIndex } from '../../scripts/content/build-search';
import { search } from '../../src/features/search/searchClient';
import { collectRoutes } from '../../scripts/content/build-routes';
import type { BuildResult } from '../../scripts/content/build-content';
import type { SearchIndex } from '../../src/types/content';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

let result: BuildResult;

const EXPANDED_ARTICLES = [
  'studying-religion-through-egypt', 'predynastic-egypt-and-state-formation', 'egypt-and-mesopotamia-compared',
  'ritual-uncertainty-and-continuity', 'permanence-renewal-and-impermanence', 'egypt-and-early-buddhism',
  'households-work-and-unequal-access', 'writing-knowledge-and-administration', 'egypt-and-its-neighbors',
  'legacy-of-ancient-egypt', 'egyptian-religion-in-greek-and-roman-worlds', 'egypt-after-the-pharaohs',
  'egyptology-museums-and-colonialism', 'egyptomania-and-popular-culture', 'egypt-africa-and-modern-identity',
  'suffering-misfortune-and-divine-justice', 'illness-healing-and-protection', 'animals-gods-and-nonhuman-agency',
  'monuments-labor-and-building-eternity', 'egypt-in-biblical-and-christian-memory', 'nile-travel-dahabiyas-and-changing-river',
  'esna-khnum-temple-and-layered-town', 'el-kab-nekheb-city-and-provincial-memory', 'edfu-temple-town-and-sacred-history',
  'gebel-el-silsila-quarrying-sacred-landscape', 'kom-ombo-sobek-harwer-and-crocodiles',
  'living-nile-communities-work-food-and-hospitality', 'nubia-kush-displacement-and-living-identity',
];

beforeAll(() => {
  result = build();
});

describe('the content compiler', () => {
  it('ingests every content document in the manifest', () => {
    expect(result.pages).toHaveLength(result.manifest.counts.pages);
    const files = readdirSync(join(ROOT, 'llm-wiki')).filter((file) => file.endsWith('.md') && file !== 'AGENTS.md');
    expect(result.pages).toHaveLength(files.length);
  });

  it('publishes every planned article as a substantial supplemental page', () => {
    const pages = new Map(result.pages.map((page) => [page.slug, page]));
    for (const slug of EXPANDED_ARTICLES) {
      const page = pages.get(slug);
      expect(page, slug).toBeDefined();
      expect(page?.origin, slug).toBe('supplemental');
      expect(page?.words, slug).toBeGreaterThan(500);
      expect(page?.hasSources, slug).toBe(true);
    }
  });

  it('reports no errors against the current wiki', () => {
    const errors = result.problems.filter((problem) => problem.severity === 'error');
    expect(errors.map((problem) => `${problem.file}: ${problem.message}`)).toEqual([]);
  });

  it('gives every page a unique route under the wiki', () => {
    const routes = result.pages.map((page) => page.route);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every((route) => route.startsWith('/wiki/') && route.endsWith('/'))).toBe(true);
  });

  it('derives a summary for every page', () => {
    const missing = result.pages.filter((page) => !page.summary);
    expect(missing.map((page) => page.slug)).toEqual([]);
  });

  it('emits one static entry point per route with no collisions', () => {
    const routes = collectRoutes().map((route) => route.path);
    expect(new Set(routes).size).toBe(routes.length);
    for (const page of result.pages) expect(routes).toContain(page.route);
  });
});

describe('markdown parsing', () => {
  const resolver = {
    route: (slug: string) => (slug === 'set' ? '/wiki/set/' : null),
    hasSource: (id: string) => id === 'C19' || id === 'R001',
    sourceRoute: (id: string) => `${id.startsWith('R') ? '/archive/sources/?catalog=research' : '/archive/sources/'}#${id.toLowerCase()}`,
  };

  it('resolves wiki links, aliases, and heading fragments', () => {
    const parsed = parseMarkdown('See [[set|the god of confusion]] and [[set#Character and function]].', resolver, 'test');
    const paragraph = parsed.blocks[0];
    expect(paragraph.t).toBe('paragraph');
    const links = paragraph.t === 'paragraph' ? paragraph.c.filter((node) => node.t === 'link') : [];
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ href: '/wiki/set/', slug: 'set' });
    expect(links[1]).toMatchObject({ href: '/wiki/set/#character-and-function' });
    expect(parsed.problems).toEqual([]);
  });

  it('records an unresolved link as a build problem', () => {
    const parsed = parseMarkdown('See [[nowhere]].', resolver, 'test');
    expect(parsed.problems).toEqual(['unresolved wiki link [[nowhere]]']);
  });

  it('turns bare source IDs into catalog links only when the ID exists', () => {
    const parsed = parseMarkdown('Te Velde C19 and R001 support this. C99 does not exist.', resolver, 'test');
    expect(parsed.sourceIds).toEqual(['C19', 'R001']);
    expect(JSON.stringify(parsed.blocks)).toContain('/archive/sources/?catalog=research#r001');
  });

  it('accepts research callouts and gives empty labels a useful default', () => {
    const parsed = parseMarkdown('> [!research]\n> R001 records a bounded case.', resolver, 'test');
    expect(parsed.blocks[0]).toMatchObject({ t: 'callout', kind: 'research', label: 'Supplemental research' });
    expect(parsed.problems).toEqual([]);
  });

  it('rejects raw HTML', () => {
    const parsed = parseMarkdown('<script>alert(1)</script>', resolver, 'test');
    expect(parsed.problems.join(' ')).toMatch(/HTML is not allowed/);
  });

  it('reads evidence callouts and refuses unknown types', () => {
    const good = parseMarkdown('> [!uncertainty] What we cannot say\n> The flood varied year to year.', resolver, 'test');
    expect(good.blocks[0]).toMatchObject({ t: 'callout', kind: 'uncertainty', label: 'What we cannot say' });
    const bad = parseMarkdown('> [!nonsense] Nope\n> Body.', resolver, 'test');
    expect(bad.problems.join(' ')).toMatch(/unknown callout type/);
  });

  it('creates stable, unique heading IDs', () => {
    expect(slugifyHeading('Kemet and Deshret')).toBe('kemet-and-deshret');
    expect(slugifyHeading('Naydler’s alternative reading')).toBe('naydlers-alternative-reading');
    const parsed = parseMarkdown('## Sources\n\ntext\n\n## Sources\n\nmore', resolver, 'test');
    expect(parsed.toc.map((heading) => heading.id)).toEqual(['sources', 'sources-2']);
  });

  it('splits an Obsidian target into slug, hash, and label', () => {
    expect(parseWikiTarget('a-page#Some Heading|Label')).toEqual({ slug: 'a-page', hash: 'some-heading', label: 'Label' });
  });
});

describe('search ranking', () => {
  let index: SearchIndex;

  beforeAll(() => {
    index = JSON.parse(readFileSync(join(ROOT, 'src/generated/search-index.json'), 'utf8'));
  });

  const topSlug = (query: string) => search(index, query, {}, 5)[0]?.doc.slug;

  it('puts an exact title first', () => {
    expect(topSlug('sobek')).toBe('sobek');
    expect(topSlug('coffin texts')).toBe('coffin-texts');
    expect(topSlug('visual decoder')).toBe('visual-decoder');
  });

  it('finds pages by a source ID', () => {
    const hits = search(index, 'c19', {}, 10);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((hit) => hit.doc.slug)).toContain('set');
  });

  it('finds supplemental pages by a research source and keeps origin filters strict', () => {
    const hits = search(index, 'R082', {}, 20);
    expect(hits.map((hit) => hit.doc.slug)).toContain('living-nile-communities-work-food-and-hospitality');
    expect(search(index, 'R082', { origin: 'course' }, 20)).toEqual([]);
    expect(search(index, 'R082', { origin: 'supplemental' }, 20).every((hit) => hit.doc.origin === 'supplemental')).toBe(true);
  });

  it('finds a concept that appears in body text rather than a title', () => {
    const hits = search(index, 'apep', {}, 10).map((hit) => hit.doc.slug);
    expect(hits).toContain('solar-cycle');
  });

  it('applies filters', () => {
    const all = search(index, 'osiris', {}, 40);
    const archived = search(index, 'osiris', { section: 'archive' }, 40);
    expect(archived.length).toBeGreaterThan(0);
    expect(archived.length).toBeLessThan(all.length);
    expect(archived.every((hit) => hit.doc.section === 'archive')).toBe(true);
  });

  it('returns nothing for an empty query', () => {
    expect(search(index, '   ', {}, 10)).toEqual([]);
  });

  it('indexes headings so a section is reachable', () => {
    const hits = search(index, 'cult centers', {}, 10);
    expect(hits.map((hit) => hit.doc.slug)).toContain('sacred-geography');
  });

  it('returns a useful destination for every planned search intent', () => {
    const scenarios: [string, string[]][] = [
      ['who was first Egypt or Sumer', ['egypt-and-mesopotamia-compared']],
      ['first civilization', ['egypt-and-mesopotamia-compared']],
      ['Predynastic state formation', ['predynastic-egypt-and-state-formation']],
      ['why so much ritual', ['ritual-uncertainty-and-continuity']],
      ['Egyptian religion OCD', ['ritual-uncertainty-and-continuity']],
      ['ritual and anxiety', ['ritual-uncertainty-and-continuity']],
      ['permanence versus impermanence', ['egypt-and-early-buddhism', 'permanence-renewal-and-impermanence']],
      ['Egypt and Buddhism', ['egypt-and-early-buddhism']],
      ['did Buddha reject ritual', ['egypt-and-early-buddhism']],
      ['dukkha and Egyptian suffering', ['suffering-misfortune-and-divine-justice', 'egypt-and-early-buddhism']],
      ['what happened when ritual failed', ['ritual-uncertainty-and-continuity']],
      ['did Egyptians believe rituals always worked', ['ritual-uncertainty-and-continuity']],
      ['Egyptian fate dreams and oracles', ['festivals-oracles-and-personal-piety', 'ritual-uncertainty-and-continuity']],
      ['Egyptian medicine magic healing', ['illness-healing-and-protection']],
      ['childbirth protection ancient Egypt', ['illness-healing-and-protection']],
      ['sacred animals animal mummies', ['animals-gods-and-nonhuman-agency']],
      ['did Egyptians worship animals', ['animals-gods-and-nonhuman-agency']],
      ['how were pyramids built', ['monuments-labor-and-building-eternity']],
      ['slaves built the pyramids', ['monuments-labor-and-building-eternity']],
      ['aliens built the pyramids', ['monuments-labor-and-building-eternity']],
      ['ordinary people religion', ['studying-religion-through-egypt', 'households-work-and-unequal-access']],
      ['women work and literacy', ['households-work-and-unequal-access']],
      ['gender sexuality religion ancient Egypt', ['households-work-and-unequal-access']],
      ['music scent dance Egyptian religion', ['studying-religion-through-egypt']],
      ['Egypt Nubia Levant', ['egypt-and-its-neighbors']],
      ['Egyptian war empire smiting enemies', ['egypt-and-its-neighbors']],
      ['Coptic Egypt', ['egypt-after-the-pharaohs']],
      ['Islamic writers ancient Egypt', ['legacy-of-ancient-egypt']],
      ['Exodus historical evidence Egypt', ['egypt-in-biblical-and-christian-memory']],
      ['Moses and Akhenaten', ['amarna-and-late-transformations']],
      ['Egypt in the Bible', ['egypt-in-biblical-and-christian-memory']],
      ['Egypt influenced Western culture', ['legacy-of-ancient-egypt']],
      ['Egyptomania Art Deco', ['egyptomania-and-popular-culture']],
      ['museums colonialism provenance', ['egyptology-museums-and-colonialism']],
      ['Egypt Africa Afrocentrism', ['egypt-africa-and-modern-identity']],
      ['modern Kemetic religion', ['egypt-africa-and-modern-identity']],
      ['should museums display mummies', ['egyptology-museums-and-colonialism']],
      ['course sources only', ['source-catalog']],
      ['supplemental research only', ['research-catalog']],
      ['dahabiya Nile journey', ['nile-travel-dahabiyas-and-changing-river', 'journey-esna-to-aswan-dahabiya']],
      ['Esna Khnum temple and market', ['esna-khnum-temple-and-layered-town']],
      ['El Kab Nekhbet tombs', ['el-kab-nekheb-city-and-provincial-memory']],
      ['Edfu temple and Tell Edfu', ['edfu-temple-town-and-sacred-history']],
      ['Gebel el-Silsila quarry Horemheb', ['gebel-el-silsila-quarrying-sacred-landscape']],
      ['Kom Ombo Sobek crocodile museum', ['kom-ombo-sobek-harwer-and-crocodiles']],
      ['Bisaw fishing and bread', ['living-nile-communities-work-food-and-hospitality']],
      ['Daraw camel market', ['living-nile-communities-work-food-and-hospitality']],
      ['Nubian displacement High Dam', ['nubia-kush-displacement-and-living-identity']],
      ['Esna to Aswan cruise stops', ['journey-esna-to-aswan-dahabiya']],
    ];
    for (const [query, expected] of scenarios) {
      const slugs = search(index, query, {}, 5).map((hit) => hit.doc.slug);
      expect(slugs.some((slug) => expected.includes(slug)), query).toBe(true);
    }
  });
});

describe('search index construction', () => {
  it('records the field a term appeared in', () => {
    const index = buildSearchIndex([{
      meta: {
        slug: 'x', title: 'Maat', route: '/wiki/x/', type: 'concept', section: 'encyclopedia',
        tags: ['order'], summary: 'Right order.', aliases: ['right order'], periods: [], places: [], entities: [],
        updated: null, course: null, words: 3, readingMinutes: 1, headingCount: 1, hasSources: false,
        sourceIds: ['C02'], evidence: 'scholarship', origin: 'course',
      },
      toc: [{ id: 'h', level: 2, text: 'Judgment' }],
      text: 'The heart is weighed.',
    }]);
    expect(index.postings.maat[0][1] & 1).toBe(1);
    expect(index.postings.judgment[0][1] & 4).toBe(4);
    expect(index.postings.c02[0][1] & 64).toBe(64);
  });
});

describe('expanded registries', () => {
  it('keeps the course and research catalogs complete and distinct', () => {
    const sources = JSON.parse(readFileSync(join(ROOT, 'src/generated/sources.json'), 'utf8')) as Array<Record<string, unknown>>;
    expect(sources.filter((source) => String(source.id).startsWith('C'))).toHaveLength(36);
    const researchSources = sources.filter((source) => String(source.id).startsWith('R'));
    expect(researchSources.length).toBeGreaterThanOrEqual(81);
    expect(researchSources.map((source) => source.id)).toEqual(expect.arrayContaining(['R085', 'R086', 'R090', 'R096', 'R101', 'R103']));
    expect(researchSources.map((source) => Number(String(source.id).slice(1))).sort((a, b) => a - b))
      .toEqual(Array.from({ length: researchSources.length }, (_, index) => index + 1));
    const r069 = sources.find((source) => source.id === 'R069');
    expect(r069).toBeDefined();
    expect(r069).not.toHaveProperty('localLocator');
    expect(JSON.stringify(r069)).not.toMatch(/raw|\.pdf/i);
    expect(r069).not.toHaveProperty('url');
  });

  it('publishes all eight supplemental learning paths with reflections', () => {
    const paths = JSON.parse(readFileSync(join(ROOT, 'src/generated/paths.json'), 'utf8')) as Array<{
      id: string; origin: string; steps: { reflection?: string }[]; purpose?: string; orderReason?: string; leavesOut?: string;
      review?: { factual?: string; humanizer?: string; editorial?: string };
    }>;
    const required = ['what-religion-does', 'early-state-formation', 'ritual-continuity', 'permanence-and-impermanence', 'afterlives-of-egypt', 'vulnerable-bodies', 'material-more-than-human', 'prepare-esna-to-aswan'];
    expect(paths.filter((path) => required.includes(path.id))).toHaveLength(8);
    for (const id of required) {
      const path = paths.find((entry) => entry.id === id)!;
      expect(path.origin).toBe('supplemental');
      expect(path.purpose).toBeTruthy();
      expect(path.orderReason).toBeTruthy();
      expect(path.leavesOut).toBeTruthy();
      expect(path.steps.length).toBeGreaterThan(4);
      expect(path.steps.every((step) => step.reflection)).toBe(true);
    }
    expect(paths.every((path) => path.review?.factual === 'reviewed' && path.review?.humanizer === 'reviewed' && path.review?.editorial === 'reviewed')).toBe(true);
  });

  it('publishes J01 as twelve ordered, linked, privacy-safe stages', () => {
    const journeys = JSON.parse(readFileSync(join(ROOT, 'src/generated/journeys.json'), 'utf8')) as Array<{
      id: string; origin: string; scenes: { day?: number; sourcePages?: string[]; reflection?: string; place?: string; }[];
      includedScope?: string; optionalExtensions?: string; accessibleSummary: string;
    }>;
    const j01 = journeys.find((journey) => journey.id === 'esna-to-aswan-dahabiya');
    expect(j01).toBeDefined();
    expect(j01?.origin).toBe('supplemental');
    expect(j01?.scenes).toHaveLength(12);
    expect(j01?.scenes.every((scene) => scene.day && scene.sourcePages?.length && scene.reflection)).toBe(true);
    expect(j01?.includedScope).toBeTruthy();
    expect(j01?.optionalExtensions).toMatch(/not included/i);
    expect(j01?.accessibleSummary).toMatch(/stage 12/i);
    expect(JSON.stringify(j01)).not.toMatch(/exact coordinates|full address/i);
    expect(j01?.scenes.some((scene) => /el-hegz|bisaw|nubian-town|private-household/i.test(scene.place ?? ''))).toBe(false);
  });
});

describe('the knowledge graph', () => {
  it('produces a deterministic layout', () => {
    const first = result.manifest.counts;
    const graphPath = join(ROOT, 'src/generated/graph.json');
    const before = readFileSync(graphPath, 'utf8');
    const again = build();
    const after = readFileSync(graphPath, 'utf8');
    expect(again.manifest.counts.nodes).toBe(first.nodes);
    expect(after).toBe(before);
    const graph = JSON.parse(after) as { nodes: { x: number }[] };
    expect(graph.nodes.map((node) => node.x)).toEqual(JSON.parse(before).nodes.map((node: { x: number }) => node.x));
  });

  it('publishes curated communities and bridge scores', () => {
    const graph = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8')) as {
      communities?: { id: number; label: string; size: number }[];
      nodes: { community?: number; betweenness?: number }[];
    };
    expect(graph.communities?.length).toBeGreaterThanOrEqual(4);
    expect(graph.communities?.length).toBeLessThanOrEqual(12);
    expect(graph.communities?.every((community) => community.label.startsWith('Around: ') && community.size > 0)).toBe(true);
    expect(graph.nodes.every((node) => typeof node.community === 'number' && typeof node.betweenness === 'number')).toBe(true);
    expect(graph.nodes.every((node) => (node.betweenness ?? -1) >= 0 && (node.betweenness ?? 2) <= 1)).toBe(true);
  });

  it('records curated degree and archive control pages', () => {
    const graph = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8')) as {
      nodes: { id: string; semanticDegree?: number; control?: boolean }[];
      edges: { from: string; to: string; type: string }[];
    };
    const curated = new Set(['links_to', 'draws_from']);
    const degrees = new Map<string, number>();
    for (const edge of graph.edges) {
      if (curated.has(edge.type)) continue;
      degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
      degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
    }
    for (const node of graph.nodes) expect(node.semanticDegree).toBe(degrees.get(node.id) ?? 0);
    expect(graph.nodes.find((node) => node.id === 'page:coverage-map')?.control).toBe(true);
    expect(graph.nodes.find((node) => node.id === 'page:source-catalog')?.control).toBe(true);
  });

  it('reports entities no relation reaches, without failing the build', () => {
    const gaps = result.problems.filter((problem) => problem.message.includes('has no curated relation'));
    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) expect(gap.severity).toBe('warning');
    // Sobek is the case that prompted the check: an entity and an article of
    // the same name that the graph keeps as two unconnected nodes.
    expect(result.problems.some((problem) => problem.message.includes('duplicates an article of the same name'))).toBe(true);
    expect(result.problems.filter((problem) => problem.severity === 'error')).toHaveLength(0);
  });

  it('only uses relation types from the published vocabulary', () => {
    const graph = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8'));
    const allowed = new Set(graph.edgeTypes);
    for (const edge of graph.edges) expect(allowed.has(edge.type)).toBe(true);
  });

  it('includes the approved reception, embodiment, and journey relation vocabulary', () => {
    const graph = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8')) as { edgeTypes: string[]; edges: { type: string }[] };
    for (const type of ['transmitted_through', 'adapted_by', 'reinterpreted_by', 'manifested_in', 'encountered_at']) {
      expect(graph.edgeTypes).toContain(type);
      expect(graph.edges.some((edge) => edge.type === type)).toBe(true);
    }
  });

  it('gives every core article a useful neighbourhood', () => {
    const core = ['start-here', 'maat-isfet-and-kingship', 'solar-cycle', 'set', 'sobek', 'temples-priests-and-offerings'];
    for (const slug of core) {
      const article = JSON.parse(readFileSync(join(ROOT, `src/generated/articles/${slug}.json`), 'utf8'));
      expect(article.neighborhood.nodes.length).toBeGreaterThan(3);
      expect(article.neighborhood.edges.length).toBeGreaterThan(2);
    }
  });

  it('explains every curated relationship', () => {
    const graph = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8'));
    const curated = graph.edges.filter((edge: { type: string }) => edge.type !== 'links_to' && edge.type !== 'draws_from');
    expect(curated.length).toBeGreaterThan(40);
    for (const edge of curated) expect(edge.source).toBeTruthy();
  });
});

describe('media rights', () => {
  it('publishes no asset that is not cleared', () => {
    const published = JSON.parse(readFileSync(join(ROOT, 'src/generated/media.json'), 'utf8'));
    for (const record of published) expect(record.status).toBe('cleared');
  });
});

describe('glossary annotation', () => {
  it('derives terms from every glossary table, not only the first one', () => {
    const glossary = JSON.parse(readFileSync(join(ROOT, 'src/generated/glossary.json'), 'utf8')) as { term: string }[];
    expect(glossary.length).toBeGreaterThan(120);
    expect(glossary.map((entry) => entry.term)).toContain('religion');
    expect(glossary.map((entry) => entry.term)).toContain('dignity review');
  });
  it('marks the first use of a term and leaves later uses alone', () => {
    const glossary = [{ term: 'ka', definition: 'vital potency' }];
    const blocks = [
      { t: 'paragraph', c: [{ t: 'text', v: 'The ka receives offerings, and the ka persists.' }] },
      { t: 'paragraph', c: [{ t: 'text', v: 'A later mention of the ka.' }] },
    ] as never;
    annotateGlossary(blocks, glossary);
    const flat = JSON.stringify(blocks);
    expect(flat.match(/"t":"term"/g)).toHaveLength(1);
    expect(flat).toContain('vital potency');
  });

  it('never annotates a term inside a link', () => {
    const blocks = [{
      t: 'paragraph',
      c: [{ t: 'link', kind: 'internal', href: '/wiki/x/', c: [{ t: 'text', v: 'the ka' }] }],
    }] as never;
    annotateGlossary(blocks, [{ term: 'ka', definition: 'vital potency' }]);
    expect(JSON.stringify(blocks)).not.toContain('"t":"term"');
  });

  it('annotates real pages without changing their readable text', () => {
    const before = readFileSync(join(ROOT, 'llm-wiki/personhood-and-the-afterlife.md'), 'utf8');
    const article = JSON.parse(readFileSync(join(ROOT, 'src/generated/articles/personhood-and-the-afterlife.json'), 'utf8'));
    const terms: string[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === 'object') {
        const record = node as Record<string, unknown>;
        if (record.t === 'term') terms.push(String(record.v));
        Object.values(record).forEach(walk);
      }
    };
    walk(article.blocks);
    expect(terms.length).toBeGreaterThan(0);
    expect(new Set(terms).size).toBe(terms.length);
    for (const term of terms) expect(before.toLowerCase()).toContain(term.toLowerCase());
  });
});
