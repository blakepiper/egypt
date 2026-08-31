// Rights gate. Only `cleared` assets may enter a production build, and every
// record has to carry enough information to publish a credit.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MediaRecord } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = join(ROOT, 'content/media-manifest.json');
const PUBLIC_MEDIA = join(ROOT, 'public/media');

const REQUIRED: (keyof MediaRecord)[] = ['id', 'kind', 'source', 'license', 'attribution', 'dateAccessed', 'caption', 'alt', 'status'];
const MAX_IMAGE_BYTES = 250 * 1024;

function filesBelow(directory: string, prefix = ''): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesBelow(join(directory, entry.name), relative) : [relative];
  });
}

function main(): void {
  const records: MediaRecord[] = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const failures: string[] = [];
  const ids = new Set<string>();
  const deployed = new Set<string>();

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
      if (record.review?.factual !== 'reviewed') failures.push(`${record.id}: factual caption/alt review is not recorded`);
      if (record.review?.humanizer !== 'reviewed') failures.push(`${record.id}: humanizer review is not recorded`);
      if (record.review?.media_rights !== 'reviewed') failures.push(`${record.id}: rights review is not recorded`);
      if (record.kind === 'image' && !record.masterUrl) failures.push(`${record.id}: cleared image has no authoritative master URL`);
      if (record.kind === 'image' && (!record.variants?.length || !record.placeholder)) failures.push(`${record.id}: responsive derivatives are missing`);

      if (record.file) deployed.add(record.file);
      if (record.placeholder) deployed.add(record.placeholder);
      if (record.poster) deployed.add(record.poster);
      for (const variant of record.variants ?? []) {
        deployed.add(variant.avif); deployed.add(variant.webp); deployed.add(variant.fallback);
      }
      for (const level of record.deepZoom?.levels ?? []) {
        for (let row = 0; row < level.rows; row += 1) {
          for (let col = 0; col < level.cols; col += 1) deployed.add(`${level.path}/${col}-${row}.webp`);
        }
      }
    }
  }

  for (const file of deployed) {
    const path = join(PUBLIC_MEDIA, file);
    if (!existsSync(path)) failures.push(`declared file public/media/${file} does not exist`);
    else if (!/\.(mp4|webm|m4a|mp3)$/i.test(file) && statSync(path).size > MAX_IMAGE_BYTES) failures.push(`${file}: exceeds the 250 KB image budget`);
  }
  for (const file of filesBelow(PUBLIC_MEDIA)) {
    if (!deployed.has(file)) failures.push(`public/media/${file}: deployed file is not attached to a cleared rights record`);
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
