// Shared content model. Imported by the build scripts in `scripts/` and by the
// application in `src/`. Types only: nothing here emits runtime code.

export type EvidenceKind = 'primary' | 'archive' | 'scholarship' | 'speculative';

export type InlineNode =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: InlineNode[] }
  | { t: 'em'; c: InlineNode[] }
  | { t: 'code'; v: string }
  | { t: 'br' }
  | { t: 'term'; v: string; definition: string }
  | { t: 'link'; c: InlineNode[]; href: string; kind: LinkKind; slug?: string; hash?: string; sourceId?: string; missing?: boolean };

export type LinkKind = 'internal' | 'external' | 'source' | 'raw' | 'heading';

export interface TableCell {
  c: InlineNode[];
  align: 'left' | 'center' | 'right' | null;
}

export type BlockNode =
  | { t: 'heading'; level: number; id: string; text: string; c: InlineNode[] }
  | { t: 'paragraph'; c: InlineNode[] }
  | { t: 'list'; ordered: boolean; start?: number; items: BlockNode[][] }
  | { t: 'table'; head: TableCell[]; rows: TableCell[][] }
  | { t: 'quote'; c: BlockNode[] }
  | { t: 'callout'; kind: CalloutKind; label: string; c: BlockNode[] }
  | { t: 'code'; lang: string | null; v: string }
  | { t: 'hr' }
  | { t: 'media'; id: string };

export type CalloutKind = 'evidence' | 'uncertainty' | 'contested' | 'note' | 'reconstruction';

export interface HeadingRef {
  id: string;
  level: number;
  text: string;
}

export interface ContentReview {
  factual?: 'reviewed' | 'pending';
  humanizer?: 'reviewed' | 'pending';
  media_rights?: 'reviewed' | 'pending';
  editorial?: 'reviewed' | 'pending-human';
}

export interface PageFrontmatter {
  type: string;
  tags: string[];
  course?: string;
  updated?: string;
  summary?: string;
  aliases?: string[];
  periods?: string[];
  places?: string[];
  entities?: string[];
  media?: string[];
  relations?: CuratedRelation[];
  review?: ContentReview;
}

export interface CuratedRelation {
  target: string;
  type: EdgeType;
  note?: string;
}

/** A page as listed in the manifest. Light enough to ship on every route. */
export interface PageSummary {
  slug: string;
  title: string;
  route: string;
  type: string;
  section: SectionId;
  tags: string[];
  summary: string;
  aliases: string[];
  periods: string[];
  places: string[];
  entities: string[];
  updated: string | null;
  course: string | null;
  words: number;
  readingMinutes: number;
  headingCount: number;
  hasSources: boolean;
  sourceIds: string[];
  evidence: EvidenceKind;
}

export type SectionId =
  | 'home'
  | 'encyclopedia'
  | 'atlas'
  | 'chronology'
  | 'journeys'
  | 'objects'
  | 'learn'
  | 'archive'
  | 'field-guide';

export interface Backlink {
  slug: string;
  title: string;
  route: string;
  contexts: string[];
  relation: EdgeType;
}

/** One article payload, loaded lazily per route. */
export interface ArticlePayload {
  slug: string;
  title: string;
  route: string;
  meta: PageSummary;
  blocks: BlockNode[];
  toc: HeadingRef[];
  sourceIds: string[];
  outgoing: { slug: string; title: string; route: string }[];
  backlinks: Backlink[];
  related: RelatedPage[];
  neighborhood: GraphSlice;
  sourcePath: string;
}

export interface RelatedPage {
  slug: string;
  title: string;
  route: string;
  relation: EdgeType;
  note?: string;
  summary: string;
}

export type NodeKind =
  | 'article'
  | 'concept'
  | 'deity'
  | 'place'
  | 'period'
  | 'practice'
  | 'text'
  | 'object'
  | 'role'
  | 'source'
  | 'journey';

export type EdgeType =
  | 'links_to'
  | 'draws_from'
  | 'part_of'
  | 'appears_in'
  | 'associated_with'
  | 'practiced_at'
  | 'changes_during'
  | 'precedes'
  | 'maintains'
  | 'threatens'
  | 'restores'
  | 'contrasts_with'
  | 'contested_by'
  | 'depicted_in';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  summary: string;
  route: string | null;
  slug?: string;
  periods: string[];
  places: string[];
  evidence: EvidenceKind;
  degree: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  note?: string;
  source: string;
  weight: number;
}

