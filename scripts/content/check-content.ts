// Content lint. Runs the compiler and then asserts the release conditions that
// the compiler itself treats as advisory. A failure here should stop a build.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build-content.js';
import { collectRoutes } from './build-routes.js';
import type { MediaRecord } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WIKI = join(ROOT, 'llm-wiki');

const EXPECTED_PAGES = 41;

/** BCE/CE formatting must stay consistent across the wiki. */
const BAD_DATE_FORMS = [
  { pattern: /\b\d{3,4}\s?(BC|AD)\b/g, message: 'use BCE/CE rather than BC/AD' },
  { pattern: /\bB\.C\.E\.|\bC\.E\./g, message: 'use BCE/CE without full stops' },
];

function main(): void {
  const failures: string[] = [];
  const notes: string[] = [];

  const result = build();
  for (const problem of result.problems) {
    if (problem.severity === 'error') failures.push(`${problem.file}: ${problem.message}`);
    else notes.push(`${problem.file}: ${problem.message}`);
  }

  // 1. Every content document is ingested.
  const files = readdirSync(WIKI).filter((file) => file.endsWith('.md') && file !== 'AGENTS.md');
  if (files.length !== EXPECTED_PAGES) {
    failures.push(`expected ${EXPECTED_PAGES} content documents, found ${files.length}`);
  }
  if (result.pages.length !== files.length) {
    failures.push(`${files.length} documents on disk but ${result.pages.length} in the manifest`);
  }

  // 2. Routes are unique and every page has one.
  const routes = collectRoutes();
  const seen = new Set<string>();
  for (const route of routes) {
    if (seen.has(route.path)) failures.push(`duplicate route ${route.path}`);
    seen.add(route.path);
  }
  for (const page of result.pages) {
    if (!seen.has(page.route)) failures.push(`page ${page.slug} has no generated route`);
  }

  // 3. Summaries and aliases must not contradict each other.
  for (const page of result.pages) {
    for (const alias of page.aliases) {
      if (alias.toLowerCase() === page.title.toLowerCase()) {
        failures.push(`${page.slug}: alias "${alias}" repeats the title`);
      }
    }
  }

  // 4. Date formatting.
  for (const file of files) {
    const source = readFileSync(join(WIKI, file), 'utf8');
    for (const rule of BAD_DATE_FORMS) {
      const matches = source.match(rule.pattern);
      if (matches) failures.push(`${file}: ${rule.message} (${[...new Set(matches)].slice(0, 3).join(', ')})`);
    }
  }

  // 5. Media rights.
  const manifestPath = join(ROOT, 'content/media-manifest.json');
  const media: MediaRecord[] = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : [];
  for (const record of media) {
    if (!record.alt) failures.push(`media ${record.id}: no alternative text`);
    if (!record.caption) failures.push(`media ${record.id}: no caption`);
    if (!record.license) failures.push(`media ${record.id}: no license`);
    if (record.status === 'cleared' && !record.file) failures.push(`media ${record.id}: cleared but has no file`);
  }

  for (const note of notes) console.log(`warn   ${note}`);
  for (const failure of failures) console.log(`error  ${failure}`);
  console.log(`\n${result.pages.length}/${EXPECTED_PAGES} pages, ${routes.length} routes, ${media.length} media records`);
  console.log(`${failures.length} errors, ${notes.length} warnings`);
  if (failures.length) process.exitCode = 1;
}

main();
