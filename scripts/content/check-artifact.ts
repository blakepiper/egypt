import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRoutes } from './build-routes.js';
import type { ContentManifest } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = join(ROOT, 'dist');
const GENERATED = join(ROOT, 'src/generated');

function main(): void {
  const failures: string[] = [];
  if (!existsSync(join(DIST, 'index.html'))) failures.push('dist/index.html is missing');
  const routes = collectRoutes();
  for (const route of routes) {
    const path = route.path === '/' ? join(DIST, 'index.html') : join(DIST, route.path.replace(/^\/|\/$/g, ''), 'index.html');
    if (!existsSync(path)) failures.push(`missing route artifact: ${route.path}`);
  }
  const manifest = JSON.parse(readFileSync(join(GENERATED, 'content-manifest.json'), 'utf8')) as ContentManifest;
  if (manifest.counts.routes !== routes.length) failures.push(`manifest route count is ${manifest.counts.routes ?? 'absent'}, expected ${routes.length}`);
  const journeyPath = join(DIST, 'journeys', 'esna-to-aswan-dahabiya', 'index.html');
  if (existsSync(journeyPath)) {
    const html = readFileSync(journeyPath, 'utf8');
    if (!html.includes('<noscript>') || !html.includes('The whole journey as text') || !html.includes('Stage 12')) failures.push('J01 artifact has no complete no-JavaScript transcript fallback');
    if (/localLocator|raw\//i.test(html)) failures.push('private source metadata leaked into J01 artifact');
  }
  if (!existsSync(join(DIST, '404.html')) || !existsSync(join(DIST, '.nojekyll'))) failures.push('GitHub Pages support artifacts are incomplete');
  console.log(`${routes.length} route artifacts checked`);
  for (const failure of failures) console.log(`error  ${failure}`);
  console.log(`${failures.length} errors`);
  if (failures.length) process.exitCode = 1;
}

main();
