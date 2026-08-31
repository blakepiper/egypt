// Query-time half of the search index. The index itself is a separate chunk and
// is fetched the first time search opens, so an ordinary article route never
// pays for it.

import type { ContentOrigin, SearchDoc, SearchIndex } from '../../types/content';

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  matchedHeadings: string[];
  excerpt: string;
}

export interface SearchFilters {
  section?: string | null;
  type?: string | null;
  period?: string | null;
  place?: string | null;
  evidence?: string | null;
  tag?: string | null;
  origin?: ContentOrigin | null;
}

let cached: SearchIndex | null = null;
let pending: Promise<SearchIndex> | null = null;

export function loadSearchIndex(): Promise<SearchIndex> {
  if (cached) return Promise.resolve(cached);
  const base = typeof document === 'undefined'
    ? '/'
    : document.querySelector('meta[name="archive-base"]')?.getAttribute('content') ?? '/';
  pending ??= fetch(base + 'generated/search-index.json')
    .then((response) => {
      if (!response.ok) throw new Error('Search index request failed');
      return response.json() as Promise<SearchIndex>;
    })
    .then((value) => { cached = value; return value; });
  return pending;
}

const STOPWORDS = new Set(['a', 'an', 'and', 'the', 'of', 'in', 'to', 'is', 'it', 'for', 'on', 'or']);

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .split(/[^a-z0-9']+/)
    .map((token) => token.replace(/^'+|'+$/g, ''))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function normalize(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('es') && !token.endsWith('ses')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/**
 * Field weights set the ranking order the plan calls for: exact title, alias,
 * heading, glossary or tag term, body occurrence, and source ID.
 */
const WEIGHTS: Record<number, number> = {
  1: 120,   // title
  2: 90,    // alias
  4: 45,    // heading
  8: 30,    // summary
  16: 6,    // body
  32: 20,   // tag, entity, period, place
  64: 70,   // source id
};

export function search(index: SearchIndex, query: string, filters: SearchFilters = {}, limit = 40): SearchHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const explicitlySeekingCatalog = tokens.some((token) => (
    /^[cr]\d+$/i.test(token)
    || ['source', 'sources', 'catalog', 'course', 'supplemental', 'research'].includes(token)
  ));
  const catalogIntent = tokens.includes('source') || tokens.includes('sources') || tokens.includes('catalog');
  const wantsCourseCatalog = catalogIntent && tokens.includes('course');
  const wantsResearchCatalog = catalogIntent && (tokens.includes('research') || tokens.includes('supplemental'));
  const scores = new Map<number, { score: number; headings: Set<number>; matchedTokens: Set<string> }>();

  for (const token of tokens) {
    const key = normalize(token);
    // Exact postings, plus a prefix sweep so partial words still find pages.
    const keys = index.postings[key]
      ? [key]
      : Object.keys(index.postings).filter((term) => term.startsWith(key)).slice(0, 24);
    for (const term of keys) {
      const exact = term === key;
      for (const [docId, fields, frequency, headingIndex] of index.postings[term]) {
        let score = 0;
        for (const bit of [1, 2, 4, 8, 16, 32, 64]) {
          if (fields & bit) score += WEIGHTS[bit] * (1 + Math.log(frequency));
        }
        if (!exact) score *= 0.45;
        const entry = scores.get(docId) ?? { score: 0, headings: new Set<number>(), matchedTokens: new Set<string>() };
        entry.score += score;
        entry.matchedTokens.add(key);
        if (headingIndex >= 0 && fields & 4) entry.headings.add(headingIndex);
        scores.set(docId, entry);
      }
    }
  }

  const hits: SearchHit[] = [];
  for (const [docId, entry] of scores) {
    const doc = index.docs[docId];
    if (!doc) continue;
    if (filters.section && doc.section !== filters.section) continue;
    if (filters.type && doc.type !== filters.type) continue;
    if (filters.evidence && doc.evidence !== filters.evidence) continue;
    if (filters.period && !doc.periods.includes(filters.period)) continue;
    if (filters.place && !doc.places.includes(filters.place)) continue;
    if (filters.tag && !doc.tags.includes(filters.tag)) continue;
    if (filters.origin && doc.origin !== filters.origin) continue;
    // Require every query token to appear somewhere in the page.
    const coverage = entry.matchedTokens.size / tokens.length;
    if (coverage < 1 && tokens.length > 1) entry.score *= coverage * 0.6;
    let catalogAdjustment = !explicitlySeekingCatalog && doc.type === 'source-catalog' ? 0.28 : 1;
    if (wantsCourseCatalog && doc.slug === 'source-catalog') catalogAdjustment = 6;
    if (wantsResearchCatalog && doc.slug === 'research-catalog') catalogAdjustment = 6;
    hits.push({
      doc,
      score: entry.score * catalogAdjustment,
      matchedHeadings: [...entry.headings].map((i) => doc.headings[i]?.text).filter(Boolean) as string[],
      excerpt: excerptFor(index, doc, tokens),
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title)).slice(0, limit);
}

function excerptFor(index: SearchIndex, doc: SearchDoc, tokens: string[]): string {
  const text = index.excerpts[doc.slug] ?? doc.summary;
  const lower = text.toLowerCase();
  const position = tokens.map((token) => lower.indexOf(token)).filter((value) => value >= 0).sort((a, b) => a - b)[0];
  if (position == null || position < 120) return trim(text.slice(0, 220));
  return `…${trim(text.slice(Math.max(0, position - 70), position + 170))}`;
}

function trim(text: string): string {
  return text.length < 210 ? text : `${text.slice(0, text.lastIndexOf(' ', 205))}…`;
}
