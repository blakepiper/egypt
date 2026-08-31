// Rights gate. Only `cleared` assets may enter a production build, and every
// record has to carry enough information to publish a credit.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MediaRecord } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = join(ROOT, 'content/media-manifest.json');
const PUBLIC_MEDIA = join(ROOT, 'public/media');

const REQUIRED: (keyof MediaRecord)[] = ['id', 'kind', 'source', 'license', 'attribution', 'dateAccessed', 'caption', 'alt', 'status'];

function main(): void {
  const records: MediaRecord[] = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const failures: string[] = [];
  const ids = new Set<string>();

  for (const record of records) {
    if (ids.has(record.id)) failures.push(`duplicate media id "${record.id}"`);
    ids.add(record.id);
    for (const field of REQUIRED) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        failures.push(`${record.id}: missing "${field}"`);
      }
    }
    if (!['cleared', 'research-only', 'requested'].includes(record.status)) {
      failures.push(`${record.id}: unknown status "${record.status}"`);
    }
    if (record.status === 'cleared') {
      if (!record.file) failures.push(`${record.id}: cleared but no file named`);
      else if (!existsSync(join(PUBLIC_MEDIA, record.file))) failures.push(`${record.id}: file public/media/${record.file} does not exist`);
      if (record.kind === 'video' && !record.transcript) failures.push(`${record.id}: video cleared without a transcript`);
      if (record.kind === 'audio' && !record.transcript) failures.push(`${record.id}: audio cleared without a transcript`);
      if (record.kind === 'video' && !record.poster) failures.push(`${record.id}: video cleared without a poster image`);
    }
  }

  const cleared = records.filter((record) => record.status === 'cleared');
  console.log(`${records.length} media records, ${cleared.length} cleared for publication.`);
  for (const failure of failures) console.log(`error  ${failure}`);
  if (failures.length) {
    console.log(`\n${failures.length} rights problems.`);
    process.exitCode = 1;
  } else {
    console.log('All records carry the metadata a published credit needs.');
  }
}

main();
