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
  { label: 'Foundations', slugs: ['maat-isfet-and-kingship', 'heka-and-operative-ritual', 'personhood-and-the-afterlife', 'studying-religion-through-egypt', 'ritual-uncertainty-and-continuity', 'permanence-renewal-and-impermanence'] },
  { label: 'State, society, and material worlds', slugs: ['predynastic-egypt-and-state-formation', 'naqada-hierakonpolis-and-early-centers', 'abydos-umm-el-qaab-and-the-first-writing', 'narmer-and-the-making-of-unification', 'desert-routes-rock-art-and-early-mobility', 'egypt-and-mesopotamia-compared', 'households-work-and-unequal-access', 'writing-knowledge-and-administration', 'egypt-and-its-neighbors', 'suffering-misfortune-and-divine-justice', 'illness-healing-and-protection', 'animals-gods-and-nonhuman-agency', 'monuments-labor-and-building-eternity'] },
  { label: 'Myth and gods', slugs: ['creation-traditions', 'solar-cycle', 'osiris-isis-horus-and-set', 'deity-field-guide', 'set', 'sobek'] },
  { label: 'Practice and institutions', slugs: ['temples-priests-and-offerings', 'festivals-oracles-and-personal-piety', 'death-funeral-and-the-dead'] },
  { label: 'Religious literature', slugs: ['funerary-text-tradition', 'pyramid-texts', 'coffin-texts', 'amduat-and-book-of-gates', 'book-of-the-dead', 'book-of-the-dead-plate-30', 'ptahhotep-and-ethical-life'] },
  { label: 'Writing and transmission', slugs: ['uniliteral-signs-and-egyptian-phonetic-writing', 'proto-sinaitic-and-the-alphabetic-breakthrough', 'from-canaan-to-phoenician-greek-and-latin', 'writing-knowledge-and-administration'] },
  { label: 'Transformation and focused research', slugs: ['amarna-and-late-transformations', 'blue-water-lily-research', 'contested-interpretations', 'egyptian-religion-in-greek-and-roman-worlds', 'egypt-after-the-pharaohs'] },
  { label: 'Reception, memory, and identity', slugs: ['legacy-of-ancient-egypt', 'egyptology-museums-and-colonialism', 'egyptomania-and-popular-culture', 'egypt-africa-and-modern-identity', 'egypt-in-biblical-and-christian-memory', 'egyptian-wisdom-and-biblical-literature', 'elephantine-judaeans-and-egyptian-religious-life', 'egypt-in-quranic-and-islamic-tradition', 'judgment-the-weighed-heart-and-later-afterlives'] },
  { label: 'The Nile route', slugs: ['nile-travel-dahabiyas-and-changing-river', 'esna-khnum-temple-and-layered-town', 'el-kab-nekheb-city-and-provincial-memory', 'edfu-temple-town-and-sacred-history', 'gebel-el-silsila-quarrying-sacred-landscape', 'kom-ombo-sobek-harwer-and-crocodiles', 'living-nile-communities-work-food-and-hospitality', 'nubia-kush-displacement-and-living-identity'] },
  { label: 'Reference', slugs: ['visual-decoder', 'glossary', 'index'] },
];
