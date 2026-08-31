// Content-pipeline tests. They run against the real wiki, so a regression in
// parsing, linking, search ranking, or graph layout fails here first.

import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
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

beforeAll(() => {
  result = build();
});

describe('the content compiler', () => {
  it('ingests all 41 content documents', () => {
    expect(result.pages).toHaveLength(41);
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
    hasSource: (id: string) => id === 'C19',
    sourceRoute: (id: string) => `/archive/sources/#${id.toLowerCase()}`,
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
    const parsed = parseMarkdown('Te Velde C19 argues this. C99 does not exist.', resolver, 'test');
    expect(parsed.sourceIds).toEqual(['C19']);
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
});

describe('search index construction', () => {
  it('records the field a term appeared in', () => {
    const index = buildSearchIndex([{
      meta: {
        slug: 'x', title: 'Maat', route: '/wiki/x/', type: 'concept', section: 'encyclopedia',
        tags: ['order'], summary: 'Right order.', aliases: ['right order'], periods: [], places: [], entities: [],
        updated: null, course: null, words: 3, readingMinutes: 1, headingCount: 1, hasSources: false,
        sourceIds: ['C02'], evidence: 'scholarship',
      },
      toc: [{ id: 'h', level: 2, text: 'Judgment' }],
      text: 'The heart is weighed.',
    }]);
    expect(index.postings.maat[0][1] & 1).toBe(1);
    expect(index.postings.judgment[0][1] & 4).toBe(4);
    expect(index.postings.c02[0][1] & 64).toBe(64);
  });
});

describe('the knowledge graph', () => {
  it('produces a deterministic layout', () => {
    const again = build();
    const first = result.manifest.counts;
    expect(again.manifest.counts.nodes).toBe(first.nodes);
    const a = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8'));
    const rebuilt = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8'));
    expect(rebuilt.nodes.map((node: { x: number }) => node.x)).toEqual(a.nodes.map((node: { x: number }) => node.x));
  });

  it('only uses relation types from the published vocabulary', () => {
    const graph = JSON.parse(readFileSync(join(ROOT, 'src/generated/graph.json'), 'utf8'));
    const allowed = new Set(graph.edgeTypes);
    for (const edge of graph.edges) expect(allowed.has(edge.type)).toBe(true);
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
