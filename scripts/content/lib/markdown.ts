// Markdown -> content AST. The wiki uses a narrow subset of Markdown plus
// Obsidian `[[wiki links]]`, so this transforms marked's token stream instead of
// emitting HTML. Nothing here trusts raw HTML: it is rejected by the caller.

import { marked, type Token, type Tokens } from 'marked';
import type {
  BlockNode,
  CalloutKind,
  InlineNode,
  HeadingRef,
  TableCell,
} from '../../../src/types/content';

export interface LinkResolver {
  /** Resolve a wiki slug to a route, or null when the target does not exist. */
  route(slug: string): string | null;
  /** True when a source ID such as C14 or R001 exists in a source registry. */
  hasSource(id: string): boolean;
  sourceRoute(id: string): string;
}

export interface ParseResult {
  blocks: BlockNode[];
  toc: HeadingRef[];
  links: { slug: string; hash: string | null; context: string }[];
  sourceIds: string[];
  mediaIds: string[];
  problems: string[];
  words: number;
  text: string;
}

const CALLOUT_KINDS: CalloutKind[] = ['evidence', 'uncertainty', 'contested', 'note', 'reconstruction', 'research'];
const SOURCE_ID = /\b(?:C\d+|R\d+)\b/g;

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

/** Split `Target#Heading|Label` into its parts. */
export function parseWikiTarget(raw: string): { slug: string; hash: string | null; label: string | null } {
  const [targetPart, labelPart] = raw.split('|');
  const [slugPart, hashPart] = targetPart.split('#');
  return {
    slug: slugPart.trim(),
    hash: hashPart ? slugifyHeading(hashPart.trim()) : null,
    label: labelPart != null ? labelPart.trim() : null,
  };
}

