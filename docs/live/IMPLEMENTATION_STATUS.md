# Expanded wiki implementation status

Updated: 2026-08-31

This is the release record for the expanded Egypt wiki. Prose lives in `llm-wiki/`; reviewed structured data lives in `content/`; generated application data is disposable.

## Delivered inventory

- 70 reviewed publishable pages, including all 28 distinct N01–N28 articles.
- 139 source records: 36 course groups covering 72 immutable `raw/` files, plus 103 opened supplemental research records (R001–R103).
- 97 static route entry points, with direct reload support, `404.html`, `.nojekyll`, and a no-JavaScript transcript fallback for J01.
- 16 learning paths: the original eight course paths and eight expanded paths, including the cruise-preparation path.
- Seven journeys, including J01, “Sailing south: Esna to Aswan,” with 12 ordered stages, scene reading, reflections, sources, article links, and a complete transcript.
- 24 public place records; J01's route sketch displays only its eight verified public stops. Private households and the unidentified Nubian community are not records or pins.
- 183 glossary terms, 346 graph nodes, 2,295 typed graph edges, and 10 cleared media records.

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

The existing entry pages were revised to connect chronology, state formation, ritual and uncertainty, suffering and healing, material and nonhuman agency, reception, colonial collecting, and the Esna–Aswan reading route. The index, browse hubs, glossary, source ledgers, graph, search ranking, and route navigation were expanded with them.

## Provenance and safeguards

Page, journey, path, entity, place, object, source, search, and graph records carry typed origin metadata independently of evidentiary strength. Course material remains distinguishable from supplemental research. Source routes expose purpose, access, limitations, and reuse conditions; R069 is catalog-only, with its recorded SHA-256 verified and no public URL, filesystem locator, or download link.

The content checker rejects broken links, unknown source and media IDs, invalid review states, orphan pages, route collisions, private-source leaks, private or unverified place pins, incomplete J01 stages, and missing article link requirements. The editorial review includes the humanizer pass, factual comparison, uncertainty language, historical-period qualifications, clinical safeguards, community-consent boundaries, and separate human-remains dignity review.

## Product and accessibility work

The application now has provenance-aware browse and source catalogs, source-origin filters, expanded search intent and type/tag filters, related-content panels, route-aware navigation, article and source fragment focus, typed reception and encounter graph relationships, and data-driven counts. The graph canvas emphasizes direct links around a selected node while a keyboard-operable disclosure retains the complete filtered relationship list. J01 has keyboard-operable roving tabs, live stage status, reduced-motion behavior, responsive route/list parity, and a static transcript. Visualizations retain textual lists, tables, or descriptions.

The expanded interface was checked in daylight and Duat themes, desktop and mobile viewports, direct route reloads, arbitrary base paths, print styles, reduced motion, keyboard navigation, image requests, bundle budgets, and automated WCAG scans. Long source titles and identifiers wrap within narrow layouts.

## Release checks

The following checks passed on the final source state:

- `npm run content:check` — 70 pages, 97 routes, 10 media records; 0 errors and 0 warnings.
- `npm run review:check` — reviewed-copy hash current.
- `npm run media:check` — all 10 media records cleared and deployed derivatives valid.
- `npm run typecheck` — TypeScript application and Node checks passed.
- `npm run test:unit` — 41 tests passed.
- `npm run build` — content build, Vite build, 97 route artifacts, `404.html`, and `.nojekyll` passed.
- `npx playwright test tests/application.spec.ts` — 112 tests passed across desktop and mobile.
- `npm run check:contrast` — contrast audit passed.
- `npm run check` — complete release check passed.
- `npm run test:visual` — daylight, Duat, and mobile visual baselines passed after manual inspection.
- `git diff --check` — no whitespace errors.

`raw/` was not modified. No CI workflow was added or restored. Pre-existing worktree changes were retained and extended only where the requested product overlapped them. The repository remains on `main`; local commits were created without pushing.
