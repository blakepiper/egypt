# Implementation status

Last updated: 2026-08-30. Read alongside `APPLICATION_IMPLEMENTATION_PLAN.md`, which this file tracks section by section.

## Where the work stands

Phases 0 through 4 of the plan are complete. Phase 6 is complete except for the media-dependent parts of the Plate 30 viewer. Phase 7 is complete as written text and steppers. Phase 8 is complete. Phase 5 — the media library — is the one substantial phase that has not been started, and it is the reason several plan items below are still open.

The application builds, lints, typechecks, and passes 32 unit tests and 99 browser tests, including accessibility scans on thirteen routes plus the graph, at both `/` and a GitHub Pages project base path.

### What exists now

| Area | State |
| --- | --- |
| Content compiler | Complete. 41 pages, 27,950 words, zero link or anchor errors. |
| Content lint (`content:check`) | Complete. Pages, links, anchors, routes, sources, media, aliases, and BCE/CE formatting. |
| Static routes | 67 generated HTML entry points, plus `404.html` and `.nojekyll`. |
| Encyclopedia | Complete: breadcrumbs, table of contents, section permalinks, tables, sources, backlinks, related pages, previous/next, print styles, Markdown source link. |
| Search | Complete. 4,337 indexed terms, ranked title → alias → source ID → heading → summary → tag → body, with section, evidence, period, and place filters. |
| Knowledge graph | Complete. 208 nodes and 653 edges: 265 wiki links, 165 citations, and 223 curated typed relationships. Deterministic build-time layout, filters, two-hop expansion, pinning, path history, shareable URL state, and a full accessible list. |
| Atlas | Complete. Schematic Nile map, 20 places, region filter, orientation corrections, list parity. |
| Chronology | Complete. Three layers, 19 bands, approximate dates marked in both the diagram and the table. |
| Journeys | Six guided experiences, each with an evidence boundary, a reconstruction panel, sources, and a full text transcript. |
| Interactive views | Personhood constellation, creation-tradition comparison, funerary corpus river. All generated from the wiki's own tables. |
| Objects and texts | Plate 30 study with region annotations that separate what is visible from how it is read, plus the visual decoder. |
| Learn | Four-week plan checklist with local progress, exam prompts with reveal, course pages. |
| Archive | Source catalog with status filters and two-way citation links, plus the audit and log pages. |
| Preferences | Theme, motion, sound, low-performance mode, bookmarks, recents, tabs, journey and plan progress. All local, all clearable in one action. |
| Design system | Extended with 25 shared components; the original specimen is preserved at `/specimen/`. |

## Open work, in the order it should be picked up

### 1. Media library (plan §10, Phase 5) — not started

This is the largest remaining piece and it blocks several acceptance items.

The plumbing is finished: `content/media-manifest.json`, the `MediaRecord` schema, `npm run media:check`, the `MediaFigure` / `VideoPlayer` / `Transcript` / `RightsCredit` components, `!media[<id>]` syntax in Markdown, and a build that refuses any ID that is missing or not `cleared`. What is missing is the media itself.

What to do:

1. Work through the coverage target in plan §10: one lead image per major encyclopedia hub, object images for the text-study pages, site and map imagery for the atlas and field guide, and comparison images where the evidence supports them.
2. For each candidate, open the holding institution's current object record and record creator, institution, object ID, exact license, and date accessed. Do not infer public-domain status from a filename or a search thumbnail.
3. Add the record to `content/media-manifest.json` with `status: "requested"` first, then `"cleared"` once the rights are confirmed and the file is in `public/media/`.
4. Reference it from Markdown as `!media[<id>]` on its own line, or from a component by ID.
5. Add responsive variants and deep-zoom tiles. Nothing in the build does this yet; a processing step in `scripts/media/` is the natural place.

The one existing record, `stela-app-icon`, is deliberately `research-only`. It is used as the browser icon and nowhere in content. Its derivative-use status is unreviewed — see `REFERENCE_ASSETS.md`.

### 2. Plate 30 deep zoom (plan §9) — blocked on the above

`/objects/plate-30/` currently runs on a schematic diagram, with the rights position stated in the same view. When an authoritative open-access reproduction is cleared, set `mediaId` in `content/objects/plate-30.json`; the component already prefers a `MediaFigure` when one is present. Deep-zoom tiling still needs building.

### 3. Humanizer review (plan §5) — not run

No user-facing copy has been through `/humanizer`. The text that needs it, in rough order of exposure: the six journey scripts in `content/journeys/`, the Plate 30 annotations, the interactive-view leads, the hub blurbs in `scripts/content/lib/site.ts` and `src/features/`, the about page, and the empty states. Follow the plan's order: check the facts first, run the skill, compare against the reviewed draft, and only then record `review.humanizer: reviewed`. The frontmatter `review` field is already in the schema and parsed; nothing sets it yet.

