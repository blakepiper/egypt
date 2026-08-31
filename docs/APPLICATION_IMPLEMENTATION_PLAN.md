# Application implementation plan

Status: approved and in build. See `IMPLEMENTATION_STATUS.md` for what is finished, what is open, and where to pick the work up.

This plan turns the current design-system specimen into a complete static application. The finished site will include the entire wiki, fast article navigation, search, a typed knowledge graph, maps, timelines, object viewers, and guided artistic experiences. It will deploy to GitHub Pages without a server or paid service.

## 1. Product outcome

The application should work at two speeds.

A reader who wants a fact should be able to search, open an article, scan its table of contents, follow links, inspect sources, and move on. This part should feel as dependable as Wikipedia.

A reader who has more time should be able to follow relationships through space, time, ritual, literature, and daily life. These experiences may use motion, sound, images, and short video, but they must keep their evidence visible. The application cannot recover a single, timeless "Ancient Egyptian consciousness." Each reconstruction must name its period, location, social position, evidence, and uncertainties.

The current design system remains the visual and component foundation. Implementation should extend it instead of replacing it.

## 2. Definition of complete

The first public release is complete when it meets all of these conditions:

- All 41 Markdown content documents in `llm-wiki/` have a working application route. `AGENTS.md` is an instruction file and is not published.
- The main encyclopedia pages support headings, tables, links, citations, source sections, and section permalinks.
- Search covers titles, aliases, headings, body text, tags, glossary terms, periods, places, deities, text corpora, and source IDs.
- The knowledge graph includes wiki pages plus curated entities and typed relationships.
- Every article shows backlinks and nearby graph relationships.
- The core maps, timelines, object viewers, and guided experiences listed in this plan are implemented.
- Every published image, audio file, and video has a rights record, caption, credit, and accessible alternative.
- User-facing copy has passed factual review and the `/humanizer` skill without changing claims, quotations, dates, citations, or uncertainty.
- The full application works with a keyboard, screen reader, reduced motion, muted audio, and a narrow mobile viewport.
- A production build passes content linting, TypeScript, unit tests, interaction tests, accessibility scans, performance budgets, and link checks.
- The generated `dist/` directory deploys correctly at an arbitrary GitHub Pages project path.

## 3. Constraints and working rules

### Source boundaries

- `llm-wiki/` remains the source of truth for written content.
- `raw/` remains immutable unless the user explicitly requests a change.
- Factual edits follow `llm-wiki/AGENTS.md`, including its evidence labels and source-catalog rules.
- Generated application data is disposable. A clean build must recreate it from the wiki and media manifest.
- Research notes and archive synthesis must never be presented as scholarly consensus.

### Hosting

- GitHub Pages is the only required host.
- There is no runtime database, server, secret, account system, or paid API.
- Routes, search data, graph data, media metadata, and article payloads are produced at build time.
- Personal state such as theme, bookmarks, recent pages, and journey progress stays in `localStorage`.

### Historical framing

- Dates, locations, evidence types, and disputed interpretations remain visible.
- The interface must not collapse three millennia into one version of Egypt.
- Artistic reconstruction is labeled in the same viewport where it appears.
- Generative imagery may support atmosphere, but it cannot illustrate a historical claim as if it were evidence.
- Modern recordings, reenactments, translations, and reconstructions must be described as modern.

## 4. Information architecture

### Primary sections

| Section | Purpose | Main routes |
| --- | --- | --- |
| Home | Orientation, featured paths, recent route, search entry | `/` |
| Encyclopedia | Wikipedia-style reading and browsing | `/wiki/<slug>/` |
| Atlas | Sacred geography, sites, regional traditions, Nile orientation | `/atlas/` |
| Chronology | Periods, overlapping developments, evidence changes | `/chronology/` |
| Knowledge graph | Full relationship explorer | `/graph/` |
| Journeys | Guided artistic and educational experiences | `/journeys/` and `/journeys/<slug>/` |
| Objects and texts | Visual and manuscript exploration | `/objects/` and `/objects/<slug>/` |
| Learn | Subject routes, learning plan, concept checks | `/learn/` |
| Archive | Sources, audits, research notes, maintenance history | `/archive/` |
| Field guide | Site and museum preparation | `/field-guide/` |

### Route strategy

Use real generated HTML entry points instead of hash routes. The build should emit paths such as `dist/wiki/start-here/index.html`. This gives each article a durable URL and allows direct reloads on GitHub Pages. All asset URLs and internal links must use Vite's configured base path.

