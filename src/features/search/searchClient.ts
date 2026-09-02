// Query-time half of the search index. The index itself is a separate chunk and
// is fetched the first time search opens, so an ordinary article route never
// pays for it.

import type { ContentOrigin, HeadingRef, SearchDoc, SearchIndex } from '../../types/content';

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  matchedHeadings: HeadingRef[];
  excerpt: string;
  exactTitleOrAlias: boolean;
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

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'for', 'from', 'had', 'has',
  'have', 'he', 'her', 'his', 'in', 'into', 'is', 'it', 'its', 'not', 'of', 'on', 'or', 'she',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'were',
  'which', 'who', 'with', 'you', 'your', 'so', 'if', 'than', 'when', 'what', 'how', 'why',
]);

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .split(/[^a-z0-9']+/)
    .map((token) => token.replace(/^'+|'+$/g, ''))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function normalize(token: string): string {
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

const PREFIX_SCORE = 0.45;
const FUZZY_SCORE = 0.35;
const PHRASE_TITLE_BOOST = 480;
const PHRASE_ALIAS_BOOST = 360;
const PHRASE_HEADING_BOOST = 500;

type TermMatch = { term: string; multiplier: number };
type RankedEntry = { score: number; headings: Set<number>; matchedTokens: Set<string>; excerptTerms: Set<string> };

function normalizedPhrase(value: string): string {
  return tokenize(value).map(normalize).join(' ');
}

function documentFrequencies(index: SearchIndex): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const [term, postings] of Object.entries(index.postings)) {
    frequencies.set(term, new Set(postings.map((posting) => posting[0])).size);
  }
  return frequencies;
}

function damerauDistance(a: string, b: string, maximum: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maximum) return maximum + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  let previousPrevious: number[] | undefined;
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    let rowMinimum = current[0];
    for (let column = 1; column <= b.length; column += 1) {
      let distance = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
      if (
        row > 1 && column > 1 && previousPrevious
        && a[row - 1] === b[column - 2]
        && a[row - 2] === b[column - 1]
      ) {
        distance = Math.min(distance, previousPrevious[column - 2] + 1);
      }
      current[column] = distance;
      rowMinimum = Math.min(rowMinimum, distance);
    }
    if (rowMinimum > maximum) return maximum + 1;
    previousPrevious = previous;
    previous = current;
  }
  return previous[b.length];
}

function correctionFor(key: string, vocabulary: string[]): string | null {
  // A source ID is an address in the source catalog, not a prose word. Never
  // turn a mistyped ID into a different record.
  if (/^[cr]\d+$/i.test(key)) return null;
  const maximum = key.length <= 4 ? 1 : 2;
  let best: { term: string; distance: number } | null = null;
  for (const term of vocabulary) {
    if (term[0] !== key[0] || Math.abs(term.length - key.length) > maximum) continue;
    const distance = damerauDistance(key, term, maximum);
    if (distance > maximum) continue;
    if (!best || distance < best.distance || (distance === best.distance && term < best.term)) {
      best = { term, distance };
    }
  }
  return best?.term ?? null;
}

function termsFor(index: SearchIndex, key: string, vocabulary: string[]): TermMatch[] {
  if (index.postings[key]) return [{ term: key, multiplier: 1 }];

  // Prefix matches are the normal partial-word affordance and take precedence
  // over typo correction whenever they exist.
  const prefixes = vocabulary.filter((term) => term.startsWith(key)).slice(0, 24);
  if (prefixes.length) return prefixes.map((term) => ({ term, multiplier: PREFIX_SCORE }));

  const correction = correctionFor(key, vocabulary);
  return correction ? [{ term: correction, multiplier: FUZZY_SCORE }] : [];
}

