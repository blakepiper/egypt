// Downloads cleared masters into a local cache, then produces the responsive
// derivatives that are committed for the static site. Masters never enter dist.

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { MediaRecord } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = join(ROOT, 'content/media-manifest.json');
const CACHE = join(ROOT, '.cache/media');
const OUTPUT = join(ROOT, 'public/media');
const WIDTHS = [480, 960, 1280];
const TILE_SIZE = 512;
const MAX_FILE_BYTES = 250 * 1024;

async function download(url: string, destination: string): Promise<void> {
  if (existsSync(destination)) return;
  mkdirSync(dirname(destination), { recursive: true });
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'Living Archive media build' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
  } catch {
    // Some institutional CDNs use certificate chains Node does not inherit from
    // the operating system. curl uses the system trust store and remains strict.
    execFileSync('curl', ['-L', '--fail', '--silent', '--show-error', url, '-o', destination]);
  }
}

function assertBudget(path: string): void {
  const bytes = statSync(path).size;
  if (bytes > MAX_FILE_BYTES) throw new Error(`${path} is ${Math.ceil(bytes / 1024)} KB; media files must stay at or below 250 KB`);
}

async function makeVariants(record: MediaRecord, sourcePath: string): Promise<void> {
  const source = sharp(sourcePath, { failOn: 'warning' }).autoOrient();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`${record.id}: image dimensions are unavailable`);

  const widths = [...new Set(WIDTHS.map((width) => Math.min(width, metadata.width!)))].sort((a, b) => a - b);
  const variants: NonNullable<MediaRecord['variants']> = [];
  for (const width of widths) {
    const stem = `${record.id}-${width}`;
    const files = {
      avif: `${stem}.avif`,
      webp: `${stem}.webp`,
      fallback: `${stem}.jpg`,
    };
    await Promise.all([
      source.clone().resize({ width, withoutEnlargement: true }).avif({ quality: 52, effort: 5 }).toFile(join(OUTPUT, files.avif)),
      source.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toFile(join(OUTPUT, files.webp)),
      source.clone().resize({ width, withoutEnlargement: true }).jpeg({ quality: 68, mozjpeg: true }).toFile(join(OUTPUT, files.fallback)),
    ]);
    Object.values(files).forEach((file) => assertBudget(join(OUTPUT, file)));
    variants.push({ width, ...files });
  }

  const largest = variants.at(-1)!;
  const largestInfo = await sharp(join(OUTPUT, largest.fallback)).metadata();
  record.file = largest.fallback;
  record.width = largestInfo.width;
  record.height = largestInfo.height;
  record.variants = variants;
  record.placeholder = `${record.id}-placeholder.webp`;
  await source.clone().resize({ width: 48, withoutEnlargement: true }).blur(1.2).webp({ quality: 32 }).toFile(join(OUTPUT, record.placeholder));
}

async function makeDeepZoom(record: MediaRecord, sourcePath: string): Promise<void> {
  const source = sharp(sourcePath, { failOn: 'warning' }).autoOrient();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`${record.id}: deep-zoom dimensions are unavailable`);

  const scales: number[] = [1];
  while (Math.max(metadata.width * scales[0], metadata.height * scales[0]) > TILE_SIZE) scales.unshift(scales[0] / 2);
  const levels: NonNullable<MediaRecord['deepZoom']>['levels'] = [];

  for (let level = 0; level < scales.length; level += 1) {
    const scale = scales[level];
    const width = Math.max(1, Math.round(metadata.width * scale));
    const height = Math.max(1, Math.round(metadata.height * scale));
    const cols = Math.ceil(width / TILE_SIZE);
    const rows = Math.ceil(height / TILE_SIZE);
    const relativePath = `${record.id}/tiles/${level}`;
    const directory = join(OUTPUT, relativePath);
    mkdirSync(directory, { recursive: true });
    const resized = await source.clone().resize({ width, height, fit: 'fill' }).webp({ quality: 78, effort: 5 }).toBuffer();

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const left = col * TILE_SIZE;
        const top = row * TILE_SIZE;
        const tilePath = join(directory, `${col}-${row}.webp`);
        await sharp(resized).extract({
          left,
          top,
          width: Math.min(TILE_SIZE, width - left),
          height: Math.min(TILE_SIZE, height - top),
        }).webp({ quality: 78, effort: 5 }).toFile(tilePath);
        assertBudget(tilePath);
      }
    }
    levels.push({ level, width, height, cols, rows, path: relativePath });
  }

  record.deepZoom = { tileSize: TILE_SIZE, width: metadata.width, height: metadata.height, levels };
}

async function main(): Promise<void> {
  const records = JSON.parse(readFileSync(MANIFEST, 'utf8')) as MediaRecord[];
  const images = records.filter((record) => record.status === 'cleared' && record.kind === 'image');
  mkdirSync(OUTPUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });

  for (const record of images) {
    if (!record.masterUrl) throw new Error(`${record.id}: cleared image has no masterUrl`);
    const extension = extname(new URL(record.masterUrl).pathname) || '.jpg';
    const cached = join(CACHE, `${record.id}${extension}`);
    await download(record.masterUrl, cached);
    await makeVariants(record, cached);
    if (record.deepZoomSource) {
      rmSync(join(OUTPUT, record.id), { recursive: true, force: true });
      await makeDeepZoom(record, cached);
    }
    console.log(`${record.id}: ${record.width}×${record.height}${record.deepZoom ? `, ${record.deepZoom.levels.length} zoom levels` : ''}`);
  }

  writeFileSync(MANIFEST, `${JSON.stringify(records, null, 2)}\n`);
  console.log(`Processed ${images.length} cleared images into ${basename(OUTPUT)}.`);
}

await main();
