// Section labels and hub groupings, mirrored from the build configuration so the
// application can order articles without loading the whole navigation payload.

import type { SectionId } from '../types/content';

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

export function sectionLabel(section: SectionId): string {
  return SECTION_LABELS[section] ?? section;
}

export const HUB_GROUPS: { label: string; slugs: string[] }[] = [
  { label: 'Begin here', slugs: ['start-here', 'how-egyptian-religion-works', 'chronology', 'sacred-geography'] },
  { label: 'Foundations', slugs: ['maat-isfet-and-kingship', 'heka-and-operative-ritual', 'personhood-and-the-afterlife'] },
  { label: 'Myth and gods', slugs: ['creation-traditions', 'solar-cycle', 'osiris-isis-horus-and-set', 'deity-field-guide', 'set', 'sobek'] },
  { label: 'Practice and institutions', slugs: ['temples-priests-and-offerings', 'festivals-oracles-and-personal-piety', 'death-funeral-and-the-dead'] },
  { label: 'Religious literature', slugs: ['funerary-text-tradition', 'pyramid-texts', 'coffin-texts', 'amduat-and-book-of-gates', 'book-of-the-dead', 'book-of-the-dead-plate-30', 'ptahhotep-and-ethical-life'] },
  { label: 'Transformation and focused research', slugs: ['amarna-and-late-transformations', 'blue-water-lily-research', 'contested-interpretations'] },
  { label: 'Reference', slugs: ['visual-decoder', 'glossary', 'index'] },
];
