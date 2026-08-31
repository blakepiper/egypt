# The Living Archive — design system

## Purpose

The system supports two experiences without splitting into two brands:

1. a precise, source-conscious reference interface for reading and searching the wiki;
2. guided, atmospheric passages through relationships, places, practices, and cycles.

The central design test is: **does wonder sharpen attention to the evidence?** An effect that obscures period, place, provenance, uncertainty, or readability does not belong.

## Source audit

### Floop: reuse

- **Window as the signature container.** A title bar, visible frame, and compact status strip give articles, maps, source viewers, and guided passages a stable information model.
- **Borders define interaction.** Clickable surfaces remain visually explicit without depending on color alone.
- **Hard offset shadows.** They communicate elevation and collapse mechanically when pressed.
- **Three type voices.** Compact UI, expressive display, and tabular/monospace metadata remain useful.
- **One-bit texture.** Register lines, dither, and restrained grids create tactility without image payloads.
- **Small tokens and plain CSS.** The system remains portable, static, and cheap to render.

### Floop: adapt

- Window widgets become abstract status marks, not skeuomorphic traffic lights.
- Grip lines also recall horizontal registers and manuscript ruling.
- The desktop becomes a digital field instrument rather than a poolside computer.
- Floop's instant mechanical motion remains on controls; longer flowing motion is reserved for water, procession, and cosmological cycles.
- Didone display styling becomes a quieter old-style serif, avoiding luxury-editorial Egypt clichés.

### Floop: reject

- Dusty pink desktop ground, mint/blush brand pairing, Miami sunset colors, beach imagery, and pool references.
- Palm trees as atmosphere. Palms may appear only when contentually meaningful in a sourced landscape image.
- Vaporwave neon, soft blur, glass surfaces, giant pills, and nostalgic decoration without an information role.
- Tiny long-form text. Archive reading starts at `1.0625rem` with a generous line height.

## Reference-image synthesis

Every file in `design-inspiration/` was visually reviewed. Detailed provenance boundaries are in [REFERENCE_ASSETS.md](REFERENCE_ASSETS.md).

| Reference | Useful observation | Translation into the system |
| --- | --- | --- |
| Valley of the Kings interior | Axial descent, painted ceilings, dense bands of inscription, blue/gold overhead | Threshold sequences, deep perspective, register lines, sacred blue used sparingly |
| Nile landscape | A cool river line organizes warm desert and cultivated banks | Nile blue is primary navigation; warm surfaces hold content; the river becomes a conceptual spine |
| Papyrus manuscript | Fibrous ground, high-contrast ink, irregular surviving edge | Warm reading surfaces, carbon ink, visible document status; no fake torn-paper card edges |
| “Ascent of Egypt” map screenshot | Geographic overview and labeled routes make large systems navigable | Map/atlas mode and explicit wayfinding; game progression mechanics are rejected |
| Eastern Desert | Wide tonal fields, dark mineral ridges, blue horizon | Layered landscape palette and dark Duat theme; no scenic wallpaper dependency |
| Abydos facade, wide view | Repetition, frontal symmetry, procession toward a shaded threshold | Grid discipline, repeated component bays, strong entrance axis |
| Isometric strategy-game settlement | Bird's-eye legibility of institutions and routes | Future site maps may reveal networks and scale; saturated game UI is rejected |
| Stela of Ankh-af-na-khonsu | Arched top, stacked registers, compact mineral palette | Arched emphasis containers and banded information hierarchy; symbols are not reused decoratively |
| Egyptian town game scene | Interdependence among river, fields, homes, roads, and temple | Lived-experience views should show systems of labor and access, not isolated monuments |
| Abydos facade, close view | Alternating light and deep shade between piers | Raised/sunken surface roles and threshold contrast |

Recurring principles are **axis**, **register**, **threshold**, **ecological contrast**, **repetition**, and **evidence-bearing surface**.

## Design principles

1. **Evidence travels with experience.** Primary source, archive synthesis, scholarship, and contested or artistic reconstruction are persistent interface states.
2. **The Nile organizes; it does not decorate.** Water structures journeys, geography, seasons, movement, and relationships.
3. **A threshold reveals one layer at a time.** Guided experiences disclose context progressively and explicitly stop at the edge of recoverable evidence.
4. **Period and place resist timeless Egypt.** Every production article or reconstruction must expose chronology and location near its title.
5. **Material, not costume.** Papyrus, limestone, pigment, and register geometry inform behavior and hierarchy; pseudo-hieroglyph typography and ornamental symbol scattering are prohibited.
6. **Quiet scholarship, concentrated wonder.** Article reading is calm. Animation and spatial drama occur at meaningful transitions.

## Foundations

### Color

