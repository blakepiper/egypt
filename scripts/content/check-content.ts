// Content lint. Runs the compiler and then asserts the release conditions that
// the compiler itself treats as advisory. A failure here should stop a build.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build-content.js';
import { collectRoutes } from './build-routes.js';
import type { Journey, KnowledgePath, MediaRecord, ObjectStudy } from '../../src/types/content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WIKI = join(ROOT, 'llm-wiki');

const REQUIRED_ARTICLES = [
  'studying-religion-through-egypt', 'predynastic-egypt-and-state-formation', 'naqada-hierakonpolis-and-early-centers',
  'abydos-umm-el-qaab-and-the-first-writing', 'narmer-and-the-making-of-unification', 'desert-routes-rock-art-and-early-mobility',
  'egypt-and-mesopotamia-compared',
  'ritual-uncertainty-and-continuity', 'permanence-renewal-and-impermanence', 'egypt-and-early-buddhism',
  'households-work-and-unequal-access', 'writing-knowledge-and-administration', 'uniliteral-signs-and-egyptian-phonetic-writing',
  'proto-sinaitic-and-the-alphabetic-breakthrough', 'from-canaan-to-phoenician-greek-and-latin', 'egypt-and-its-neighbors',
  'legacy-of-ancient-egypt', 'egyptian-religion-in-greek-and-roman-worlds', 'egypt-after-the-pharaohs',
  'egyptology-museums-and-colonialism', 'egyptomania-and-popular-culture', 'egypt-africa-and-modern-identity',
  'suffering-misfortune-and-divine-justice', 'illness-healing-and-protection', 'animals-gods-and-nonhuman-agency',
  'monuments-labor-and-building-eternity', 'egypt-in-biblical-and-christian-memory', 'egyptian-wisdom-and-biblical-literature',
  'elephantine-judaeans-and-egyptian-religious-life', 'egypt-in-quranic-and-islamic-tradition', 'judgment-the-weighed-heart-and-later-afterlives',
  'nile-travel-dahabiyas-and-changing-river',
  'esna-khnum-temple-and-layered-town', 'el-kab-nekheb-city-and-provincial-memory', 'edfu-temple-town-and-sacred-history',
  'gebel-el-silsila-quarrying-sacred-landscape', 'kom-ombo-sobek-harwer-and-crocodiles',
  'living-nile-communities-work-food-and-hospitality', 'nubia-kush-displacement-and-living-identity',
];