Each generated page loads the same application shell and a small route-specific article payload. Shared code is cached. Search, the full graph, maps, and media viewers load only when opened.

### Desktop behavior

The Macintosh-style workspace remains useful, but it cannot get in the way of reading.

- Article windows can move, minimize, maximize, close, and return from the shelf.
- The URL and browser history track the active article, not window coordinates.
- A restored session may remember open windows and positions on desktop.
- The reader can select "Reset desktop" to recover a tidy layout.
- Mobile and print layouts ignore window coordinates and use normal document flow.
- Opening many articles should create tabs inside an article window by default. A modifier action may open a separate window.

## 5. Content model and build pipeline

### Frontmatter schema

Keep the existing fields and add optional structured fields as pages are reviewed:

```yaml
type: concept
tags: [geography, nile]
course: REL 395, Spring 2017, Northern Arizona University
updated: 2026-08-30
summary: One or two factual sentences for search and previews.
aliases: [Black Land and Red Land]
periods: [old-kingdom, middle-kingdom, new-kingdom]
places: [nile-valley, thebes]
entities: [maat, set, hapi]
media: [nile-aswan-001]
relations:
  - target: maat-isfet-and-kingship
    type: contextualizes
review:
  factual: reviewed
  humanizer: reviewed
  media_rights: reviewed
```

New fields should be added only after checking the page. Empty fields are omitted.

### Generated data

A build script should read the Markdown once and emit:

```text
src/generated/
  content-manifest.json
  navigation.json
  search-index.json
  graph.json
  entities.json
  periods.json
  places.json
  media.json
  articles/<slug>.json
```

`src/generated/` is ignored by Git. Tests should generate it before the application build.

### Markdown processing

The parser must support:

- YAML frontmatter
- Obsidian links with aliases and heading fragments
- stable heading IDs
- ordinary Markdown links
- tables
- short quotations
- footnotes when they are added
- source-catalog anchors
- callouts for evidence, uncertainty, and contested claims
- image and media references by media ID rather than raw file path

Unsafe HTML is rejected. Broken internal links, duplicate heading IDs, missing targets, and invalid media IDs fail the build.

### Content linting

Add a `content:check` command that verifies:

- all 41 content files appear in the manifest
- every internal link resolves
- every page is reachable from a hub, a link, or an explicit archive listing
- every substantive page has `## Sources in this archive`
- every source ID exists in `source-catalog.md`
- every media ID exists and has a rights status
- evidence and contested-claim callouts use valid types
- summaries and aliases do not conflict
- dates use a consistent BCE/CE format
- no application route collides with another route

### Humanizer review gate

Use the `/humanizer` skill for every piece of text written for the application, including navigation labels, onboarding, journey narration, captions, alternative text, transcripts, tooltips, empty states, errors, media credits, and article summaries.

The order matters:

1. Draft from named archive sources or approved application requirements.
2. Check every factual claim, date, name, and evidence label.
3. Run `/humanizer` in file or embedded mode.
4. Compare the result against the reviewed draft. The skill may change phrasing, but not facts, quotations, citations, uncertainty, or source status.
5. Record `review.humanizer: reviewed` only after that comparison.
6. Have a human read all guided narration before release.

Do not run quotations, transliterations, ancient text, bibliographic titles, source IDs, or filenames through a prose rewrite. The skill instructions themselves are not shipped in the application.

## 6. Complete wiki inventory

Every content document gets a route. The "Application treatment" column records the extra work beyond normal article rendering.