export interface GraphSlice {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphData extends GraphSlice {
  generated: string;
  edgeTypes: EdgeType[];
}

export interface Entity {
  id: string;
  kind: NodeKind;
  label: string;
  aliases: string[];
  summary: string;
  slug?: string;
  periods?: string[];
  places?: string[];
  evidence?: EvidenceKind;
  epithets?: string[];
  iconography?: string[];
  cultCenters?: string[];
  relations?: CuratedRelation[];
  sourceIds?: string[];
}

export interface Period {
  id: string;
  label: string;
  start: number;
  end: number;
  approximate: boolean;
  kind: 'period' | 'intermediate' | 'era' | 'corpus' | 'institution' | 'evidence';
  summary: string;
  slug?: string;
  sourceIds?: string[];
}

export interface Place {
  id: string;
  label: string;
  aliases: string[];
  /** Schematic map coordinates, 0-100, Nile-oriented: y=0 is the Delta. */
  x: number;
  y: number;
  region: 'delta' | 'lower' | 'middle' | 'upper' | 'nubia' | 'fayum' | 'desert' | 'oasis' | 'sinai';
  bank: 'east' | 'west' | 'both' | 'none';
  summary: string;
  deities: string[];
  slug?: string;
  sourceIds?: string[];
  modernName?: string;
}

export interface SourceEntry {
  id: string;
  title: string;
  status: string;
  use: string;
  files: { label: string; path: string }[];
  citedBy: string[];
}

export interface MediaRecord {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'diagram';
  source: string;
  creator: string | null;
  institution: string | null;
  objectId: string | null;
  license: string;
  attribution: string;
  dateAccessed: string;
  period: string[];
  place: string[];
  caption: string;
  alt: string;
  transcript: string | null;
  status: 'cleared' | 'research-only' | 'requested';
  /** Authoritative image endpoint used by the local processing script. */
  masterUrl?: string;
  file?: string;
  width?: number;
  height?: number;
  variants?: { width: number; avif: string; webp: string; fallback: string }[];
  placeholder?: string;
  focalPoint?: { x: number; y: number };
  deepZoomSource?: boolean;
  deepZoom?: {
    tileSize: number;
    width: number;
    height: number;
    levels: { level: number; width: number; height: number; cols: number; rows: number; path: string }[];
  };
  poster?: string;
  note?: string;
  review?: ContentReview;
}

export interface NavSection {
  id: SectionId;
  label: string;
  route: string;
  blurb: string;
  groups: { label: string; pages: { slug: string; title: string; route: string; summary: string }[] }[];
}

export interface ContentManifest {
  generated: string;
  base: string;
  repositoryUrl: string | null;
  pages: PageSummary[];
  routes: string[];
  counts: Record<string, number>;
}

export interface SearchDoc {
  id: number;
  slug: string;
  title: string;
  route: string;
  type: string;
  section: SectionId;
  summary: string;
  periods: string[];
  places: string[];
  entities: string[];
  tags: string[];
  evidence: EvidenceKind;
  headings: HeadingRef[];
}

export type SearchFieldId = 0 | 1 | 2 | 3 | 4 | 5;

export interface SearchIndex {
  generated: string;
  docs: SearchDoc[];
  /** term -> packed postings: [docId, fieldBitmask, termFrequency, headingIndex] */
  postings: Record<string, number[][]>;
  excerpts: Record<string, string>;
  terms: number;
}

export interface JourneyScene {
  id: string;
  title: string;
  kicker: string;
  body: string;
  evidence: EvidenceKind;
  corpus?: string;
  place?: string;
  period?: string;
  sourceIds: string[];
  mediaId?: string;
  detail?: string[];
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  sourcePages: string[];
  sourceIds: string[];
  period: string;
  place: string;
  evidenceBoundary: string;
  reconstruction: string;
  scenes: JourneyScene[];
  accessibleSummary: string;
  review?: ContentReview;
}

export interface KnowledgePath {
  id: string;
  title: string;
  blurb: string;
  steps: { slug: string; why: string }[];
}

export interface ObjectRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  visible: string;
  reading: string;
  confidence: string;
  /** False when the region is discussed from adjacent material, not shown here. */
  imageRegion?: boolean;
}

export interface ObjectStudy {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  period: string;
  sourceIds: string[];
  imageStatus: string;
  evidenceNote: string;
  mediaId?: string;
  regions: ObjectRegion[];
  sequence: string[];
  lessons: { title: string; body: string }[];
  correction?: string;
  review?: ContentReview;
}

/** Interactive views derived from the wiki's own tables and sections. */
export interface VisualizationData {
  personhood: {
    rows: { id: string; term: string; meaning: string; image: string; angle: number }[];
    problems: { label: string; body: string }[];
  };
  corpora: { label: string; slug?: string; prominence: string; medium: string; user: string; emphases: string }[];
  creation: { id: string; place: string; creator: string; body: string[] }[];
  grammar: string[];
  weeks: { id: string; title: string; steps: { id: string; text: string; slugs: string[] }[]; checkpoint: string }[];
  checks: { id: string; title: string; lead: string; prompts: string[]; caution: string }[];
}
