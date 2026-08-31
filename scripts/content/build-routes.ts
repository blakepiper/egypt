// Emits one real HTML entry point per route so a direct reload works on GitHub
// Pages, which has no rewrite rules. Every generated file is the built shell
// with a route-specific title and description; the client router reads the path
// and renders the matching view.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContentManifest, Journey, ObjectStudy } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = join(ROOT, 'dist');
const GENERATED = join(ROOT, 'src/generated');

interface RouteEntry { path: string; title: string; description: string }

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(GENERATED, name), 'utf8')) as T;
}

export function collectRoutes(): RouteEntry[] {
  const manifest = readJson<ContentManifest>('content-manifest.json');
  const journeys = readJson<Journey[]>('journeys.json');
  const objects = readJson<ObjectStudy[]>('objects.json');

  const routes: RouteEntry[] = [
    { path: '/', title: 'The Living Archive', description: 'An archive of ancient Egyptian religion reconstructed from a 2017 university course, with its sources and uncertainties kept visible.' },
    { path: '/wiki/', title: 'Encyclopedia', description: `All ${manifest.counts.pages} articles in the archive, grouped by hub.` },
    { path: '/atlas/', title: 'Atlas', description: 'Sacred geography along the Nile: cult centres, the Red Land, and the west.' },
    { path: '/chronology/', title: 'Chronology', description: 'Periods, overlapping funerary corpora, institutions, and what survives from each stretch of time.' },
    { path: '/graph/', title: 'Knowledge graph', description: `${manifest.counts.nodes} nodes and ${manifest.counts.edges} relationships across articles, entities, places, periods, and sources.` },
    { path: '/journeys/', title: 'Journeys', description: 'Guided sequences that state their period, place, evidence, and limits.' },
    { path: '/objects/', title: 'Objects and texts', description: 'Close reading of images and manuscripts, and the visual decoder.' },
    { path: '/objects/decoder/', title: 'Visual decoder', description: 'Signs, crowns, priestly cues, and funerary scene cues, with identification confidence visible.' },
    { path: '/learn/', title: 'Learn', description: 'The course as it ran, its reading sequence, and a four-week route back through it.' },
    { path: '/archive/', title: 'Archive', description: 'Sources, audits, student work, and the maintenance record.' },
    { path: '/archive/sources/', title: 'Source catalog', description: `${manifest.counts.sources} intellectual-source groups with stable C IDs.` },
    { path: '/field-guide/', title: 'Field guide', description: 'What to notice at sites and museums.' },
    { path: '/search/', title: 'Search', description: 'Search titles, headings, body text, tags, periods, places, and source IDs.' },
    { path: '/browse/', title: 'Browse', description: 'Alphabetical, hub, type, deity, place, period, source, and media indexes.' },
    { path: '/specimen/', title: 'Design system specimen', description: 'The original interactive design-system reference, kept for comparison.' },
    { path: '/about/', title: 'About and privacy', description: 'What this archive is, how evidence is labelled, and what stays in your browser.' },
  ];

  for (const page of manifest.pages) {
    routes.push({
      path: page.route,
      title: page.title,
      description: page.summary || `An article in the archive: ${page.title}.`,
    });
  }
  for (const journey of journeys) {
    routes.push({ path: `/journeys/${journey.id}/`, title: journey.title, description: journey.question });
  }
  for (const view of [
    { id: 'personhood', title: 'Personhood constellation', description: 'Body, heart, name, shadow, ka, ba, and akh, with what each aspect was for.' },
    { id: 'creation', title: 'Creation traditions side by side', description: 'Compare local Egyptian cosmogonies without forcing one of them to win.' },
    { id: 'funerary-corpora', title: 'Funerary corpus river', description: 'Four overlapping funerary corpora on one time axis.' },
  ]) {
    routes.push({ path: `/views/${view.id}/`, title: view.title, description: view.description });
  }
  for (const object of objects) {
    routes.push({ path: `/objects/${object.id}/`, title: object.title, description: object.subtitle });
  }
  return routes;
}

function render(shell: string, entry: RouteEntry): string {
  const title = entry.path === '/' ? 'The Living Archive' : `${entry.title} — The Living Archive`;
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapeHtml(entry.description)}$2`);
}

export function buildRoutes(): number {
  const shellPath = join(DIST, 'index.html');
  if (!existsSync(shellPath)) {
    throw new Error('dist/index.html is missing. Run the Vite build before generating routes.');
  }
  const shell = readFileSync(shellPath, 'utf8');
  const routes = collectRoutes();

  for (const entry of routes) {
    const html = render(shell, entry);
    if (entry.path === '/') {
      writeFileSync(shellPath, html);
      continue;
    }
    const directory = join(DIST, entry.path.replace(/^\/|\/$/g, ''));
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'index.html'), html);
  }

  // GitHub Pages serves 404.html for anything it cannot find. The application's
  // own not-found view then offers search and nearby matches.
  writeFileSync(join(DIST, '404.html'), render(shell, {
    path: '/404/',
    title: 'Page not found',
    description: 'That address is not in the archive. Search, or start from the encyclopedia index.',
  }));

  // Jekyll would otherwise skip files and directories beginning with an underscore.
  writeFileSync(join(DIST, '.nojekyll'), '');

  return routes.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const count = buildRoutes();
  console.log(`Wrote ${count} static route entry points, 404.html, and .nojekyll.`);
}