| Source file | Public destination | Application treatment |
| --- | --- | --- |
| `index.md` | Home | Main orientation, featured concepts, paths into Learn and Archive |
| `start-here.md` | Encyclopedia and Home | Core synthesis, concept-web entry, short guided introduction |
| `chronology.md` | Encyclopedia and Chronology | Layered timeline with approximate-date treatment |
| `sacred-geography.md` | Encyclopedia and Atlas | Nile-oriented map, Kemet/Deshret, east/west, cult-center links |
| `how-egyptian-religion-works.md` | Encyclopedia | Foundation article with relationship diagram |
| `maat-isfet-and-kingship.md` | Encyclopedia | Order, disorder, ethics, and kingship relationship view |
| `heka-and-operative-ritual.md` | Encyclopedia | Practice and evidence diagram with modern-category caution |
| `personhood-and-the-afterlife.md` | Encyclopedia and Journeys | Interactive personhood constellation |
| `creation-traditions.md` | Encyclopedia and Journeys | Side-by-side local creation-tradition explorer |
| `solar-cycle.md` | Encyclopedia and Journeys | Day, night, Duat, and rebirth cycle |
| `osiris-isis-horus-and-set.md` | Encyclopedia | Character and succession relationship graph |
| `deity-field-guide.md` | Encyclopedia and Field guide | Filterable deity cards linked to depictions and sites |
| `set.md` | Encyclopedia | Deity profile with historical change and contested readings |
| `sobek.md` | Encyclopedia | Deity profile, Fayum and Kom Ombo map links |
| `temples-priests-and-offerings.md` | Encyclopedia and Journeys | Temple-threshold and daily-service sequence |
| `festivals-oracles-and-personal-piety.md` | Encyclopedia and Journeys | Procession, oracle, household, and festival experience |
| `death-funeral-and-the-dead.md` | Encyclopedia and Journeys | Funeral sequence with evidence limits and source layers |
| `funerary-text-tradition.md` | Encyclopedia and Chronology | Overlapping-corpus timeline rather than replacement ladder |
| `pyramid-texts.md` | Encyclopedia and Objects | Text-study layout, source debate, corpus links |
| `coffin-texts.md` | Encyclopedia and Objects | Text-study layout and access/audience comparison |
| `amduat-and-book-of-gates.md` | Encyclopedia and Journeys | Twelve-hour underworld route with guarded thresholds |
| `book-of-the-dead.md` | Encyclopedia and Objects | Spell, vignette, judgment, and manuscript overview |
| `book-of-the-dead-plate-30.md` | Encyclopedia and Objects | Deep-zoom annotated image, hotspots, scene-reading sequence |
| `ptahhotep-and-ethical-life.md` | Encyclopedia and Objects | Passage and commentary view with hierarchy and listening themes |
| `amarna-and-late-transformations.md` | Encyclopedia and Chronology | Before/during/after Amarna comparison with later transformations |
| `blue-water-lily-research.md` | Encyclopedia and Archive | Evidence ladder for symbolism, botany, pharmacology, and uncertainty |
| `contested-interpretations.md` | Encyclopedia and Archive | Claim/source/method comparison with prominent warnings |
| `visual-decoder.md` | Encyclopedia, Objects, and Field guide | Interactive visual identification tool |
| `glossary.md` | Encyclopedia | Searchable definitions and automatic first-use term links |
| `egypt-trip-field-guide.md` | Field guide | Site cards, offline-friendly checklist, linked visual decoder |
| `course-reconstruction.md` | Learn | Archive structure and surviving-material map |
| `course-reading-guide.md` | Learn | Subject route with completion stored locally |
| `course-materials-deep-notes.md` | Learn and Archive | Dense source-note view, packet filters, source links |
| `four-week-relearning-plan.md` | Learn | Four-week checklist with local progress and reset |
| `exam-recovery-guide.md` | Learn | Concept checks, revealable notes, linked ideas |
| `student-work-reconstruction.md` | Archive | Research notes with corrections and evidence limits visible |
| `web-research-supplement.md` | Archive | Modern checks separated from the source record |
| `source-catalog.md` | Archive | Filterable source catalog, stable C IDs, file and page relationships |
| `reading-audit.md` | Archive | Reading-depth and incorporation status table |
| `coverage-map.md` | Archive | Source-to-page coverage matrix and maintenance status |
| `log.md` | Archive | Plain maintenance log, newest entry first in the interface |

## 7. Wikipedia-style reading experience

### Article shell

Every article needs:

- breadcrumb trail
- title, summary, page type, tags, period, and place when known
- evidence overview
- collapsible table of contents
- reading progress indicator that does not move content
- section permalinks and copy-link action
- correctly rendered internal links and source-catalog links
- inline term definitions on first use
- media with caption, credit, date, location, rights, and alternative text
- source section with stable C IDs
- backlinks grouped by relationship
- related articles based on curated graph edges, not keyword similarity alone
- previous and next links within the current hub or guided path
- print stylesheet that removes desktop chrome and motion
- a direct link to the corresponding Markdown source when the public repository URL is configured

### Search and browse

Generate a compact inverted index at build time. Load it when search first opens.

Search ranking should favor exact title, alias, heading, glossary term, entity, body occurrence, and source ID in that order. Results show a short factual excerpt, page type, period, and evidence status. Filters cover type, period, place, deity, practice, text corpus, and contested material.