const REQUIRED_PATHS = [
  'what-religion-does', 'early-state-formation', 'ritual-continuity', 'permanence-and-impermanence',
  'afterlives-of-egypt', 'vulnerable-bodies', 'material-more-than-human', 'prepare-esna-to-aswan', 'writing-to-latin', 'egypt-and-abrahamic-traditions',
];

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
  if (result.pages.length !== files.length) {
    failures.push(`${files.length} documents on disk but ${result.pages.length} in the manifest`);
  }

  for (const slug of REQUIRED_ARTICLES) {
    if (!result.pages.some((page) => page.slug === slug)) failures.push(`required article is missing: ${slug}`);
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
    for (const field of ['factual', 'humanizer', 'media_rights']) {
      if (!new RegExp(`^  ${field}: reviewed$`, 'm').test(source)) failures.push(`${file}: review.${field} is not recorded`);
    }
    if (!/^origin:\s*(course|supplemental|mixed)\s*$/m.test(source)) failures.push(`${file}: origin is not recorded`);
    if (!/^evidence:\s*(primary|archive|scholarship|mixed|speculative)\s*$/m.test(source)) failures.push(`${file}: explicit evidence is not recorded`);
    if (!/^  editorial:\s*reviewed\s*$/m.test(source)) failures.push(`${file}: review.editorial is not complete`);
  }

  const proseReviewPath = join(ROOT, 'content/prose-review.json');
  if (existsSync(proseReviewPath)) {
    const proseReview = JSON.parse(readFileSync(proseReviewPath, 'utf8')) as Record<string, { review?: Record<string, string> }>;
    for (const file of files) {
      const slug = file.slice(0, -3);
      const review = proseReview[slug]?.review;
      for (const field of ['factual', 'humanizer', 'media_rights']) {
        if (review?.[field] !== 'reviewed') failures.push(`${slug}: prose review ledger is missing ${field}`);
      }
    }
    for (const slug of Object.keys(proseReview)) {
      if (!files.includes(`${slug}.md`)) failures.push(`${slug}: prose review ledger has no matching page`);
    }
  } else {
    failures.push('content/prose-review.json is missing');
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

  const reviewedJson = [
    ...readdirSync(join(ROOT, 'content/journeys')).filter((file) => file.endsWith('.json')).map((file) => join(ROOT, 'content/journeys', file)),
    ...readdirSync(join(ROOT, 'content/objects')).filter((file) => file.endsWith('.json')).map((file) => join(ROOT, 'content/objects', file)),
    ...readdirSync(join(ROOT, 'content/paths')).filter((file) => file.endsWith('.json')).map((file) => join(ROOT, 'content/paths', file)),
  ];
  for (const path of reviewedJson) {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as (Journey | ObjectStudy | KnowledgePath)[] | Journey | ObjectStudy | KnowledgePath;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      const label = `${path}${'id' in item && item.id ? `#${item.id}` : ''}`;
      if (item.review?.factual !== 'reviewed') failures.push(`${label}: factual review is not recorded`);
      if (item.review?.humanizer !== 'reviewed') failures.push(`${label}: humanizer review is not recorded`);
      if (item.review?.media_rights !== 'reviewed') failures.push(`${label}: media-rights review is not recorded`);
      if (item.review?.editorial !== 'reviewed') failures.push(`${label}: editorial review is not recorded`);
    }
  }

  for (const note of notes) console.log(`warn   ${note}`);

  const generatedSourcesPath = join(ROOT, 'src/generated/sources.json');
  const generatedJourneysPath = join(ROOT, 'src/generated/journeys.json');
  const generatedPathsPath = join(ROOT, 'src/generated/paths.json');
  const generatedSourceRecords = existsSync(generatedSourcesPath)
    ? JSON.parse(readFileSync(generatedSourcesPath, 'utf8')) as Array<{ id: string; origin?: string; title?: string; sourceClass?: string; status?: string; use?: string; url?: string; files?: unknown[]; citedBy?: string[] }>
    : [];
  const generatedSourceIds = new Set(generatedSourceRecords.map((source) => source.id));
  if (existsSync(generatedSourcesPath)) {
    const sourceIdCounts = new Map<string, number>();
    for (const source of generatedSourceRecords) sourceIdCounts.set(source.id, (sourceIdCounts.get(source.id) ?? 0) + 1);
    for (const [id, count] of sourceIdCounts) if (count > 1) failures.push(`duplicate source ID ${id}`);
    for (let number = 1; number <= 36; number += 1) {
      const id = `C${String(number).padStart(2, '0')}`;
      if (!generatedSourceIds.has(id)) failures.push(`course source ${id} is missing`);
    }
    const researchNumbers = generatedSourceRecords
      .filter((source) => source.id.startsWith('R'))
      .map((source) => Number(source.id.slice(1)))
      .filter((number) => Number.isInteger(number) && number > 0);
    const highestResearchNumber = Math.max(81, ...researchNumbers);
    for (let number = 1; number <= highestResearchNumber; number += 1) {
      const id = `R${String(number).padStart(3, '0')}`;
      if (!generatedSourceIds.has(id)) failures.push(`research source ${id} is missing`);
    }
    for (const source of generatedSourceRecords) {
      if (!source.title || !source.sourceClass || !source.status || !source.use) failures.push(`source ${source.id} is missing catalog metadata`);
      if (source.origin === 'supplemental' && source.id !== 'R069' && !source.url) failures.push(`supplemental source ${source.id} has no public URL`);
      if (source.id === 'R069' && (source.url || (source.files?.length ?? 0) > 0)) failures.push('R069 has a public URL or file listing');
    }
    const privateSource = generatedSourceRecords.find((source) => source.id === 'R069');
    if (!privateSource || /raw|localLocator|\.pdf/i.test(JSON.stringify(privateSource))) {
      failures.push('R069 private-source metadata leaked into generated public output');
    }
  }
  if (existsSync(generatedJourneysPath)) {
    const journeys = JSON.parse(readFileSync(generatedJourneysPath, 'utf8')) as Journey[];
    const generatedPlacesPath = join(ROOT, 'src/generated/places.json');
    const publicPlaceIds = existsSync(generatedPlacesPath)
      ? new Set((JSON.parse(readFileSync(generatedPlacesPath, 'utf8')) as { id: string; visibility?: string }[])
        .filter((place) => place.visibility !== 'private' && place.visibility !== 'unidentified')
        .map((place) => place.id))
      : new Set<string>();
    const j01 = journeys.find((journey) => journey.id === 'esna-to-aswan-dahabiya');
    if (!j01) failures.push('J01 esna-to-aswan-dahabiya is missing');
    else {
      if (j01.origin !== 'supplemental') failures.push('J01 must be supplemental');
      if (j01.scenes.length !== 12) failures.push(`J01 must have 12 stages, found ${j01.scenes.length}`);
      if (!j01.includedScope || !j01.optionalExtensions) failures.push('J01 must separate included route and optional extensions');
      const ids = new Set(j01.scenes.map((scene) => scene.id));
      if (ids.size !== j01.scenes.length) failures.push('J01 stage IDs are not unique');
      const expectedDays = [1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 5];
      const expectedTypes = ['transfer', 'archaeological-site', 'living-community', 'archaeological-site', 'archaeological-site', 'living-community', 'archaeological-site', 'museum', 'market', 'living-community', 'sailing', 'arrival'];
      if (j01.scenes.some((scene, index) => scene.day !== expectedDays[index])) failures.push('J01 days do not follow the required twelve-stage sequence');
      if (j01.scenes.some((scene, index) => scene.stopType !== expectedTypes[index])) failures.push('J01 stop types do not follow the required twelve-stage sequence');
      for (const scene of j01.scenes) {
        if (!scene.reflection) failures.push(`J01 stage ${scene.id} has no reflection prompt`);
        if (!scene.sourceIds.length) failures.push(`J01 stage ${scene.id} has no scene-level sources`);
        for (const sourceId of scene.sourceIds) if (!generatedSourceIds.has(sourceId)) failures.push(`J01 stage ${scene.id} cites unknown source ${sourceId}`);
        if (!scene.sourcePages?.length) failures.push(`J01 stage ${scene.id} has no scene-level article links`);
        if (scene.sourcePages?.some((slug) => !result.pages.some((page) => page.slug === slug))) failures.push(`J01 stage ${scene.id} links to an unknown page`);
        if (scene.place && !publicPlaceIds.has(scene.place)) failures.push(`J01 stage ${scene.id} references a non-public place record`);
        if (/^(?:el-hegz|bisaw|nubian-town|private-household)$/i.test(scene.place ?? '') || /Nubian Town|private household at|exact coordinates|full address/i.test(`${scene.title} ${scene.kicker}`)) {
          failures.push(`J01 stage ${scene.id} contains a private or unidentified location label`);
        }
      }
      for (const scene of j01.scenes) if (!j01.accessibleSummary.toLowerCase().includes(scene.title.toLowerCase())) failures.push(`J01 accessible summary omits stage ${scene.id}`);
    }
  }
  if (existsSync(generatedPathsPath)) {
    const paths = JSON.parse(readFileSync(generatedPathsPath, 'utf8')) as KnowledgePath[];
    for (const id of REQUIRED_PATHS) {
      const path = paths.find((entry) => entry.id === id);
      if (!path) { failures.push(`required learning path is missing: ${id}`); continue; }
      if (path.origin !== 'supplemental') failures.push(`learning path ${id} must be supplemental`);
      if (!path.purpose || !path.orderReason || !path.leavesOut) failures.push(`learning path ${id} is missing purpose, order rationale, or leaves-out note`);
      if (path.steps.some((step) => !step.reflection)) failures.push(`learning path ${id} has a step without a reflection prompt`);
    }
  }
  const generatedArticles = join(ROOT, 'src/generated/articles');
  for (const slug of REQUIRED_ARTICLES) {
    const articlePath = join(generatedArticles, `${slug}.json`);
    if (!existsSync(articlePath)) continue;
    const article = JSON.parse(readFileSync(articlePath, 'utf8')) as { outgoing: unknown[]; backlinks: unknown[] };
    if (article.outgoing.length < 3) failures.push(`${slug}: fewer than three contextual outgoing links`);
    if (article.backlinks.length < 2) failures.push(`${slug}: fewer than two contextual inbound links`);
  }
  const generatedRoot = join(ROOT, 'src/generated');
  if (existsSync(generatedRoot)) {
    const generatedSources = JSON.parse(readFileSync(generatedSourcesPath, 'utf8')) as Array<Record<string, unknown>>;
    const generatedR069 = generatedSources.find((source) => source.id === 'R069');
    if (generatedR069 && /raw|localLocator|publicDownload|\.pdf/i.test(JSON.stringify(generatedR069))) {
      failures.push('private R069 path material appears beside its public record');
    }
  }
  for (const failure of failures) console.log(`error  ${failure}`);
  console.log(`\n${result.pages.length} pages, ${routes.length} routes, ${media.length} media records`);
  console.log(`${failures.length} errors, ${notes.length} warnings`);
  if (failures.length) process.exitCode = 1;
}

main();