### 4. Lived perspectives (plan §9) — partially done, needs subject-matter review

`content/journeys/lived-perspectives.json` describes four documented roles in close third person, names its evidence, and lists what is not preserved. It has not had the historical review the plan requires before a page like this is called finished.

### 5. Structured frontmatter for the remaining pages (plan §5)

29 of 41 pages have reviewed `aliases`, `periods`, `places`, `entities`, and `relations`. The 12 without them are the archive-control and course pages, where the fields would add little. Adding them is a matter of editing `content/frontmatter-review.json` and re-running `node scripts/content/tools/apply-frontmatter.mjs`. No page has a hand-written `summary` yet; all summaries are derived from the first substantive paragraph, which reads well but has not been reviewed as preview copy.

### 6. Smaller gaps

- **Screen-reader spot checks.** Axe passes on thirteen routes and the keyboard paths are tested, but nobody has driven the site with VoiceOver or NVDA.
- **Visual regression baselines.** Plan §13 asks for screenshot baselines in both themes. Not set up.
- **Long-task profiling.** The 200 ms budget in plan §12 is not measured; bundle and payload budgets are (`tests/unit/budgets.test.ts`).
- **Hover previews** on pointer devices (plan §7) are not implemented. They are explicitly optional.
- **Free-floating article windows.** The desktop metaphor is implemented as tabs plus "Reset desktop", which is decision 3 in plan §15. Draggable managed windows still exist in the design system and in the specimen route.
- **`Citation` and `VideoPlayer`** exist in the design system and are documented, but nothing uses them yet: source IDs are turned into catalog links by the parser, and no video is cleared. Both are on the plan's required component list, so they are kept rather than deleted.
- **Audio.** No audio anywhere. The preference toggle exists and defaults to off.
- **Tourism logistics** (plan §15, item 10) remain excluded and date-stamped as a release-time task.

## Conventions worth knowing before editing

- **`raw/` is immutable.** References to it render as filenames, never links. `llm-wiki/` is the source of truth for prose.
- **`src/generated/` is disposable** and git-ignored. Never edit it; change the compiler or the Markdown.
- **Views are generated from wiki tables** wherever possible — deities, the decoder, personhood, corpora, creation traditions, the four-week plan, exam prompts, and the glossary. If a view looks wrong, fix the table in `llm-wiki/`.
- **Edge types are a closed vocabulary** (`scripts/content/build-graph.ts`). A curated edge should carry a `note` saying why the two things are connected; an ordinary wiki link is only ever `links_to`.
- **Glossary definitions are attached at build time**, not during rendering, because "first use" depends on document order.
- **Every diagram has a list or table with the same content.** That is a release condition, not a nicety; keep it true when adding a view.
- **Contrast:** page content sits on `--archive-color-surface`, not on `--archive-color-ground`. Muted text fails 4.5:1 against the ground colour.
- **Tests:** `*.spec.ts` is Playwright, `tests/unit/*.test.ts` is Vitest. Browser tests navigate with relative paths so they work under any base path.

## Acceptance checklist status

From plan §17. Unchecked items are the open work above.

- [x] 41 content documents published and reachable
- [x] Zero broken wiki links, heading links, source IDs, or media IDs
- [x] Evidence status and uncertainty survive the build
- [ ] User-facing prose has passed `/humanizer` and factual comparison
- [x] Articles support tables, citations, sources, backlinks, related pages, print, and stable section links
- [x] Search and browse cover the full corpus
- [x] Direct article URLs reload at an arbitrary base path
- [x] The graph and article neighbourhoods use reviewed relationships
- [x] Maps, timelines, graphs, and diagrams have equivalent text or tables
- [x] All listed core visualizations are complete
- [x] All six guided experiences are complete
- [x] Lived perspectives show their reconstruction method and limits
- [ ] Every deployed asset is cleared in the media manifest — no assets are deployed yet
- [ ] Images have captions, credits, rights, and alternative text — no images yet
- [ ] Video and audio have controls, captions, posters, and labels — none yet
- [x] Generated art is identified as interpretive and never presented as evidence
- [x] Keyboard, reduced motion, muted, mobile, and print modes work
- [ ] Screen-reader spot checks
- [x] Contrast, bundle, and route-data budgets pass
- [x] TypeScript, content lint, unit, browser, accessibility, and deployment tests pass
- [ ] Visual regression baselines
- [x] `npm audit` reports no known vulnerabilities