Browse views include:

- alphabetical article index
- topics by hub
- deities
- places
- periods
- practices
- primary texts and corpora
- source groups
- all media

### Link behavior

Ordinary activation replaces the active article. A modifier click or "Open in new window" action opens another desktop window. Hover previews are optional on pointer devices and must never be the only way to reach information.

Broken routes show a useful static page with search, nearby matches, and Home. They must not show a generic hosting error.

## 8. Knowledge graph

### Data model

The graph has two layers.

The document layer comes from resolved wiki links and source citations. The semantic layer comes from reviewed entities and explicit `relations` frontmatter.

Node types:

- article
- concept
- deity
- place
- period
- practice
- text or corpus
- object
- person or social role
- source group
- guided experience

Initial edge types:

- `links_to`
- `draws_from`
- `part_of`
- `appears_in`
- `associated_with`
- `practiced_at`
- `changes_during`
- `precedes`
- `maintains`
- `threatens`
- `restores`
- `contrasts_with`
- `contested_by`
- `depicted_in`

Each curated edge has a source page and optional note. Do not infer a precise edge type from an ordinary wiki link.

### Build process

1. Resolve every wiki link into a document edge.
2. Load curated entities, aliases, periods, places, and relations.
3. Validate targets and edge vocabulary.
4. Generate backlinks and relationship summaries.
5. Produce deterministic initial coordinates at build time so the graph does not jump on load.
6. Emit a small article-neighborhood graph with each article payload.
7. Lazy-load the complete graph only on `/graph/`.

### Graph interface

The full explorer needs:

- search and type filters
- period and place filters
- selectable relation types
- one-hop and two-hop expansion
- a pinned-node tray
- readable edge labels on focus or selection
- a side panel with summary, evidence, related media, and article action
- breadcrumbs for the path the user followed
- a "Why are these connected?" explanation drawn from the curated relation note
- sharable graph state encoded in a compact URL query
- a reset action

The graph should use SVG for the reviewed core graph. Large source or entity layers may use Canvas for rendering, but every selected node and visible relationship must also exist in an accessible HTML list. Keyboard users need arrow-key movement among neighboring nodes, Home to return to the focused origin, and a predictable tab order.

On reduced motion, nodes move directly to deterministic positions. On low-performance devices, the graph starts in a static clustered layout.

### Knowledge paths

Curated paths use the same graph data but present a clear sequence. Initial paths:

- Renewable continuity
- From creation to daily temple service
- Re through night and day
- Osiris, succession, death, and regeneration
- Maat across ethics, kingship, and ritual
- Body, name, ka, ba, and akh
- Nile, sacred geography, Sobek, and Hapi
- Pyramid Texts to Coffin Texts to Book of the Dead, with overlap kept visible

## 9. Interactive and artistic experiences

Each experience gets a short written brief before coding. The brief identifies its question, sources, time and place, interaction, media, evidence boundary, accessible equivalent, reduced-motion behavior, and performance budget.

