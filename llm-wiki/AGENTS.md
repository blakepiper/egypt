# Ancient Egyptian Religion Wiki Schema

This directory is an LLM-maintained, Obsidian-compatible wiki reconstructed from Blake Piper's Spring 2017 NAU course materials.

## Boundaries

- Treat `../raw/` as the immutable raw-source collection. Never edit, rename, or reorganize its contents without an explicit user request.
- The LLM may create and maintain files only in this `llm-wiki/` directory unless the user explicitly requests otherwise.
- Read `index.md` first. Use `source-catalog.md` to resolve provenance before making factual changes.

## Page conventions

- Use lowercase kebab-case filenames and Obsidian-style internal links.
- Begin content pages with YAML frontmatter containing `type`, `tags`, `course`, and `updated`.
- Distinguish four kinds of evidence in prose:
  - **Primary source:** translated ancient text or ancient image/object.
  - **Course synthesis:** syllabus, exams, reports, slides, or course handout.
  - **Scholarship:** modern scholarly books/articles.
  - **Contested/speculative:** interpretation that is not established by the corpus.
- Do not silently convert a student answer or hypothesis into scholarly consensus.
- End substantive pages with `## Sources in this archive` and link the relevant catalog section or raw files.
- Prefer concise synthesis over copied passages. Quotes should be short and necessary.

## Source IDs and citations

- `source-catalog.md` assigns stable group IDs (`C01`, `C02`, etc.) to intellectual works and records every physical file.
- Cite an archive source as `[[source-catalog#C01 — REL 395 syllabus|C01]]`.
- When a PDF page is useful, include the PDF page number if it was recoverable. Many course PDFs are scans, so note when pagination or OCR is uncertain.
- Multiple revisions or formats of one assignment belong to one catalog group; preserve every physical path in that group.

## Workflows

### Ingest

1. Inventory the new raw file and identify duplicate/version relationships.
2. Extract its argument, evidence, chronology, entities, and limitations.
3. Add or update its group in `source-catalog.md`.
4. Update every affected topic page and `index.md`.
5. Append an `ingest` entry to `log.md`.

### Query

1. Read `index.md`, then the relevant topic pages and catalog entries.
2. Answer with explicit source status and uncertainty.
3. If the synthesis is reusable, file it as a page and add it to the index.
4. Append a `query` entry to `log.md` only when a reusable page was created or materially revised.

### Lint

Check broken wikilinks, orphan pages, uncataloged raw files, claims without provenance, contradictions, and speculative claims presented as settled. Record the pass in `log.md`.

## Editorial priorities

1. Reconstruct what the course taught.
2. Help the reader relearn it as an interconnected religious system rather than trivia.
3. Make the knowledge useful while visiting Egyptian sites and museums.
4. Preserve scholarly caution, especially for modern esoteric readings and the blue-water-lily research project.