export function parseMarkdown(source: string, resolver: LinkResolver, pageSlug: string): ParseResult {
  const result: ParseResult = {
    blocks: [],
    toc: [],
    links: [],
    sourceIds: [],
    mediaIds: [],
    problems: [],
    words: 0,
    text: '',
  };
  const usedIds = new Map<string, number>();
  const textParts: string[] = [];

  const uniqueId = (base: string): string => {
    const seen = usedIds.get(base) ?? 0;
    usedIds.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };

  const inline = (tokens: Token[] | undefined, context: string): InlineNode[] => {
    if (!tokens) return [];
    const out: InlineNode[] = [];
    for (const token of tokens) {
      switch (token.type) {
        case 'text': {
          const t = token as Tokens.Text;
          if (t.tokens && t.tokens.length) out.push(...inline(t.tokens, context));
          else out.push(...splitWikiLinks(decode(t.text), context));
          break;
        }
        case 'escape':
          out.push({ t: 'text', v: decode((token as Tokens.Escape).text) });
          break;
        case 'strong':
          out.push({ t: 'strong', c: inline((token as Tokens.Strong).tokens, context) });
          break;
        case 'em':
          out.push({ t: 'em', c: inline((token as Tokens.Em).tokens, context) });
          break;
        case 'codespan':
          out.push({ t: 'code', v: decode((token as Tokens.Codespan).text) });
          break;
        case 'br':
          out.push({ t: 'br' });
          break;
        case 'del':
          out.push(...inline((token as Tokens.Del).tokens, context));
          break;
        case 'link': {
          const t = token as Tokens.Link;
          out.push(externalLink(decode(t.href), inline(t.tokens, context)));
          break;
        }
        case 'image': {
          const t = token as Tokens.Image;
          result.problems.push(`raw image reference "${t.href}" — use a media ID instead`);
          break;
        }
        case 'html':
          result.problems.push(`inline HTML is not allowed: ${(token as Tokens.HTML).text.slice(0, 40)}`);
          break;
        default:
          if ('text' in token && typeof (token as { text?: unknown }).text === 'string') {
            out.push(...splitWikiLinks(decode((token as { text: string }).text), context));
          }
      }
    }
    return out;
  };

  const recordSourceId = (id: string): void => {
    if (!/^C\d{2}$/.test(id) && !/^R\d{3,}$/.test(id)) {
      result.problems.push(`invalid source ID "${id}"`);
      return;
    }
    if (!resolver.hasSource(id)) {
      result.problems.push(`unknown source ID "${id}"`);
      return;
    }
    if (!result.sourceIds.includes(id)) result.sourceIds.push(id);
  };

  const externalLink = (href: string, children: InlineNode[]): InlineNode => {
    const clean = href.replace(/^<|>$/g, '');
    if (clean.startsWith('../raw/') || clean.startsWith('raw/')) {
      return { t: 'link', href: clean, kind: 'raw', c: children };
    }
    if (clean.startsWith('#')) {
      return { t: 'link', href: clean, kind: 'heading', hash: clean.slice(1), c: children };
    }
    if (/^https?:/.test(clean)) {
      return { t: 'link', href: clean, kind: 'external', c: children };
    }
    // A relative Markdown link into the wiki, e.g. `./set.md`.
    const slug = clean.replace(/^\.\//, '').replace(/\.md$/, '');
    const route = resolver.route(slug);
    return { t: 'link', href: route ?? clean, kind: 'internal', slug, missing: !route, c: children };
  };

  const splitWikiLinks = (raw: string, context: string): InlineNode[] => {
    const out: InlineNode[] = [];
    let cursor = 0;
    const pattern = /\[\[([^\]]+)\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(raw))) {
      if (match.index > cursor) out.push(...plain(raw.slice(cursor, match.index)));
      const { slug, hash, label } = parseWikiTarget(match[1]);
      const route = resolver.route(slug);
      if (!route) result.problems.push(`unresolved wiki link [[${match[1]}]]`);
      else result.links.push({ slug, hash, context });
      // Source records are commonly cited as a heading link, for example
      // `[[source-catalog#C14 — ...|C14]]`. That is still provenance, even
      // though the visible ID is nested inside an internal link rather than
      // exposed as bare paragraph text.
      const sourceReference = (label ?? match[1]).match(/\b(?:C\d{2}|R\d{3,})\b/);
      if (sourceReference) recordSourceId(sourceReference[0]);
      out.push({
        t: 'link',
        kind: 'internal',
        href: route ? (hash ? `${route}#${hash}` : route) : `#${slug}`,
        slug,
        hash: hash ?? undefined,
        missing: !route,
        c: [{ t: 'text', v: label ?? titleize(slug) }],
      });
      cursor = pattern.lastIndex;
    }
    if (cursor < raw.length) out.push(...plain(raw.slice(cursor)));
    return out;
  };

  /** Turn bare source IDs (C14, R001) into catalog links and reject unknown IDs. */
  const plain = (raw: string): InlineNode[] => {
    const out: InlineNode[] = [];
    let cursor = 0;
    SOURCE_ID.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SOURCE_ID.exec(raw))) {
      const id = match[0];
      if (!/^C\d{2}$/.test(id) && !/^R\d{3,}$/.test(id)) { recordSourceId(id); continue; }
      if (!resolver.hasSource(id)) { recordSourceId(id); continue; }
      if (match.index > cursor) out.push({ t: 'text', v: raw.slice(cursor, match.index) });
      recordSourceId(id);
      out.push({
        t: 'link',
        kind: 'source',
        href: resolver.sourceRoute(id),
        sourceId: id,
        c: [{ t: 'text', v: id }],
      });
      cursor = match.index + id.length;
    }
    if (cursor < raw.length) out.push({ t: 'text', v: raw.slice(cursor) });
    return out;
  };

  const blocks = (tokens: Token[], context: string): BlockNode[] => {
    const out: BlockNode[] = [];
    for (const token of tokens) {
      switch (token.type) {
        case 'space':
          break;
        case 'heading': {
          const t = token as Tokens.Heading;
          const children = inline(t.tokens, context);
          const text = flatten(children);
          textParts.push(text);
          if (t.depth === 1) {
            // The H1 is the page title; the shell renders it.
            break;
          }
          const id = uniqueId(slugifyHeading(text));
          context = text;
          out.push({ t: 'heading', level: t.depth, id, text, c: children });
          result.toc.push({ id, level: t.depth, text });
          break;
        }
        case 'paragraph': {
          const t = token as Tokens.Paragraph;
          const media = t.text.match(/^!media\[([a-z0-9-]+)\]$/);
          if (media) {
            result.mediaIds.push(media[1]);
            out.push({ t: 'media', id: media[1] });
            break;
          }
          const children = inline(t.tokens, context);
          textParts.push(flatten(children));
          out.push({ t: 'paragraph', c: children });
          break;
        }
        case 'text': {
          const t = token as Tokens.Text;
          const children = t.tokens ? inline(t.tokens, context) : splitWikiLinks(decode(t.text), context);
          textParts.push(flatten(children));
          out.push({ t: 'paragraph', c: children });
          break;
        }
        case 'list': {
          const t = token as Tokens.List;
          out.push({
            t: 'list',
            ordered: Boolean(t.ordered),
            start: typeof t.start === 'number' && t.start !== 1 ? t.start : undefined,
            items: t.items.map((item) => blocks(item.tokens ?? [], context)),
          });
          break;
        }
        case 'table': {
          const t = token as Tokens.Table;
          const cell = (c: Tokens.TableCell, index: number): TableCell => {
            const children = inline(c.tokens, context);
            textParts.push(flatten(children));
            return { c: children, align: t.align[index] ?? null };
          };
          out.push({
            t: 'table',
            head: t.header.map(cell),
            rows: t.rows.map((row) => row.map(cell)),
          });
          break;
        }
        case 'blockquote': {
          const t = token as Tokens.Blockquote;
          const callout = readCallout(t);
          if (callout) {
            out.push({ t: 'callout', kind: callout.kind, label: callout.label, c: blocks(callout.tokens, context) });
          } else {
            out.push({ t: 'quote', c: blocks(t.tokens ?? [], context) });
          }
          break;
        }
        case 'code': {
          const t = token as Tokens.Code;
          out.push({ t: 'code', lang: t.lang || null, v: t.text });
          break;
        }
        case 'hr':
          out.push({ t: 'hr' });
          break;
        case 'html':
          result.problems.push(`block HTML is not allowed: ${(token as Tokens.HTML).text.slice(0, 40).trim()}`);
          break;
        default:
          break;
      }
    }
    return out;
  };

  /** `> [!uncertainty] Label` opens a callout. */
  const readCallout = (token: Tokens.Blockquote): { kind: CalloutKind; label: string; tokens: Token[] } | null => {
    const first = token.tokens?.[0];
    if (!first || (first.type !== 'paragraph' && first.type !== 'text')) return null;
    const text = (first as Tokens.Paragraph).text ?? '';
    const match = text.match(/^\[!([a-z-]+)\][ \t]*([^\n]*)([\s\S]*)$/i);
    if (!match) return null;
    const kind = match[1].toLowerCase() as CalloutKind;
    if (!CALLOUT_KINDS.includes(kind)) {
      result.problems.push(`unknown callout type "${match[1]}" on ${pageSlug}`);
      return null;
    }
    const label = match[2].trim();
    const remainder = match[3].trim();
    const body = token.tokens!.slice(1);
    return {
      kind,
      label: label || defaultCalloutLabel(kind),
      tokens: remainder ? [...marked.lexer(remainder), ...body] : body,
    };
  };

  const tokens = marked.lexer(source, { gfm: true });
  result.blocks = blocks(tokens, 'Introduction');
  result.text = textParts.join(' ').replace(/\s+/g, ' ').trim();
  result.words = result.text ? result.text.split(' ').length : 0;
  return result;
}

