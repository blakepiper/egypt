# The Living Archive

<p align="center">
  <img src="public/media/archive-app-icon.png" alt="The Living Archive logo" width="128" />
</p>

A static application for learning about ancient Egyptian religion and its afterlives. It publishes 70 reviewed Markdown pages in `llm-wiki/` as a linked encyclopedia with provenance-aware search, a typed knowledge graph, a sacred atlas, a layered chronology, eight learning paths, seven guided journeys, object studies, and accessible visualizations.

Everything is compiled at build time. There is no server, database, account, paid API, remote font, analytics, or tracker. Reader preferences stay in `localStorage`.

## Run it

```sh
npm install
npm run dev          # builds generated content, then starts Vite
```

Local checks:

```sh
npm run content:check   # content lint: pages, links, anchors, routes, sources, media, dates
npm run media:build     # rebuild responsive images and Plate 30 deep-zoom tiles
npm run media:check     # media rights gate
npm run review:check    # factual/humanizer review hash gate
npm run typecheck
npm run check:contrast
npm run test:unit       # content pipeline, search ranking, graph, budgets
npm run build           # content -> types -> Vite -> static route entry points
npm run test:e2e        # interaction, accessibility, performance, visual, deployment
npm run test:visual     # daylight, Duat, and mobile screenshot baselines
npm run check           # all of the above
```

## Deployment

The build emits one real HTML entry point per route, so a direct reload works on GitHub Pages without rewrite rules. `dist/404.html` and `dist/.nojekyll` are written too.

```sh
BASE_PATH=/your-repository/ REPOSITORY_URL=https://github.com/you/your-repository npm run build
```

`BASE_PATH` sets Vite's base, and every asset URL, internal link, and generated entry point follows it. `REPOSITORY_URL` is optional; when set, each article shows a link to its Markdown source. Build and publish `dist/` manually when deploying. The build also emits 97 static route entry points, a `404.html`, and `.nojekyll`.

## Structure

```text
llm-wiki/                     source of truth for all written content
raw/                          immutable source files; never published
content/                      reviewed data that is not prose
  entities/                   concepts, personhood, practices, texts, roles, deities
  journeys/                   guided experience scripts
  objects/                    object-study annotations
  paths/                      knowledge paths through the graph
  periods.json, places.json   chronology and atlas registries
  media-manifest.json         every asset, with its rights status
  frontmatter-review.json     reviewed structured fields applied to wiki pages
  prose-review.json           factual, humanizer, and media review of wiki prose
  copy-review.json            review state tied to exact application-copy bytes
scripts/
  content/                    the compiler, linter, graph, search, and route builders
  media/build-media.ts        responsive image and deep-zoom processor
  media/check-rights.ts       rights and deployed-file gate for the media manifest
src/
  types/content.ts            the shared content model
  app/                        routing, state, shell, section labels
  design-system/              tokens, primitives, and shared components
  features/                   one directory per screen area
  generated/                  build output; git-ignored and disposable
tests/
  unit/                       content pipeline, search, graph, budgets
  *.spec.ts                   browser, accessibility, and deployment tests
docs/                         plan, design system, status, and rights records
```

## How content becomes an application

`scripts/content/build-content.ts` reads the Markdown once and emits `src/generated/`. The current build contains 139 source records: 36 course groups covering 72 immutable raw files and 103 supplemental research records. The private R069 itinerary is catalogued without a public URL or filesystem locator.

| File | What it holds |
| --- | --- |
| `content-manifest.json` | every page with its route, type, tags, evidence label, and reading time |
| `articles/<slug>.json` | one lazily loaded payload per page: content tree, table of contents, sources, backlinks, related pages, local graph |
| `search-index.json` | a compact inverted index, loaded only when search opens |
| `graph.json` | nodes, typed edges, and deterministic layout coordinates |
| `entities.json`, `periods.json`, `places.json`, `sources.json` | the registries behind the atlas, chronology, graph, and catalog |
| `visualizations.json`, `decoder.json`, `glossary.json` | interactive views derived from the wiki's own tables |

Several features are generated from tables inside the wiki rather than authored twice: the deity registry, the visual decoder, the personhood constellation, the funerary corpus comparison, the creation-tradition comparison, the four-week plan checklist, the concept checks, and the glossary. A view therefore cannot drift away from the article behind it.

The build fails on a broken wiki link, a duplicate heading ID, an unknown source ID, an unknown media ID, raw HTML, an unknown callout or relation type, an orphan page, a route collision, an invalid review state, or a private-source/private-place leak. It also validates J01's twelve-stage transcript and the no-JavaScript route artifacts.

## Editing content

- Prose belongs in `llm-wiki/`. `raw/` is immutable.
- Structured frontmatter is applied from `content/frontmatter-review.json` with `node scripts/content/tools/apply-frontmatter.mjs`. It is idempotent.
- Curated relationships use the published edge vocabulary and carry a note explaining the connection. An ordinary wiki link never implies a typed relationship.
- Media is addressed by manifest ID. Only `cleared` records enter a production build; anything else renders a visible placeholder rather than a broken image.
- Cleared raster masters are cached outside version control. `npm run media:build` recreates the committed AVIF, WebP, JPEG, placeholder, and deep-zoom derivatives from their institutional source URLs.
- User-facing source changes invalidate `content/copy-review.json`; run the factual comparison and humanizer review again before updating its hash.
- `research-catalog.md` is the public route for supplemental sources. Course records remain in `source-catalog.md`; the two ledgers keep provenance and access boundaries visible.
- `journeys/esna-to-aswan-dahabiya.json` is a modern, itinerary-bounded reading journey. Its transcript is complete without JavaScript, while only verified public places appear on its route sketch. Private households and the unnamed Nubian community are intentionally not pinned or identified.

## What is deliberately not here

No accounts, comments, CMS, chatbot, live external data, commercial map service, social feeds, autoplay, or VR. See `docs/obe/APPLICATION_IMPLEMENTATION_PLAN.md` §16, and `docs/live/IMPLEMENTATION_STATUS.md` for what is finished and what is not.