Semantic roles live in `src/design-system/tokens.css`. Components consume roles such as `--archive-color-surface`, never raw pigments.

- `surface` / `surface-raised`: papyrus and limestone for reading and controls.
- `primary` / `primary-soft`: Nile and faience for navigation and active relationships.
- `secondary`: red ochre for time, change, and human activity.
- `sacred`: Egyptian blue for cosmology or divine-presence emphasis.
- `gold`: rare celestial and focal markers, never a general luxury treatment.
- `danger`: warnings, disputed claims, and destructive operations—not “evil.”

The optional `duat` theme is contextual: a deep-blue night-reading mode suitable for underworld or astronomical material. It is not presented as a universal ancient night palette.

### Typography

- **Display:** old-style system serif for page titles and experiential thresholds. It is never used to imitate hieroglyphs.
- **Reading:** a broad system serif stack, `1.0625rem`, maximum measure `68ch`, and `1.72` line height.
- **UI:** Geneva/Verdana/system sans for compact, highly legible controls.
- **Data:** Monaco/system monospace for source IDs, dates, transliteration metadata, coordinates, and file paths.

Transliterated Egyptian terms should use the reading face with correct Unicode, a language/notation explanation on first use, and no artificial “Egyptian” display treatment. BCE/CE ranges and uncertain dates use tabular data styling. Primary-source quotations use the reading face and must sit beside their source ID and translation information.

### Geometry, elevation, and texture

- 1px borders for structure; 2px for active or critical emphasis.
- 2px, 4px, and 7px hard offset shadows; never blurred shadows.
- 4px spacing rhythm.
- Small rectangular radii for windows and controls. Tall arched radii are reserved for thresholds, selected concepts, or procession markers.
- Register lines, restrained dither, and geometric grids are the only default textures. Grain must remain below the point where it affects text contrast.

## Core component model

Implemented primitives:

- `Window`: article, atlas, media, tool, and journey container with title and provenance/status region. Managed windows support pointer dragging, minimizing, maximizing, closing, focus-layer promotion, double-click title-bar maximize, and a static mobile layout.
- `Button`: default, primary, quiet, and icon-only actions with mechanical press state.
- `Icon`: small original geometric SVG set; icons communicate actions, never transliterate Egyptian symbols.
- `EvidenceBadge`: four persistent evidence states.
- `Callout`: interpretive limits, cautions, and necessary context.

Demonstrated compositions:

- searchable concept atlas;
- concept detail with an archive trail;
- guided threshold sequence;
- interactive Nile-season lens;
- evidence key;
- palette, typography, badges, and control specimen.

Next application components should follow the same model:

- **Article shell:** breadcrumb, title, period/place, evidence summary, reading body, footnotes, sources, related concepts.
- **Search:** title and full-text matching with filters for period, place, deity, practice, corpus, and evidence status.
- **Timeline:** overlapping bands rather than a single progress arrow; dates before 664 BCE visibly marked approximate where applicable.
- **Map:** Nile-oriented by default, explicit Upper/south and Lower/north labels, accessible place list equivalent.
- **Concept graph:** keyboard-reachable nodes, textual relationship list, focus isolation, and a no-motion layout.
- **Media viewer:** object/image metadata, rights statement, date, place, material, current collection, and zoom alternative.
- **Annotation:** visually distinguishes ancient text, modern translation, archive note, and present-day editorial note.
- **Citation:** stable source ID, page when recoverable, evidence kind, OCR/pagination uncertainty.
- **Dialog/drawer:** native focus behavior, Escape dismissal, descriptive title, and no motion dependency.

## Motion

Motion has three semantic families:

- **Mechanical, 0–100ms:** button press, tab selection, window state.
- **Flowing, up to 700ms:** water level, route reveal, relationship re-layout. Use the `flow` easing token.
- **Cyclical, 12–24s:** solar or seasonal ambient motion. Never carries required information and pauses with reduced motion.

Implemented utility primitives are `archive-motion-flow`, `archive-motion-unfold`, `archive-motion-register-reveal`, `archive-motion-procession`, `archive-motion-solar`, and `archive-motion-ripple`. They are demonstrated in the live System view. Papyrus unfolding uses a short perspective-and-clip reveal; river flow animates current marks or repeating water texture; procession introduces discrete children in order; register reveal exposes a horizontal band; solar motion is slow and cyclical; ripple is reserved for water or activated-presence feedback.

Procession may be expressed as discrete movement from threshold to threshold. Excavation/revelation may uncover annotations only after the user asks. Avoid parallax, scroll hijacking, continuous camera drift, flashing, or background movement behind long-form text.

`prefers-reduced-motion` reduces every animation and transition to effectively instant. A low-performance mode should additionally remove nonessential textures and graph animation in the full application.

## Content and historical responsibility