/** Return every corpus hit in relevance order, without applying metadata filters. */
export function rank(index: SearchIndex, query: string): SearchHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const vocabulary = Object.keys(index.postings);
  const idf = documentFrequencies(index);
  const explicitlySeekingCatalog = tokens.some((token) => (
    /^[cr]\d+$/i.test(token)
    || ['source', 'sources', 'catalog', 'course', 'supplemental', 'research'].includes(token)
  ));
  const catalogIntent = tokens.includes('source') || tokens.includes('sources') || tokens.includes('catalog');
  const wantsCourseCatalog = catalogIntent && tokens.includes('course');
  const wantsResearchCatalog = catalogIntent && (tokens.includes('research') || tokens.includes('supplemental'));
  const scores = new Map<number, RankedEntry>();

  for (const token of tokens) {
    const key = normalize(token);
    const matches = termsFor(index, key, vocabulary);
    for (const { term, multiplier } of matches) {
      for (const [docId, fields, frequency, headingIndex] of index.postings[term]) {
        let score = 0;
        for (const bit of [1, 2, 4, 8, 16, 32, 64]) {
          if (fields & bit) score += WEIGHTS[bit] * (1 + Math.log(frequency));
        }
        score *= (idf.get(term) ?? 1) * multiplier;
        const entry = scores.get(docId) ?? {
          score: 0,
          headings: new Set<number>(),
          matchedTokens: new Set<string>(),
          excerptTerms: new Set<string>(),
        };
        entry.score += score;
        entry.matchedTokens.add(key);
        entry.excerptTerms.add(term);
        if (headingIndex >= 0 && fields & 4) entry.headings.add(headingIndex);
        scores.set(docId, entry);
      }
    }
  }

  const queryPhrase = normalizedPhrase(query);
  const hits: SearchHit[] = [];
  for (const [docId, entry] of scores) {
    const doc = index.docs[docId];
    if (!doc) continue;

    const exactTitle = queryPhrase.length > 0 && normalizedPhrase(doc.title) === queryPhrase;
    const exactAlias = queryPhrase.length > 0 && (doc.aliases ?? []).some((alias) => normalizedPhrase(alias) === queryPhrase);
    const exactHeading = queryPhrase.length > 0 && doc.headings.some((heading) => normalizedPhrase(heading.text).includes(queryPhrase));
    if (exactTitle) entry.score += PHRASE_TITLE_BOOST;
    else if (exactAlias) entry.score += PHRASE_ALIAS_BOOST;
    else if (exactHeading) entry.score += PHRASE_HEADING_BOOST;

    // Require every query token to appear somewhere in the page, but retain
    // the existing graceful degradation for natural-language queries.
    const coverage = entry.matchedTokens.size / tokens.length;
    if (coverage < 1 && tokens.length > 1) entry.score *= coverage * 0.6;
    let catalogAdjustment = !explicitlySeekingCatalog && doc.type === 'source-catalog' ? 0.28 : 1;
    if (wantsCourseCatalog && doc.slug === 'source-catalog') catalogAdjustment = 6;
    if (wantsResearchCatalog && doc.slug === 'research-catalog') catalogAdjustment = 6;

    hits.push({
      doc,
      score: entry.score * catalogAdjustment,
      matchedHeadings: [...entry.headings]
        .map((index) => doc.headings[index])
        .filter((heading): heading is HeadingRef => Boolean(heading)),
      excerpt: excerptFor(index, doc, [...entry.excerptTerms]),
      exactTitleOrAlias: exactTitle || exactAlias,
    });
  }

  return hits.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
}

/** Apply metadata filters without changing the relevance order supplied by rank. */
export function filterHits(hits: SearchHit[], filters: SearchFilters = {}): SearchHit[] {
  return hits.filter(({ doc }) => {
    if (filters.section && doc.section !== filters.section) return false;
    if (filters.type && doc.type !== filters.type) return false;
    if (filters.evidence && doc.evidence !== filters.evidence) return false;
    if (filters.period && !doc.periods.includes(filters.period)) return false;
    if (filters.place && !doc.places.includes(filters.place)) return false;
    if (filters.tag && !doc.tags.includes(filters.tag)) return false;
    if (filters.origin && doc.origin !== filters.origin) return false;
    return true;
  });
}

/** Keep the convenient combined API used by existing callers. */
export function search(index: SearchIndex, query: string, filters: SearchFilters = {}, limit = 40): SearchHit[] {
  return filterHits(rank(index, query), filters).slice(0, limit);
}

function excerptFor(index: SearchIndex, doc: SearchDoc, terms: string[]): string {
  const text = index.excerpts[doc.slug] ?? doc.summary;
  if (!text) return '';
  const uniqueTerms = [...new Set(terms.filter(Boolean))];
  if (!uniqueTerms.length) return trim(text.slice(0, 220));
  const lower = text.toLowerCase();
  const positions = new Set<number>([0]);
  for (const term of uniqueTerms) {
    let from = 0;
    let found = 0;
    while (from < lower.length && found < 80) {
      const position = lower.indexOf(term, from);
      if (position < 0) break;
      positions.add(position);
      from = position + 1;
      found += 1;
    }
  }

  const phrase = uniqueTerms.join(' ');
  let best = { start: 0, distinct: -1, phrase: false };
  for (const position of positions) {
    const start = Math.max(0, Math.min(position - 80, Math.max(0, text.length - 220)));
    const window = lower.slice(start, start + 220);
    const distinct = uniqueTerms.filter((term) => window.includes(term)).length;
    const hasPhrase = phrase.length > 1 && window.includes(phrase);
    if (
      distinct > best.distinct
      || (distinct === best.distinct && hasPhrase && !best.phrase)
    ) {
      best = { start, distinct, phrase: hasPhrase };
    }
  }

  if (best.distinct < 1) return trim(doc.summary);
  const excerpt = trim(text.slice(best.start, best.start + 220));
  return `${best.start > 0 ? '…' : ''}${excerpt}`;
}

function trim(text: string): string {
  const value = text.trim();
  if (value.length <= 220) return value;
  const cut = value.lastIndexOf(' ', 220);
  return `${value.slice(0, cut > 0 ? cut : 220)}…`;
}