function defaultCalloutLabel(kind: CalloutKind): string {
  switch (kind) {
    case 'evidence': return 'What the evidence shows';
    case 'uncertainty': return 'What remains uncertain';
    case 'contested': return 'Contested claim';
    case 'reconstruction': return 'How this was reconstructed';
    case 'research': return 'Supplemental research';
    default: return 'Note';
  }
}

export function flatten(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.t === 'text' || node.t === 'code' || node.t === 'term') return node.v;
      if (node.t === 'br') return ' ';
      if ('c' in node) return flatten(node.c);
      return '';
    })
    .join('');
}

export function titleize(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function decode(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Marks the first use of each glossary term on a page so the reader gets a
 * definition where the term first appears. This runs at build time rather than
 * during rendering: "first use" depends on document order, and deciding it while
 * React renders would give a different answer on every re-render.
 *
 * Terms inside links and headings are left alone — a definition control nested in
 * a link is not usable, and a heading is not where a definition belongs.
 */
export function annotateGlossary(blocks: BlockNode[], glossary: { term: string; definition: string }[]): void {
  if (!glossary.length) return;
  const definitions = new Map(glossary.map((entry) => [entry.term.toLowerCase(), entry.definition]));
  const pattern = new RegExp(
    `\\b(${glossary
      .map((entry) => entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|')})\\b`,
  );
  const seen = new Set<string>();

  const walkInline = (nodes: InlineNode[]): InlineNode[] => {
    const out: InlineNode[] = [];
    for (const node of nodes) {
      if (node.t === 'link' || node.t === 'code') { out.push(node); continue; }
      if (node.t === 'strong' || node.t === 'em') { out.push({ ...node, c: walkInline(node.c) }); continue; }
      if (node.t !== 'text') { out.push(node); continue; }
      let rest = node.v;
      let matched = false;
      while (rest) {
        const match = pattern.exec(rest);
        if (!match) break;
        const key = match[0].toLowerCase();
        const definition = definitions.get(key);
        if (!definition || seen.has(key)) {
          // Move past this occurrence and keep looking in the remainder.
          const consumed = match.index + match[0].length;
          out.push({ t: 'text', v: rest.slice(0, consumed) });
          rest = rest.slice(consumed);
          matched = true;
          continue;
        }
        seen.add(key);
        if (match.index > 0) out.push({ t: 'text', v: rest.slice(0, match.index) });
        out.push({ t: 'term', v: match[0], definition });
        rest = rest.slice(match.index + match[0].length);
        matched = true;
      }
      if (rest) out.push({ t: 'text', v: rest });
      else if (!matched) out.push(node);
    }
    return out;
  };

  const walkBlocks = (list: BlockNode[]): void => {
    for (const block of list) {
      switch (block.t) {
        case 'paragraph': block.c = walkInline(block.c); break;
        case 'list': block.items.forEach(walkBlocks); break;
        case 'table':
          for (const row of block.rows) for (const cell of row) cell.c = walkInline(cell.c);
          break;
        case 'quote':
        case 'callout': walkBlocks(block.c); break;
        default: break;
      }
    }
  };

  walkBlocks(blocks);
}