- Never present “the consciousness of an Ancient Egyptian” as directly recoverable.
- Frame a lived-experience passage as a bounded perspective: named period, place, social position, evidence base, and missing voices.
- Distinguish what a source depicts, what scholarship infers, what the archive synthesizes, and what the application imagines.
- Do not make pharaoh and elite tomb evidence stand in for all lives. Include agricultural workers, artisans, women, children, household practice, regional institutions, and access limitations where sources allow.
- Avoid simple binaries such as desert = evil, animal cult = animal worship, or an invariant three-thousand-year pantheon.

## Accessibility and responsive behavior

- Target WCAG 2.2 AA contrast. `npm run check:contrast` verifies the core token pairs in both themes.
- Every action is keyboard reachable and has a visible focus indicator.
- Color never carries evidence or selection state alone.
- The concept web has explicit button nodes; the future graph must also expose a textual relationship list.
- The desktop rail becomes a bottom navigation below 760px. Context panels stack after primary content.
- Body copy does not shrink on mobile. Wide data should scroll within its own framed region.
- Decorative motion is removed under reduced motion. Meaningful state changes remain available as text.
- The search dialog receives initial focus and closes with Escape. A production dialog should add a complete focus trap or use the native `dialog` element.

## Static architecture and wiki integration

The specimen ships as Vite-generated static HTML, CSS, and JavaScript with relative asset paths. It requires no runtime server.

For the full wiki:

1. Read `llm-wiki/index.md` at build time.
2. Parse YAML frontmatter and Obsidian links into typed generated JSON.
3. Build one searchable document per Markdown page; preserve source IDs and source-status metadata.
4. Convert internal links to stable static routes or hashes.
5. Emit a compact search index and lazy-load article payloads.
6. Keep `llm-wiki/` authoritative; generated files are disposable build artifacts.
7. Copy only rights-cleared media into the deployed assets directory with a machine-readable rights record.

The current single-document specimen avoids route fallback problems on GitHub Pages. If path routes are later introduced, pre-render each route or provide an intentional Pages fallback.

## Extending the system

Add a semantic token only when at least two components share the role. Reuse existing primitives before adding component variants. Any new immersive pattern must document:

- the historical question it helps a user understand;
- the evidence it draws from;
- the boundary between source and reconstruction;
- its keyboard, screen-reader, reduced-motion, and low-performance equivalents;
- its static payload and licensing cost.

## Application components

The specimen's primitives (`src/design-system/index.tsx`: `Window`, `Button`, `Icon`, `EvidenceBadge`, `Callout`) are unchanged. Everything the application screens share lives in `src/design-system/components.tsx`, so each pattern keeps one keyboard behaviour, one narrow-layout treatment, and one set of accessible names.

| Component | Notes |
| --- | --- |
| `PageHeader`, `Breadcrumbs`, `Section`, `Card`, `CardGrid` | Page furniture. Every hub route is built from these. |
| `TableOfContents` | Collapsible, marks the current section with `aria-current`, and never moves the article. |
| `Backlinks`, `RelatedPages` | Grouped by relationship type. Related pages show the curated note, not a similarity score. |
| `SourceList`, `Citation` | Stable C IDs that link both ways between a page and the catalog. |
| `EvidenceCallout`, `ReconstructionBoundary` | Evidence and limits appear in the same viewport as the claim. |
| `TermDefinition` | First-use glossary definition. The definition is in the DOM and reachable by keyboard whether or not it is expanded. |
| `MediaFigure`, `VideoPlayer`, `Transcript`, `RightsCredit` | Media is addressed by manifest ID. An uncleared or unknown ID renders a visible placeholder, so a rights gap shows in the page rather than in the console. Video is click-to-load with visible controls and no autoplay. |
| `FilterBar`, `Toggle`, `Dialog`, `EmptyState` | `Dialog` traps focus, closes on Escape, and restores focus to the trigger. |
| `NeighborhoodGraph`, `GraphViewport` (in features) | Every diagram is paired with a list carrying the same relationships. |

### Rules that the tests enforce

- Page content sits on `--archive-color-surface`. Muted text does not reach 4.5:1 against `--archive-color-ground`, so nothing readable should be placed directly on the desktop ground.
- An SVG that contains focusable elements uses `role="group"`, not `role="img"`, and the interactive element is the shape itself rather than a wrapping `<g>` — otherwise its hit area includes the label and a click can miss.
- Entrance animations move things; they do not fade text in. A fading element is briefly below contrast, and an accessibility scan will catch it.
- `data-motion="reduce"` on the root element disables animation globally. Components that animate also accept the reduced state directly, so nothing depends on the cascade alone.
- Print removes the shell, tabs, table of contents, controls, and diagrams, and expands link URLs after each link.
