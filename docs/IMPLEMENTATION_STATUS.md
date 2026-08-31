# Implementation status

Last updated: 2026-08-30. Read alongside `APPLICATION_IMPLEMENTATION_PLAN.md`, which this file tracks.

## Where the work stands

The application implementation is complete. All implementation phases in the plan are represented in the production application, including the media library, the Plate 30 deep-zoom study, prose-review gates, visual baselines, and browser performance budgets.

Two release approvals still require a person rather than code: a human editor must read the six guided narrations, and someone must do a short pass in VoiceOver or NVDA. Those checks are recorded as pending below; they do not conceal unfinished application features.

### Current release inventory

| Area | State |
| --- | --- |
| Content compiler | Complete. All 41 Markdown pages compile, with 27,937 words, zero lint errors, and 67 generated application routes. |
| Encyclopedia | Complete: headings, tables, citations, source sections, section permalinks, backlinks, graph neighbours, previous/next links, print styles, and durable URLs. |
| Search and browse | Complete. Search covers titles, aliases, source IDs, headings, summaries, tags, body text, glossary terms, periods, and places. |
| Knowledge graph | Complete. 208 nodes and 653 edges, with deterministic layout, typed curated relationships, filters, shareable state, and list parity. |
| Atlas and chronology | Complete. Twenty places and nineteen chronology bands, with equivalent text or tables and explicit approximate-date treatment. |
| Journeys and interactive views | Complete. Six guided journeys plus the personhood, creation-tradition, and funerary-corpus views. Evidence boundaries and complete text equivalents remain in the same view. |
| Objects and texts | Complete. Plate 30 now uses the British Museum image, keyboard-operable zoom and pan, tiled detail levels, image-grounded hotspots, source credit, and a text-only distinction for details not visible in frame 30. The visual decoder is also complete. |
| Media library | Complete for the release. Nine cleared records cover eight historical images and the original application icon. Ninety deployed media files include responsive AVIF/WebP/JPEG variants, placeholders, and Plate 30 tiles. |
| Review gates | Complete for machine-verifiable review. All 41 wiki pages carry factual, humanizer, and media-rights review metadata. Application copy is protected by a SHA-256 review hash. Guided narration retains an honest `editorial: pending-human` marker. |
| Accessibility | Keyboard, reduced motion, muted-by-default audio, narrow layouts, print, semantic names, diagram/list parity, contrast, and automated WCAG scans are covered. A manual VoiceOver/NVDA spot check remains. |
| Performance and visual regression | Bundle, article-data, image, media-request, route-load, heap, layout-shift, graph-response, and 200 ms long-task budgets are enforced. Ten cross-platform screenshot baselines cover the core article, atlas, graph, journey, and object routes in daylight and Duat. |
| Deployment and privacy | Complete. Direct route reloads and arbitrary Pages base paths are tested. The application has no server, account, tracker, analytics, remote font, or automatic third-party embed request. |

## Media and rights implementation

`content/media-manifest.json` is the publication ledger. Every cleared raster record includes its holding institution, object identifier, exact license, attribution, source record, access date, caption, alternative text, dimensions, responsive variants, and review state. The British Museum derivative retains its CC BY-NC-SA 4.0 notice; Metropolitan Museum images carry the Met Open Access/CC0 designation. The browser icon is an original code-native SVG, not the earlier provisional derivative.

`npm run media:build` downloads the declared institutional masters into ignored `.cache/media/` storage, then recreates the deployed derivatives. Plate 30 receives a 512-pixel tiled pyramid. `npm run media:check` rejects missing metadata, undeclared files, uncleared files, missing variants or tiles, and images over the 250 KB per-file budget.

The eight historical images are placed where they support an argument rather than as decoration: Start Here and the visual decoder, sacred geography and the field guide, Maat and kingship, the Osiris cycle, Sobek, temples, the funerary-text tradition, the Book of the Dead, and Plate 30.

## Prose and historical review

The `/humanizer` pass covered the wiki and application copy without rewriting quotations, ancient terms, titles, source IDs, citations, dates, or uncertainty labels. The comparison also caught and corrected two substantive issues: the Deir el-Medina schedule is now described as eight working days in a ten-day cycle, not an eight-day week; and the Plate 30 annotations no longer identify a seated Osiris or place Ani and a gate inside a crop where they are not visible.

Review state is enforced in three places:

- Wiki frontmatter records factual, humanizer, and media-rights review for all 41 published pages.
- Journey, object, and media JSON records carry the same machine-checked fields.
- `content/copy-review.json` hashes the user-facing source files, so changing copy invalidates `npm run review:check` until the factual and humanizer comparison is repeated.

## Remaining release signoffs

These are the only open release checks:

1. A human editor should read all six journey narrations, especially `lived-perspectives.json`, and change `editorial: pending-human` only after approving their historical framing and tone.
2. Test one representative article, search, the graph list, a journey, and Plate 30 with VoiceOver or NVDA. Confirm landmark navigation, control names, reading order, live zoom status, and hotspot/list parity.
3. If tourism logistics are added, research and date them at release time. They remain deliberately excluded because they are live operational information rather than archive content.

Optional hover previews, free-floating multiwindow article mode, audio, and video are not release gaps. Hover previews are optional in the plan; article tabs are the approved desktop choice; and no audio or video is published. Their shared components remain available for future cleared media.

## Conventions worth preserving

- `raw/` is immutable. References to it render as filenames, never public links.
- `llm-wiki/` is the source of truth for prose. `src/generated/` is disposable build output.
- Views derived from wiki tables must remain derived rather than gaining a second hand-maintained copy.
- Curated graph edges use the closed vocabulary in `scripts/content/build-graph.ts` and include a note explaining the connection.
- Every diagram keeps an equivalent list or table.
- Content sits on `--archive-color-surface`; muted text does not meet the contrast target against the desktop ground.
- Playwright tests use relative routes so the same suite runs at `/` and an arbitrary GitHub Pages base path.

## Acceptance checklist

- [x] 41 content documents are published and reachable
- [x] Wiki links, heading links, source IDs, media IDs, and route collisions pass lint
- [x] Evidence status, uncertainty, dates, and historical scope survive the build
- [x] User-facing prose has passed factual comparison and `/humanizer`
- [x] Articles, search, browse, graph, atlas, chronology, journeys, objects, Learn, and Archive meet the planned feature set
- [x] Direct URLs reload under an arbitrary base path
- [x] Maps, timelines, graphs, diagrams, and deep zoom have accessible text or list parity
- [x] Every deployed asset is declared and cleared in the media manifest
- [x] Every deployed image has a caption, credit, rights record, and alternative text
- [x] No audio or video is deployed; future media remains gated on controls, captions/transcripts, posters, and rights metadata
- [x] Generated or schematic art is identified and is never presented as historical evidence
- [x] Keyboard, reduced motion, muted audio, mobile, print, low-performance, contrast, and automated accessibility modes pass
- [ ] Manual VoiceOver or NVDA spot check
- [x] Bundle, route-data, image, route-load, memory, layout-shift, graph-response, and long-task budgets pass
- [x] TypeScript, content lint, rights lint, review hash, unit, browser, accessibility, visual, and deployment checks pass
- [x] Daylight and Duat visual-regression baselines exist for the core screens
- [x] Production dependency audit reports no known high-severity vulnerability
- [ ] Human editorial signoff on all six guided narrations
