# Search page improvement plan (archived)

Status: completed and archived. The implementation is covered by the current release record in [IMPLEMENTATION_STATUS.md](../live/IMPLEMENTATION_STATUS.md).

Prepared: 2026-08-31

Archived: 2026-08-31

Repository: `/Users/blake/egypt`

This document preserves the audit and acceptance criteria that led to the
shipped search refresh. Its measurements describe the pre-refresh page and its
implementation sections are historical reference, not pending work.

## Executive summary

The core search engine is salvageable; the page UI is the primary problem. The recommended direction is a better fully static lexical search—not embeddings, a server, or a new search dependency.

The finished search should have:

1. A search field.
2. A result count and one compact Filters button.
3. Only currently active filters, shown as removable controls.
4. Results immediately below.
5. A collapsed filter panel containing seven normal select controls: Section, Type, Origin, Evidence, Period, Place, and Tag.

No exhaustive option chips should appear on the page. The existing `FilterSelect` component was explicitly designed for this situation and should be reused. Before a query is entered, show only the search field and a short explanation—no filters and no empty results.

## Current-state audit

The live page at `/search/?q=maat` currently has:

- 372 filter buttons, including 291 tag chips.
- Results beginning 1,467 pixels down on desktop.
- Results beginning 4,873 pixels down on mobile, where the document is 5,679 pixels tall.
- A query state that does not move results above the filter wall.
- An internal full-page results scroller, creating scroll-within-scroll.
- Filter counts describing the entire corpus rather than the current query.
- Query and filter state that is not synchronized with the `/search` URL.
- An “Open full search” link that loses the dialog query.
- Listbox/option semantics without a complete accessible combobox implementation.

The existing same-origin index is already the right deployment architecture: it is generated with the application, fetched lazily when search opens, and requires no external service. The work should improve that static index and its client rather than replace them.

## Implementation plan

### 1. Separate ranking from filtering

Change:

- `src/features/search/searchClient.ts`
- `src/features/search/SearchDialog.tsx`

Refactor search into:

- `rank(index, query)` — returns all ranked corpus hits.
- `filterHits(hits, filters)` — applies page metadata filters.
- `search(...)` — retains the convenient combined API for existing callers.

With only 77 documents, keeping the complete ranked list in memory is trivial. Filter options and counts can then be derived from documents matching the current query instead of all 77 documents.

### 2. Replace the filter wall with a disclosure panel

Change:

- `src/features/search/SearchDialog.tsx`
- `src/application.css`

For the full search page:

- Add a Filters button with `aria-expanded` and the active-filter count.
- Put seven `FilterSelect` controls in a responsive grid.
- Use labels such as “Any section” and “Any period.”
- Populate options only from the current query’s ranked documents.
- Show selected filters above the results with individual remove buttons and Clear all.
- Keep the panel collapsed initially, including on mobile.
- Remove the full-page `.search-results` maximum height and overflow; normal document scrolling should handle results.

The search dialog should retain no filters and remain compact.

### 3. Improve the existing lexical ranking without dependencies

Change:

- `scripts/content/build-search.ts`
- `src/features/search/searchClient.ts`
- `src/types/content.ts`

Keep the existing field weights, prefix lookup, coverage penalty, catalog intent, and source-ID behavior. Add three bounded improvements:

- Add `aliases` to `SearchDoc` and strongly boost a normalized exact title or alias.
- Apply inverse-document-frequency weighting derived from the existing postings, reducing the influence of very common terms.
- For an out-of-vocabulary token only, attempt bounded Damerau–Levenshtein correction against the existing 7,244-term vocabulary. Allow distance 1 for short words and 2 for longer words, require a compatible first character and length, and score corrected postings at 35% of an exact match.

Source IDs must never receive spelling correction. Prefix matching remains preferred over fuzzy matching.

This provides typo tolerance and better ranking while adding no package, model, WebAssembly, or external asset.

### 4. Produce genuinely relevant result excerpts

Change:

- `scripts/content/build-search.ts`
- `src/features/search/searchClient.ts`
- `src/types/content.ts`
- `tests/unit/budgets.test.ts`

The current index retains only the first 700 characters of each document, so many body matches cannot show why they matched.

Store the full public plain text of each document in the lazy search index. At query time, examine occurrence windows and choose the approximately 220-character window containing the greatest number of distinct query terms, preferring a contiguous phrase.

This should keep the same-origin search asset below 500 KB gzip—tiny beside any model—and ordinary article routes should continue to download none of it.

### 5. Improve heading results and navigation

Change:

- `src/features/search/searchClient.ts`
- `src/features/search/SearchDialog.tsx`

Preserve heading IDs rather than returning only heading text. When the query directly matches a heading:

- Show `In: Heading name`.
- Link to `page.route#heading-id`.
- Keep exact page-title and alias results linked to the page top.

The existing application hash handler already supports lazy article loading, scrolling, and heading focus.

### 6. Make the full search state shareable

Change:

- `src/features/search/SearchDialog.tsx`

Synchronize the full-page query and non-empty filters to URLs such as:

```text
/search/?q=maat&period=new-kingdom&place=thebes
```

Use history replacement for typing so every keystroke does not become a browser-history entry. Reloading or sharing the URL must restore the same search.

Pass the dialog’s current query into its Open full search link.

### 7. Correct keyboard and screen-reader behavior

Change:

- `src/features/search/SearchDialog.tsx`
- `src/application.css`

Use normal result links rather than links masquerading as listbox options.

- Arrow Down from the search field focuses the first result.
- Arrow keys move between result links.
- Arrow Up from the first result returns to the field.
- Enter follows the focused link naturally.
- Use an `aria-live` result-count message.
- Style actual keyboard focus instead of maintaining a separate fake active selection.

### 8. Validate behavior and size

Change:

- `tests/unit/content.test.ts`
- `tests/application.spec.ts`
- `tests/unit/budgets.test.ts`

Add tests proving:

- The existing corpus query suite still passes.
- Exact titles, aliases, source IDs, and catalog intents retain their rankings.
- Misspellings such as `osriis` find Osiris without affecting exact queries.
- Phrase boosts and inverse-document-frequency weighting improve representative multiword searches.
- Filtering does not reorder the underlying relevance ranking.
- Query and filters survive reload through the URL.
- The dialog hands its query to full search.
- Empty search renders no filter-option wall.
- With a query, the first result is visible without scrolling at 390×844 and 1440×1000.
- Opening filters produces seven selects, not hundreds of buttons.
- Article routes still fetch no search index.
- The search index remains under a 500 KB gzip hard cap.
- `npm run check` passes.

## Resulting architecture

- Zero new dependencies.
- Zero external services.
- Zero model, ONNX, or WebAssembly files.
- One same-origin static search index generated with the rest of the app.
- Hundreds of kilobytes, loaded only when search opens.
- Existing exact-title, alias, heading, body, tag, and source-ID capabilities retained.
