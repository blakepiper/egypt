// Builds a compact inverted index. It ships as one lazily loaded JSON file, so
// the shape favours small size: postings are arrays of numbers rather than
// objects, while a bounded body excerpt is kept once per page for relevant
// snippets. The limit keeps the index comfortably below its deployment budget.

import type { HeadingRef, PageSummary, SearchIndex } from '../../src/types/content.js';

/** Field bits. Ranking multiplies these at query time. */
export const FIELD = {
  title: 1,
  alias: 2,
  heading: 4,
  summary: 8,
  body: 16,
  tag: 32,
  source: 64,
} as const;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'for', 'from', 'had', 'has',
  'have', 'he', 'her', 'his', 'in', 'into', 'is', 'it', 'its', 'not', 'of', 'on', 'or', 'she',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'were',
  'which', 'who', 'with', 'you', 'your', 'so', 'if', 'than', 'when', 'what', 'how', 'why',
]);

const EXCERPT_LIMIT = 2400;
const CATALOG_EXCERPT_LIMIT = 120000;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .split(/[^a-z0-9']+/)
    .map((token) => token.replace(/^'+|'+$/g, ''))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/** Very light normalisation: plurals and possessives only. Not a stemmer. */
export function normalize(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('es') && !token.endsWith('ses')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

interface SearchInput {
  meta: PageSummary;
  toc: HeadingRef[];
  text: string;
}

export function buildSearchIndex(inputs: SearchInput[]): SearchIndex {
  const postings: Record<string, number[][]> = {};
  const excerpts: Record<string, string> = {};

  const add = (docId: number, term: string, field: number, headingIndex = -1) => {
    const key = normalize(term);
    const list = (postings[key] ??= []);
    const existing = list.find((entry) => entry[0] === docId && entry[3] === headingIndex);
    if (existing) {
      existing[1] |= field;
      existing[2] += 1;
    } else {
      list.push([docId, field, 1, headingIndex]);
    }
  };

  inputs.forEach((input, docId) => {
    const { meta, toc, text } = input;
    for (const token of tokenize(meta.title)) add(docId, token, FIELD.title);
    for (const alias of meta.aliases) for (const token of tokenize(alias)) add(docId, token, FIELD.alias);
    toc.forEach((heading, headingIndex) => {
      for (const token of tokenize(heading.text)) add(docId, token, FIELD.heading, headingIndex);
    });
    for (const token of tokenize(meta.summary)) add(docId, token, FIELD.summary);
    for (const value of [...meta.tags, ...meta.entities, ...meta.periods, ...meta.places, meta.type]) {
      for (const token of tokenize(value.replace(/-/g, ' '))) add(docId, token, FIELD.tag);
    }
    for (const id of meta.sourceIds) add(docId, id.toLowerCase(), FIELD.source);
    for (const token of tokenize(text)) add(docId, token, FIELD.body);
    // Catalog pages are long by design; source-ID searches need to reach a
    // matching record deep in them. Their cap is still finite, while ordinary
    // article excerpts stay small enough to protect the index budget.
    const limit = meta.type === 'source-catalog' ? CATALOG_EXCERPT_LIMIT : EXCERPT_LIMIT;
    excerpts[meta.slug] = text.slice(0, limit);
  });

  return {
    generated: new Date().toISOString(),
    docs: inputs.map((input, id) => ({
      id,
      slug: input.meta.slug,
      title: input.meta.title,
      aliases: input.meta.aliases,
      route: input.meta.route,
      type: input.meta.type,
      section: input.meta.section,
      summary: input.meta.summary,
      periods: input.meta.periods,
      places: input.meta.places,
      entities: input.meta.entities,
      tags: input.meta.tags,
      evidence: input.meta.evidence,
      origin: input.meta.origin,
      headings: input.toc,
    })),
    postings,
    excerpts,
    terms: Object.keys(postings).length,
  };
}
