---
type: log
tags: [maintenance, provenance]
course: REL 395, Spring 2017, Northern Arizona University
origin: course
evidence: archive
updated: 2026-09-02
review:
  factual: reviewed
  humanizer: reviewed
  media_rights: reviewed
  editorial: reviewed
---

# Wiki log

## [2026-08-30] ingest | Source archive

Inventoried 72 substantive files in the source folder and associated Drive export; extracted text from office documents and text PDFs; OCRed scan-only readings; visually inspected the seven standalone images; grouped revisions and format variants; created the initial archive across concepts, deities, texts, practices, travel, research, and provenance. No raw source was modified.

## [2026-08-30] lint | Initial build

Checked raw-file coverage, wikilinks, required frontmatter, speculative-claim labels, and index membership. See [[coverage-map]] for the file-level audit.

## [2026-08-30] maintenance | Consolidated raw sources

Moved the contents of the original source folder and Drive export into a single `../raw/` collection, removed the two empty source directories, and updated all catalog and schema paths. The 72 substantive files and their internal subject folders were preserved.

## [2026-08-30] ingest | Full mandatory-material second pass

Reviewed the source record, annotated prompt sets, research reports and drafts, surviving packets, and visual plates in full or by complete version comparison. Read the complete contents and selected sections of Pinch and Teeter; sampled the other long reference books by contents and relevant chapters. Added [[reading-audit]], [[course-reading-guide]], [[course-materials-deep-notes]], and [[student-work-reconstruction]]; expanded the core topic pages with previously omitted distinctions and explicit corrections.

## [2026-08-30] ingest | Current-source verification

Checked UCL funerary-corpus guidance, British Museum object records, Metropolitan Museum ritual/Amduat material, Cambridge's Teeter contents, and the 2024 residue study of a Ptolemaic Bes vessel. Added [[web-research-supplement]] and updated the Book of the Dead, temple, Set, Amduat, and blue-water-lily syntheses without projecting a single late residue result across all Egyptian history.

## [2026-08-30] lint | Archive rebuild

Verified 72 catalog links against 72 substantive raw files, all internal page and heading links, index membership, content-page frontmatter, and orphan status. The rebuilt wiki contains 41 maintained Markdown pages (excluding its schema) and roughly 31,500 words. No raw source was changed.

## [2026-08-31] release | Expanded research wiki

Published 70 reviewed pages, including distinct N01–N28 articles; added 103 opened supplemental research records to the 36 course groups; and rebuilt the generated manifest, search index, graph, routes, atlas, glossary, paths, and journey data. The release contains 97 static route artifacts, 16 learning paths, seven journeys, 24 public place records, 183 glossary terms, 346 graph nodes, 2,295 graph edges, and 10 cleared media records. J01 has twelve transcript stages and maps only verified public stops. R069 remains catalog-only, its checksum is verified, and no raw source changed. Content, rights, review, type, contrast, unit, build, artifact, browser, and visual checks were run before the release commit.

## [2026-09-02] ingest | State formation, alphabetic writing, and Abrahamic traditions

Opened and catalogued the new archaeological, epigraphic, museum, papyrus, Qur'anic, and early Islamic source records R104–R134. Added eleven pages in three linked clusters, with site, corpus, reception, influence, and transmission claims kept at their stated evidence levels. No raw source or new media record was added.

## [2026-09-02] release | Three new content clusters

Released 81 reviewed pages, 170 source records, 109 static route artifacts, 18 learning paths, 28 public places, 203 glossary terms, 408 graph nodes, 2,761 typed graph edges, 88 searchable destinations, and 10 cleared media records. The release includes the generated alphabet view and the bounded search-index excerpts; `npm run check` and the visual baseline suite passed. No raw source or CI workflow changed, and R069 remains catalog-only.

## [2026-09-02] publish | Public itinerary

Published the R069 itinerary at `public/sources/dahabiya-nile-sailing-5-day-itinerary.pdf`. Updated the source catalog, journey boundary, compiler, and release checks so a clean clone no longer needs the ignored `raw/` directory for this source. The checksum remains enforced.