| Experience | Source pages | Interaction and media | Evidence boundary and fallback |
| --- | --- | --- | --- |
| The Nile year | `sacred-geography`, `sobek`, `chronology` | Seasonal water level, field and labor changes, map layer, optional river footage | Treats the three-season model as a lens, not a day-by-day simulation. Static illustrated sequence and transcript |
| Solar cycle | `solar-cycle`, `amduat-and-book-of-gates` | Scroll or step through sunset, twelve night hours, sunrise, named thresholds, object images | Ancient sources differ. Every scene names its corpus. Reduced-motion stepper |
| Temple morning | `temples-priests-and-offerings` | Move through architectural thresholds and the repeated service of a cult image | Does not place an ordinary visitor inside restricted sanctuary space. Ordered text and plan view |
| Festival procession | `festivals-oracles-and-personal-piety`, `sacred-geography` | Route map, discrete procession movement, crowd access, petition and oracle context | Place and festival remain specific. Accessible timeline and route list |
| Personhood constellation | `personhood-and-the-afterlife` | Select body, heart, name, shadow, ka, ba, and akh to see roles and relationships | Avoids translating all parts as "soul." Text matrix duplicates the diagram |
| Creation traditions | `creation-traditions`, `how-egyptian-religion-works` | Compare local traditions without forcing one winner; reveal shared and different elements | Labels source and cult center. Static comparison table |
| Funerary corpus river | `funerary-text-tradition`, `pyramid-texts`, `coffin-texts`, `book-of-the-dead` | Overlapping streams by period, audience, medium, and theme | Explicitly rejects a simple replacement model. Accessible chronological table |
| Twelve guarded hours | `amduat-and-book-of-gates`, `solar-cycle` | Threshold navigation, gates, beings, Re, Osiris, Apep, and rebirth | Corpus-specific labels and uncertainty. No claim that the Duat is one fixed map |
| Plate 30 close reading | `book-of-the-dead-plate-30`, `visual-decoder` | Deep zoom, toggled annotations, scene-order guide, source panel | Annotations distinguish what is visible from scholarly interpretation |
| Sacred atlas | `sacred-geography`, deity pages, field guide | Nile-first map, cult centers, east/west, Upper/south and Lower/north | A linked place list duplicates the map and corrects common orientation errors |
| Chronology layers | `chronology`, historical transformation pages | Period bands, corpus bands, institutions, evidence survival | Approximate dates are visually and textually marked |
| Lived perspectives | practice pages plus new reviewed synthesis | Short evidence-based views of agricultural labor, artisans, household practice, priestly service, and royal ritual | No universal inner monologue. Each perspective names period, place, source base, and missing evidence |
| Visual decoder | `visual-decoder`, deity and object pages | Clickable crowns, gestures, figures, scene registers, and materials | Identification confidence and alternate readings remain visible. Text identification key |
| Field companion | `egypt-trip-field-guide`, atlas, visual decoder | Site and museum prompts, saved list, print view | Current logistics are excluded unless checked against current official sources at release time |

### Lived-perspective writing

This work needs its own research and review pass. Do not write first-person historical fiction from general knowledge.

For each perspective:

1. Choose a period, place, social role, and bounded situation.
2. Identify the surviving textual, visual, object, and archaeological evidence.
3. Separate direct evidence from inference.
4. Write in close third person unless a primary source supports quoted first-person language.
5. Mark artistic connective tissue in the interface.
6. Run factual review, `/humanizer`, and human editorial review.
7. Provide a "How this was reconstructed" panel beside the experience.

## 10. Media plan

### Media manifest

Every asset is registered before use:

```json
{
  "id": "plate-30-overview",
  "kind": "image",
  "source": "authoritative object or collection URL",
  "creator": "creator or photographer when known",
  "institution": "holding institution",
  "objectId": "collection identifier",
  "license": "exact license or permission",
  "attribution": "required public credit",
  "dateAccessed": "YYYY-MM-DD",
  "period": ["new-kingdom"],
  "place": ["thebes"],
  "caption": "Reviewed caption",
  "alt": "Reviewed alternative text",
  "transcript": null,
  "status": "cleared"
}
```

Only `cleared` assets enter a production build. `research-only` assets may appear in local review tools but never in `dist/`.

### Image acquisition

Use these priorities:

1. Authoritative open-access museum or library object photography.
2. Clearly licensed site, landscape, map, and archaeological photography.
3. Original diagrams, maps, and code-rendered visualizations.
4. Commissioned or locally created artwork.
5. Generative artwork for atmosphere, only when clearly labeled and never used as documentary evidence.

The implementation pass should browse current institutional records to verify object metadata and rights. Do not rely on search-result thumbnails, filenames, or assumed public-domain status.

Initial media coverage target:

- one reviewed lead image for each major encyclopedia hub
- object images for the visual decoder and text-study pages
- site and map imagery for the atlas and field guide
- comparison images for creation, deity, temple, and funerary sections where evidence supports them
- posters and stills for every video
- original diagrams for relationships that photographs cannot explain

Pages should not receive decorative images merely to meet a quota.

### Image processing

At build time:

- keep an archival master outside the deployed bundle
- produce AVIF and WebP when supported by the source and build tools
- keep JPEG or PNG fallback when needed
- generate several responsive widths
- preserve alpha only when it serves the composition
- strip unnecessary metadata while preserving required credit in the manifest
- generate low-resolution placeholders without hiding alternative text
- enforce focal-point metadata for narrow crops
- avoid enlarging a source beyond useful resolution

Lead images should normally stay below 250 KB at their common desktop size. Deep-zoom objects use tiles so the reader does not download the full master at page load.

### Video

Video should explain movement, space, process, or material that a still image cannot.

