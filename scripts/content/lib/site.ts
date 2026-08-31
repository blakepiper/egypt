// Static site configuration shared by the build scripts and the application.
// The base path is the only thing that changes between a local preview and a
// GitHub Pages project deployment.

import type { SectionId } from '../../../src/types/content';

export const BASE = normalizeBase(process.env.BASE_PATH ?? '/');
export const REPOSITORY_URL = process.env.REPOSITORY_URL ?? null;

export function normalizeBase(value: string): string {
  let base = value.trim();
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

/** Application-relative route (always begins and ends with `/`). */
export function route(...segments: string[]): string {
  const path = segments.filter(Boolean).join('/');
  return path ? `/${path}/` : '/';
}

/** Pages that are not encyclopedia articles live under their own hub. */
export const SECTION_BY_SLUG: Record<string, SectionId> = {
  'egypt-trip-field-guide': 'field-guide',
  'course-reconstruction': 'learn',
  'course-reading-guide': 'learn',
  'course-materials-deep-notes': 'learn',
  'four-week-relearning-plan': 'learn',
  'exam-recovery-guide': 'learn',
  'student-work-reconstruction': 'archive',
  'web-research-supplement': 'archive',
  'source-catalog': 'archive',
  'reading-audit': 'archive',
  'coverage-map': 'archive',
  'log': 'archive',
};

/** Pages that also anchor a feature hub. */
export const FEATURE_PAGES: Record<string, SectionId> = {
  'sacred-geography': 'atlas',
  'chronology': 'chronology',
  'visual-decoder': 'objects',
  'book-of-the-dead-plate-30': 'objects',
  'pyramid-texts': 'objects',
  'coffin-texts': 'objects',
  'book-of-the-dead': 'objects',
  'ptahhotep-and-ethical-life': 'objects',
};

export const SECTION_LABELS: Record<SectionId, string> = {
  home: 'Home',
  encyclopedia: 'Encyclopedia',
  atlas: 'Atlas',
  chronology: 'Chronology',
  journeys: 'Journeys',
  objects: 'Objects and texts',
  learn: 'Learn',
  archive: 'Archive',
  'field-guide': 'Field guide',
};

/** Hub groupings for the encyclopedia index and article previous/next links. */
export const HUBS: { label: string; blurb: string; slugs: string[] }[] = [
  { label: 'Begin here', blurb: 'Orientation and the recurring pattern in one sitting.',
    slugs: ['start-here', 'how-egyptian-religion-works', 'chronology', 'sacred-geography'] },
  { label: 'Foundations', blurb: 'The ideas the rest of the archive depends on.',
    slugs: ['maat-isfet-and-kingship', 'heka-and-operative-ritual', 'personhood-and-the-afterlife'] },
  { label: 'Myth and gods', blurb: 'Creation, the solar circuit, the Osirian family, and the gods themselves.',
    slugs: ['creation-traditions', 'solar-cycle', 'osiris-isis-horus-and-set', 'deity-field-guide', 'set', 'sobek'] },
  { label: 'Practice and institutions', blurb: 'Temples, festivals, households, and the dead.',
    slugs: ['temples-priests-and-offerings', 'festivals-oracles-and-personal-piety', 'death-funeral-and-the-dead'] },
  { label: 'Religious literature', blurb: 'Overlapping funerary corpora and wisdom writing.',
    slugs: ['funerary-text-tradition', 'pyramid-texts', 'coffin-texts', 'amduat-and-book-of-gates', 'book-of-the-dead', 'book-of-the-dead-plate-30', 'ptahhotep-and-ethical-life'] },
  { label: 'Transformation and focused research', blurb: 'Amarna, the late afterlife of the tradition, and where the archive argues with itself.',
    slugs: ['amarna-and-late-transformations', 'blue-water-lily-research', 'contested-interpretations'] },
  { label: 'Reference', blurb: 'Look-up tools.',
    slugs: ['visual-decoder', 'glossary', 'index'] },
];
