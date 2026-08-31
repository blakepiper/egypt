// Performance budgets, checked against the real build output. These are the
// numbers from the implementation plan; a regression fails the build rather than
// showing up later as a slow page on a phone.

import { describe, expect, it } from 'vitest';
import { gzipSync } from 'node:zlib';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSETS = join(ROOT, 'dist/assets');
const built = existsSync(ASSETS);

function gzipBytes(path: string): number {
  return gzipSync(readFileSync(path)).length;
}

function entryFiles(extension: string): string[] {
  // Vite names the entry chunk after the HTML entry point: `index-<hash>`.
  return readdirSync(ASSETS)
    .filter((file) => file.startsWith('index-') && file.endsWith(extension))
    .map((file) => join(ASSETS, file));
}

describe.runIf(built)('bundle budgets', () => {
  it('keeps initial JavaScript at or below 180 KB gzip', () => {
    const total = entryFiles('.js').reduce((sum, file) => sum + gzipBytes(file), 0);
    expect(total).toBeLessThanOrEqual(180 * 1024);
  });

  it('keeps initial CSS at or below 50 KB gzip', () => {
    const total = entryFiles('.css').reduce((sum, file) => sum + gzipBytes(file), 0);
    expect(total).toBeLessThanOrEqual(50 * 1024);
  });

  it('keeps every article payload at or below 80 KB gzip', () => {
    const oversized = readdirSync(ASSETS)
      .filter((file) => file.endsWith('.js') && !file.startsWith('index-') && !file.startsWith('graph-') && !file.startsWith('search-index-'))
      .map((file) => ({ file, size: gzipBytes(join(ASSETS, file)) }))
      .filter((entry) => entry.size > 80 * 1024);
    expect(oversized).toEqual([]);
  });

  it('keeps the search index and the graph out of the entry chunk', () => {
    const entry = entryFiles('.js').map((file) => readFileSync(file, 'utf8')).join('');
    // The two largest data files must stay outside the entry bundle. The search
    // index is a public static JSON resource; the graph remains a lazy chunk
    // because it is used by the interactive explorer and article neighborhoods.
    expect(entry.includes('"postings"')).toBe(false);
    expect(existsSync(join(ROOT, 'public/generated/search-index.json'))).toBe(true);
    expect(readdirSync(ASSETS).some((file) => file.startsWith('graph-'))).toBe(true);
  });

  it('ships no media file above 250 KB', () => {
    const media = join(ROOT, 'public/media');
    if (!existsSync(media)) return;
    const oversized = readdirSync(media)
      .map((file) => ({ file, size: statSync(join(media, file)).size }))
      .filter((entry) => entry.size > 250 * 1024 && !/\.(mp4|webm|m4a|mp3)$/.test(entry.file));
    expect(oversized).toEqual([]);
  });
});