Good uses include a short Nile current, movement through a reconstructed temple plan, a page or papyrus unfolding, an object turning under controlled light, or a procession route. CSS, SVG, or Canvas motion is preferable when it can convey the same idea at lower cost.

Rules:

- no autoplay with sound
- no essential information available only in video
- visible native controls
- captions and a full transcript
- reviewed poster image
- `preload="metadata"` or `preload="none"`
- user choice remembered for sound and ambient motion
- no flashing or rapid cuts
- modern reconstructions labeled in the player and transcript
- local short loops kept small, ideally under 8 MB each
- long institutional videos loaded through a click-to-load external embed or opened on the authoritative site

Do not depend on a third-party video platform for a core article or journey.

### Audio

Audio is optional and always off by default. Environmental recordings can support the Nile or desert only when their source and location are documented. Modern spoken Egyptian, reconstructed pronunciation, music, and ritual reenactment need explicit labels. Every spoken track needs a transcript. The application remains complete when muted.

### Generated visual material

Use the image-generation skill only for project-owned atmospheric art, transitions, or clearly interpretive scenes. Save the final prompt, model path, generated source file, edits, and review status in the media record. Do not generate fake artifacts, inscriptions, translations, museum photographs, or archaeological evidence.

The current pixel-stela app icon remains provisional until the underlying reference and derivative-use decision are reviewed.

## 11. Application architecture

### Proposed directory layout

```text
scripts/
  content/
    build-content.ts
    check-content.ts
    build-search.ts
    build-graph.ts
    build-routes.ts
  media/
    build-media.ts
    check-rights.ts
content/
  entities/
  places/
  periods/
  paths/
  journeys/
  media-manifest.json
src/
  app/
    router/
    state/
    shell/
  design-system/
  features/
    articles/
    search/
    graph/
    atlas/
    chronology/
    journeys/
    objects/
    learn/
    archive/
  generated/
  workers/
  App.tsx
tests/
  content/
  components/
  e2e/
public/
  media/
```

### State

Use React state for the active view and component state. Use a small application context for open windows, theme, motion, sound, and route state. Do not add a general state library unless the graph or desktop manager demonstrates a real need.

Persist only:

- theme
- reduced-motion override when the user sets one
- sound preference and volume
- low-performance mode
- bookmarks
- recently viewed pages
- learning-plan and journey progress
- desktop window layout on wide screens

Version stored data so a future release can migrate or discard incompatible fields safely.

### Rendering

- Article content is preprocessed Markdown rendered through reviewed React components.
- Main routes have generated HTML entry points.
- Article JSON is split by page.
- Search, graph, deep zoom, and maps are lazy chunks.
- Knowledge-graph layout data is prepared at build time.
- Expensive filtering or graph layout changes move to a Web Worker only if profiling shows main-thread delay.
- Maps use local vector geometry or lightweight SVG. Do not require a commercial tile service.

### Component additions

Build these reusable pieces before feature-specific screens:

- `ArticleShell`
- `ArticleHeader`
- `TableOfContents`
- `Citation`
- `SourceList`
- `EvidenceCallout`
- `TermDefinition`
- `Backlinks`
- `RelatedPages`
- `SearchDialog`
- `FilterBar`
- `Timeline`
- `MapFrame`
- `GraphViewport`
- `GraphList`
- `MediaFigure`
- `DeepZoomViewer`
- `VideoPlayer`
- `AudioControl`
- `Transcript`
- `RightsCredit`
- `JourneyFrame`
- `ReconstructionBoundary`
- `DesktopShelf`
- `ResetDesktopAction`

Every component needs a story or specimen, keyboard behavior, narrow-layout treatment, reduced-motion behavior when relevant, and an automated accessibility check.

## 12. Accessibility, performance, and privacy

### Accessibility

- WCAG 2.2 AA is the release target.
- Use semantic headings and landmarks in generated articles.
- Managed windows need a non-drag keyboard equivalent for moving or resetting them. Dragging is optional, never required.
- Dialogs trap focus, close with Escape, and restore focus.
- Graphs, maps, timelines, and diagrams have equivalent lists or tables.
- Media controls have accessible names and work at 200 percent zoom.
- Alternative text describes what matters for the surrounding argument, not every visible detail.
- Captions and transcripts include speaker and sound cues when relevant.
- Reduced motion removes continuous movement and converts spatial transitions to direct state changes.
- The Duat theme and every evidence color pass contrast checks.
- Print output preserves article hierarchy, citations, URLs, and media credits.

### Performance budgets

