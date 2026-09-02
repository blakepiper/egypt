# Current implementation status

Status: current release record

Updated: 2026-09-02

This is the current release record for The Living Archive. Prose lives in `llm-wiki/`; reviewed structured data lives in `content/`; generated application data is disposable. For the documentation map, see [the project documentation index](../README.md).

## Delivered inventory

- 81 reviewed publishable pages, including all 28 distinct N01–N28 articles and eleven supplemental pages in three new content clusters.
- 170 source records: 36 course groups covering 72 immutable `raw/` files, plus 134 opened supplemental research records (R001–R134).
- 109 static route entry points, with direct reload support, `404.html`, `.nojekyll`, and a no-JavaScript transcript fallback for J01.
- 18 learning paths: the original eight course paths and ten expanded paths, including writing transmission and Egypt in Abrahamic traditions.
- Seven journeys, including J01, “Sailing south: Esna to Aswan,” with 12 ordered stages, scene reading, reflections, sources, article links, and a complete transcript.
- 28 public place records; J01's route sketch displays only its eight verified public stops. Private households and the unidentified Nubian community are not records or pins.
- 203 glossary terms, 408 graph nodes, 2,761 typed graph edges, and 10 cleared media records.
- 88 searchable destinations: the 81 reviewed pages plus seven structured journeys. The bounded-excerpt index contains 7,742 terms and is 287,222 bytes gzip-compressed.

## N01–N28 articles

The planned articles are separate pages with normative slugs and contextual links:

1. `studying-religion-through-egypt`
2. `predynastic-egypt-and-state-formation`
3. `egypt-and-mesopotamia-compared`
4. `ritual-uncertainty-and-continuity`
5. `permanence-renewal-and-impermanence`
6. `egypt-and-early-buddhism`
7. `households-work-and-unequal-access`
8. `writing-knowledge-and-administration`
9. `egypt-and-its-neighbors`
10. `legacy-of-ancient-egypt`
11. `egyptian-religion-in-greek-and-roman-worlds`
12. `egypt-after-the-pharaohs`
13. `egyptology-museums-and-colonialism`
14. `egyptomania-and-popular-culture`
15. `egypt-africa-and-modern-identity`
16. `suffering-misfortune-and-divine-justice`
17. `illness-healing-and-protection`
18. `animals-gods-and-nonhuman-agency`
19. `monuments-labor-and-building-eternity`
20. `egypt-in-biblical-and-christian-memory`
21. `nile-travel-dahabiyas-and-changing-river`
22. `esna-khnum-temple-and-layered-town`
23. `el-kab-nekheb-city-and-provincial-memory`
24. `edfu-temple-town-and-sacred-history`
25. `gebel-el-silsila-quarrying-sacred-landscape`
26. `kom-ombo-sobek-harwer-and-crocodiles`
27. `living-nile-communities-work-food-and-hospitality`
28. `nubia-kush-displacement-and-living-identity`

## New content clusters

- Early formation: `naqada-hierakonpolis-and-early-centers`, `abydos-umm-el-qaab-and-the-first-writing`, `narmer-and-the-making-of-unification`, and `desert-routes-rock-art-and-early-mobility`.
- Writing transmission: `uniliteral-signs-and-egyptian-phonetic-writing`, `proto-sinaitic-and-the-alphabetic-breakthrough`, and `from-canaan-to-phoenician-greek-and-latin`, including the generated alphabet table view.
- Abrahamic traditions: `egyptian-wisdom-and-biblical-literature`, `elephantine-judaeans-and-egyptian-religious-life`, `egypt-in-quranic-and-islamic-tradition`, and `judgment-the-weighed-heart-and-later-afterlives`.

The existing entry pages were revised to connect chronology, state formation, ritual and uncertainty, suffering and healing, material and nonhuman agency, reception, colonial collecting, and the Esna–Aswan reading route. The new pages add early centers and state formation, the phonetic-to-alphabetic transmission problem, and documented and remembered relationships between Egypt and Abrahamic traditions. The index, browse hubs, glossary, source ledgers, graph, search ranking, and route navigation were expanded with them.

## Provenance and safeguards

Page, journey, path, entity, place, object, source, search, and graph records carry typed origin metadata independently of evidentiary strength. Course material remains distinguishable from supplemental research. Source routes expose purpose, access, limitations, and reuse conditions; R069 is published in `public/sources/`, with its recorded SHA-256 verified and its repository link shown in the catalog.

The content checker rejects broken links, unknown source and media IDs, invalid review states, orphan pages, route collisions, private-source leaks, private or unverified place pins, incomplete J01 stages, and missing article link requirements. The editorial review includes the humanizer pass, factual comparison, uncertainty language, historical-period qualifications, clinical safeguards, community-consent boundaries, and separate human-remains dignity review.

## Product and accessibility work

The application now has provenance-aware browse and source catalogs, source-origin filters, expanded search intent and type/tag filters, related-content panels, route-aware navigation, article and source fragment focus, typed reception and encounter graph relationships, and data-driven counts. Search keeps the empty state compact, ranks titles, aliases, headings, body text, tags, and source IDs, tolerates bounded misspellings, produces query-relevant excerpts, and preserves query and filter state in the URL. The graph opens on 224 curated nodes and 527 curated relationships; its all-document layer shows 90 nodes and 870 relationships, while a keyboard-operable disclosure retains the complete filtered relationship list. J01 has keyboard-operable roving tabs, live stage status, reduced-motion behavior, responsive route/list parity, and a static transcript. The alphabet lineage view retains the article's sign table as its canonical data source, and visualizations retain textual lists, tables, or descriptions.

The expanded interface was checked in daylight and Duat themes, desktop and mobile viewports, direct route reloads, arbitrary base paths, print styles, reduced motion, keyboard navigation, image requests, bundle budgets, and automated WCAG scans. Long source titles and identifiers wrap within narrow layouts.

## Release follow-ups

The expansion release has no content-check warnings. Deity records are anchored to the field guide, the Sobek deity/article relationship is explicit, legacy journeys have semantic anchors, and the object graph kind now has object records. The search index uses a 2,400-character per-page article excerpt (with a finite catalog cap for source-ID lookup) and remains below its 500 KB gzip budget at 287,222 bytes; no budget increase was needed.

## Release checks

The following checks passed on the final source state:

- `npm run content:check` — 81 pages, 109 routes, 10 media records; 0 errors and 0 warnings.
- `npm run review:check` — reviewed-copy hash current.
- `npm run media:check` — all 10 media records cleared and deployed derivatives valid.
- `npm run typecheck` — TypeScript application and Node checks passed.
- `npm run test:unit` — 48 tests passed.
- `npm run build` — content build, Vite build, 109 route artifacts, `404.html`, and `.nojekyll` passed.
- `npm run test:e2e` — 178 tests passed and 18 were intentionally skipped across desktop and mobile projects.
- `npm run check:contrast` — contrast audit passed.
- `npm run check` — complete release check passed.
- `npm run test:visual` — daylight, Duat, and mobile visual baselines passed after manual inspection.
- `git diff --check` — no whitespace errors.

`raw/` was not modified, and no CI workflow was added or restored. Generated
artifacts remain disposable. The repository is maintained directly on `main`.
