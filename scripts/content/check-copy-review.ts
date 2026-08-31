// Keeps the application-copy review attached to exact source bytes. Changing a
// user-facing string invalidates the recorded review until it is run again.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REVIEW = join(ROOT, 'content/copy-review.json');

function filesBelow(directory: string, extensions: Set<string>): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(path, extensions);
    return extensions.has(entry.name.slice(entry.name.lastIndexOf('.'))) ? [path] : [];
  });
}

function reviewedFiles(): string[] {
  return [
    join(ROOT, 'index.html'),
    join(ROOT, 'scripts/content/lib/site.ts'),
    join(ROOT, 'content/periods.json'),
    join(ROOT, 'content/places.json'),
    ...filesBelow(join(ROOT, 'content/entities'), new Set(['.json'])),
    ...filesBelow(join(ROOT, 'content/journeys'), new Set(['.json'])),
    ...filesBelow(join(ROOT, 'content/objects'), new Set(['.json'])),
    ...filesBelow(join(ROOT, 'content/paths'), new Set(['.json'])),
    ...filesBelow(join(ROOT, 'src/app'), new Set(['.ts', '.tsx'])),
    ...filesBelow(join(ROOT, 'src/design-system'), new Set(['.ts', '.tsx'])),
    ...filesBelow(join(ROOT, 'src/features'), new Set(['.ts', '.tsx'])),
    join(ROOT, 'src/App.tsx'),
  ].sort();
}

function digest(files: string[]): string {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(relative(ROOT, file)); hash.update('\0'); hash.update(readFileSync(file)); hash.update('\0');
  }
  return hash.digest('hex');
}

const files = reviewedFiles();
const actual = digest(files);
if (process.argv.includes('--hash')) {
  console.log(actual);
} else {
  const review = JSON.parse(readFileSync(REVIEW, 'utf8')) as { factual: string; humanizer: string; hash: string };
  const failures: string[] = [];
  if (review.factual !== 'reviewed') failures.push('application factual review is not recorded');
  if (review.humanizer !== 'reviewed') failures.push('application humanizer review is not recorded');
  if (review.hash !== actual) failures.push('application copy changed after its recorded review');
  if (failures.length) {
    failures.forEach((failure) => console.log(`error  ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`${files.length} application-copy files match factual and humanizer review ${actual.slice(0, 12)}.`);
  }
}