Targets for the common article route:

- initial JavaScript at or below 180 KB gzip
- initial CSS at or below 50 KB gzip
- route-specific article data at or below 80 KB gzip for ordinary pages
- lead image at or below 250 KB at the displayed breakpoint
- no video downloaded before the reader activates it
- no full graph or map bundle on an ordinary article load
- no long task over 200 ms in the normal reading path on a midrange mobile profile

Measure route load, interaction latency, layout shift, memory use, and graph responsiveness in automated browser tests. Treat budgets as build failures once baselines are stable.

### Privacy

The first release uses no analytics, advertising, trackers, accounts, or remote fonts. External video or media embeds require an explicit click before contacting the provider. The privacy note should explain local preferences in plain language.

## 13. Testing and review

### Automated checks

| Area | Checks |
| --- | --- |
| Content | Frontmatter schema, all pages ingested, links, anchors, citations, sources, media IDs, orphan pages |
| Build | TypeScript, static route generation, arbitrary base path, clean rebuild |
| Components | Rendering, keyboard behavior, focus, reduced motion, window state |
| Search | Ranking fixtures, aliases, headings, glossary terms, filters, source IDs |
| Graph | Node and edge validation, deterministic layout, relation explanations, accessible list parity |
| Media | Rights status, required credits, alt text, captions, transcripts, file budgets |
| Accessibility | Axe scans, keyboard journeys, screen-reader spot checks, zoom, contrast |
| Responsive | 320 px through wide desktop, no document overflow, touch targets |
| Visual | Screenshot baselines for core articles, graph, maps, journeys, daylight, and Duat |
| Performance | Bundle budgets, media requests, route timing, graph interaction |
| Deployment | Direct route reloads, 404 page, asset base path, cache behavior |

### Editorial review

Every major feature has four approvals:

1. Content matches the archive and labels uncertainty correctly.
2. User-facing prose has passed `/humanizer` and comparison against the factual draft.
3. Media rights, caption, credit, and alternative are complete.
4. The artistic treatment does not imply more certainty than the evidence supports.

For specialized new historical synthesis, obtain subject-matter review before calling the page finished.

## 14. Implementation sequence

### Phase 0: freeze the specimen and establish baselines

Work:

- preserve the current design-system views as reference routes
- record current screenshots, bundle sizes, contrast results, and tests
- separate prototype copy from production content
- add the content, media, route, and review schemas
- decide the public repository URL and GitHub Pages base path configuration

Exit gate:

- the existing specimen still builds and can be compared against later work
- schemas have validation tests

### Phase 1: build the content compiler

Work:

- parse frontmatter, Markdown, headings, tables, and Obsidian links
- resolve source-catalog anchors
- emit article payloads and the content manifest
- implement content linting
- generate one HTML entry point per article
- add a development watch mode

Exit gate:

- all 41 documents compile
- every internal link resolves
- direct route reloads work under a test project base path

### Phase 2: ship the encyclopedia shell

Work:

- build article layout, table of contents, section links, sources, backlinks, related pages, and print styles
- add Home, Encyclopedia index, Learn, Archive, and Field guide hubs
- render every Markdown construct in the wiki
- add 404 and route recovery
- implement desktop tab behavior and reset action

Exit gate:

- every content page is readable on desktop and mobile
- the application already functions as a complete linked wiki without advanced media

### Phase 3: add search and structured browse

Work:

- add summaries, aliases, entity tags, periods, and places during page review
- generate and lazy-load the search index
- implement search ranking, excerpts, filters, keyboard controls, and result routes
- add alphabetical, topic, deity, place, period, text, source, and media indexes

Exit gate:

- test queries find expected pages and source IDs
- search works offline after the static assets load

### Phase 4: build the knowledge graph

Work:

- define entity registries and edge vocabulary
- convert resolved links and citations into document edges
- curate semantic relationships for core pages
- generate deterministic layouts and article neighborhoods
- build the full graph, filters, detail panel, path history, share state, and accessible list
- connect related-article panels to curated graph data

Exit gate:

- every core page has a useful local graph
- all curated edges explain their connection and point back to source content
- keyboard and reduced-motion graph use is complete

### Phase 5: establish the media library

Work:

- inventory needed objects, sites, maps, diagrams, video, and optional audio
- research authoritative records and current rights
- create the media manifest and review queue
- process responsive image variants and deep-zoom tiles
- build media, video, transcript, credit, and rights components
- replace prototype references with cleared assets

Exit gate:

- no uncleared file enters the production build
- major encyclopedia hubs and the first experiences have reviewed media

### Phase 6: implement foundational visualizations

Build in this order:

1. chronology layers
2. sacred atlas
3. personhood constellation
4. creation-tradition comparison
5. funerary corpus river
6. Plate 30 object viewer
7. visual decoder

Exit gate:

- each visualization has accessible list or table parity
- each one meets its media and performance budget

### Phase 7: implement guided experiences

Build in this order:

1. The Nile year
2. Temple morning
3. Festival procession
4. Solar cycle
5. Twelve guarded hours
6. Lived perspectives

For each experience, complete the research brief, narration, evidence panels, `/humanizer` pass, media, transcript, reduced-motion version, and tests before starting the next one.

Exit gate:

- all six journeys are source-labeled, complete when muted, and usable without animation

### Phase 8: finish Learn, Archive, and field use

Work:

- add local progress to the reading route, learning plan, and concept checks
- finish source-catalog filters and coverage views
- create field-guide checklists and print layouts
- connect objects, sites, deities, and visual-decoder entries
- review all archive-control pages for clear public framing

Exit gate:

- learning, archive, and field-guide workflows are complete
- progress data can be reset and does not leave the browser

### Phase 9: harden and release

Work:

- run a complete factual and humanizer review
- audit all media rights and credits
- finish screen-reader, keyboard, touch, zoom, reduced-motion, and low-performance testing
- meet bundle and media budgets
- test direct links under the real GitHub Pages base path
- document the manual GitHub Pages build and deployment path
- publish a release candidate for review
- fix release-blocking findings and deploy the approved build

Exit gate:

- every item in the definition of complete passes

## 15. Decisions to approve before implementation

The plan recommends these defaults:

1. Generate real static article routes instead of using hash URLs.
2. Publish all 41 content documents, with audit and log pages grouped under Archive.
3. Keep the current desktop metaphor but open most article links as tabs, not new floating windows.
4. Use no analytics in the first release.
5. Keep audio off by default and optional.
6. Host only short, essential video locally. Open long institutional video on its authoritative site or through click-to-load embeds.
7. Use generative imagery only for labeled atmospheric material.
8. Keep the current pixel-stela icon provisional until its derivative-use status is reviewed.
9. Add new lived-perspective content only after a source brief and historical review.
10. Treat current tourism logistics as a separate, date-stamped research task near release.

Any change to these defaults should happen before its dependent phase begins.

## 16. Deliberate exclusions from the first release

The first release does not need:

- accounts or cloud sync
- comments or public editing
- a server-side CMS
- an AI chatbot
- live external data
- a commercial map service
- social feeds
- autoplay media
- virtual reality

These features add hosting, privacy, moderation, cost, or historical-accuracy problems without improving the core archive. They can be reconsidered after the static application is complete.

## 17. Final acceptance checklist

### Content

- [ ] 41 content documents are published and reachable.
- [ ] Zero broken wiki links, heading links, source IDs, or media IDs.
- [ ] Evidence status and uncertainty survive the build.
- [ ] Every new factual passage has a source trail.
- [ ] User-facing prose has passed `/humanizer` and factual comparison.

### Encyclopedia

- [ ] Articles support tables, citations, source sections, backlinks, related pages, print, and stable section links.
- [ ] Search and browse cover the full corpus.
- [ ] Direct article URLs reload on GitHub Pages.

### Graph and interactive work

- [ ] The full knowledge graph and article neighborhoods use reviewed relationships.
- [ ] Maps, timelines, graphs, and diagrams have equivalent text or tables.
- [ ] All listed core visualizations are complete.
- [ ] All six guided experiences are complete.
- [ ] Lived perspectives show their reconstruction method and limits.

### Media

- [ ] Every deployed asset is cleared in the media manifest.
- [ ] Images have captions, credits, rights, and alternative text.
- [ ] Video and audio have controls, captions or transcripts, posters, and labels.
- [ ] Generated art is identified as interpretive and never presented as evidence.

### Quality

- [ ] Keyboard, screen reader, reduced motion, muted audio, mobile, print, and low-performance modes work.
- [ ] Contrast, bundle, route-data, image, and video budgets pass.
- [ ] TypeScript, content lint, unit, integration, browser, accessibility, visual, and deployment tests pass.
- [ ] `npm audit` reports no known vulnerabilities in the release dependency tree.
