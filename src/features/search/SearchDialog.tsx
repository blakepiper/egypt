// Search is one component used two ways: a dialog from the shell, and the full
// `/search/` route. Both share ranking, filters, and keyboard behaviour.

import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { ContentOrigin, SearchDoc, SearchIndex } from '../../types/content';
import { filterHits, loadSearchIndex, rank, type SearchFilters, type SearchHit } from './searchClient';
import { Link, useApp } from '../../app/state';
import { Dialog, EmptyState, FilterSelect, type FilterOption } from '../../design-system/components';
import { EvidenceBadge, Icon, OriginBadge } from '../../design-system';
import { allPeriods, allPlaces } from '../../generated';
import { sectionLabel } from '../../app/sections';

const FILTER_ORDER = [
  { key: 'section', label: 'Section' },
  { key: 'type', label: 'Type' },
  { key: 'origin', label: 'Origin' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'period', label: 'Period' },
  { key: 'place', label: 'Place' },
  { key: 'tag', label: 'Tag' },
] as const;

type SearchFilterKey = (typeof FILTER_ORDER)[number]['key'];

const ORIGIN_LABELS: Record<ContentOrigin, string> = {
  course: 'Course archive',
  supplemental: 'Supplemental research',
  mixed: 'Course + research',
};

const EVIDENCE_LABELS: Record<string, string> = {
  primary: 'Primary source',
  scholarship: 'Scholarship',
  archive: 'Archive synthesis',
  mixed: 'Mixed evidence',
  speculative: 'Contested',
};

const PERIOD_LABELS = new Map(allPeriods.map((period) => [period.id, period.label.split(',')[0]]));
const PLACE_LABELS = new Map(allPlaces.map((place) => [place.id, place.label]));

function useIndex(active: boolean): { index: SearchIndex | null; error: boolean } {
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!active || index) return;
    let cancelled = false;
    loadSearchIndex().then((value) => { if (!cancelled) setIndex(value); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [active, index]);
  return { index, error };
}

function filtersFromParams(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  for (const { key } of FILTER_ORDER) {
    const value = params.get(key);
    if (!value) continue;
    if (key === 'origin') filters.origin = value as ContentOrigin;
    else if (key === 'section') filters.section = value;
    else if (key === 'type') filters.type = value;
    else if (key === 'evidence') filters.evidence = value;
    else if (key === 'period') filters.period = value;
    else if (key === 'place') filters.place = value;
    else if (key === 'tag') filters.tag = value;
  }
  return filters;
}

function sameFilters(first: SearchFilters, second: SearchFilters): boolean {
  return FILTER_ORDER.every(({ key }) => (first[key] ?? null) === (second[key] ?? null));
}

function searchPath(query: string, filters: SearchFilters): string {
  const params = new URLSearchParams();
  const value = query.trim();
  if (!value) return '/search/';
  params.set('q', value);
  for (const { key } of FILTER_ORDER) {
    const filter = filters[key];
    if (filter) params.set(key, filter);
  }
  return `/search/?${params.toString()}`;
}

function humanize(value: string): string {
  return value.replace(/-/g, ' ');
}

function optionsFor(
  hits: SearchHit[],
  valuesFor: (doc: SearchDoc) => string[],
  labelFor: (value: string) => string,
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const hit of hits) {
    for (const value of new Set(valuesFor(hit.doc))) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts]
    .sort(([first], [second]) => labelFor(first).localeCompare(labelFor(second)))
    .map(([id, count]) => ({ id, label: labelFor(id), count }));
}

function filterValueLabel(key: SearchFilterKey, value: string, options: Record<SearchFilterKey, FilterOption[]>): string {
  return options[key].find((option) => option.id === value)?.label
    ?? (key === 'origin' ? ORIGIN_LABELS[value as ContentOrigin] : undefined)
    ?? (key === 'evidence' ? EVIDENCE_LABELS[value] : undefined)
    ?? humanize(value);
}

function resultLinkId(slug: string): string {
  return `search-result-link-${slug}`;
}

export function SearchPanel({
  autoFocus, onNavigate, showFilters = true, initialQuery = '', initialFilters = {}, syncUrl = false, onQueryChange,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  showFilters?: boolean;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  syncUrl?: boolean;
  onQueryChange?: (query: string) => void;
}) {
  const { navigate, search: params } = useApp();
  const [query, setQuery] = useState(() => syncUrl ? params.get('q') ?? initialQuery : initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(() => {
    if (!syncUrl) return initialFilters;
    return (params.get('q') ?? '').trim() ? filtersFromParams(params) : {};
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingResultFocus = useRef(false);
  const { index, error } = useIndex(true);
  const deferred = useDeferredValue(query);
  const hasQuery = query.trim().length > 0;

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  // Browser back/forward and direct URL edits are external to this component;
  // restore them without adding a history entry of our own.
  useEffect(() => {
    if (!syncUrl) return;
    const nextQuery = params.get('q') ?? '';
    const nextFilters = nextQuery.trim() ? filtersFromParams(params) : {};
    if (nextQuery !== query || !sameFilters(nextFilters, filters)) {
      setQuery(nextQuery);
      setFilters(nextFilters);
      onQueryChange?.(nextQuery);
    }
    if (!nextQuery.trim()) setFiltersOpen(false);
  }, [params, syncUrl]);

  const rankedHits = useMemo<SearchHit[]>(() => {
    if (!index || !deferred.trim()) return [];
    return rank(index, deferred);
  }, [index, deferred]);

  const filteredHits = useMemo(() => filterHits(rankedHits, filters), [rankedHits, filters]);
  const hits = filteredHits.slice(0, showFilters ? 40 : 8);

  const filterOptions = useMemo<Record<SearchFilterKey, FilterOption[]>>(() => ({
    section: optionsFor(rankedHits, (doc) => [doc.section], (value) => sectionLabel(value as never)),
    type: optionsFor(rankedHits, (doc) => [doc.type], humanize),
    origin: optionsFor(rankedHits, (doc) => [doc.origin], (value) => ORIGIN_LABELS[value as ContentOrigin] ?? humanize(value)),
    evidence: optionsFor(rankedHits, (doc) => [doc.evidence], (value) => EVIDENCE_LABELS[value] ?? humanize(value)),
    period: optionsFor(rankedHits, (doc) => doc.periods, (value) => PERIOD_LABELS.get(value) ?? humanize(value)),
    place: optionsFor(rankedHits, (doc) => doc.places, (value) => PLACE_LABELS.get(value) ?? humanize(value)),
    tag: optionsFor(rankedHits, (doc) => doc.tags, humanize),
  }), [rankedHits]);

  const activeFilters = FILTER_ORDER.filter(({ key }) => Boolean(filters[key]));
  const activeFilterCount = activeFilters.length;

  const replaceUrl = (nextQuery: string, nextFilters: SearchFilters) => {
    if (syncUrl) navigate(searchPath(nextQuery, nextFilters), { replace: true });
  };

  const updateQuery = (nextQuery: string) => {
    pendingResultFocus.current = false;
    const nextFilters = nextQuery.trim() ? filters : {};
    setQuery(nextQuery);
    onQueryChange?.(nextQuery);
    if (!nextQuery.trim()) {
      setFilters({});
      setFiltersOpen(false);
    }
    replaceUrl(nextQuery, nextFilters);
  };

  const updateFilter = (key: SearchFilterKey, value: string | null) => {
    const nextFilters = { ...filters, [key]: value } as SearchFilters;
    setFilters(nextFilters);
    replaceUrl(query, nextFilters);
  };

  const focusResult = (index_: number) => {
    document.getElementById(resultLinkId(hits[index_]?.doc.slug ?? ''))?.focus();
  };

  useEffect(() => {
    if (!pendingResultFocus.current || !hits.length) return;
    pendingResultFocus.current = false;
    focusResult(0);
  }, [hits]);

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (hits.length) focusResult(0);
      else pendingResultFocus.current = true;
    } else if (event.key === 'Enter' && hits[0]) {
      // Keep the search-box shortcut convenient; once a result is focused,
      // Enter is handled by the normal anchor behaviour below.
      event.preventDefault();
      navigate(hits[0].doc.route);
      onNavigate?.();
    }
  };

  const onResultKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>, index_: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusResult(Math.min(index_ + 1, hits.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index_ === 0) inputRef.current?.focus();
      else focusResult(index_ - 1);
    }
  };

  return (
    <div className={`search-panel ${showFilters ? 'search-panel--full' : 'search-panel--dialog'}`}>
      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">Search the archive</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Titles, headings, terms, or a source ID such as C14"
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-controls={hits.length ? 'search-results' : undefined}
          aria-describedby="search-help"
        />
      </label>
      <p id="search-help" className="search-help">
        {index ? `Search ${index.docs.length} indexed items by title, heading, term, or source ID.` : 'Search titles, headings, terms, or source IDs.'}
      </p>

      {hasQuery && (
        <>
          <div className="search-toolbar">
            <p className="search-count" aria-live="polite">
              {index ? `${filteredHits.length} result${filteredHits.length === 1 ? '' : 's'}` : 'Searching…'}
            </p>
            {showFilters && (
              <button
                type="button"
                className="archive-button archive-button--quiet search-filter-toggle"
                aria-expanded={filtersOpen}
                aria-controls="search-filter-panel"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="search-active-filters" aria-label="Active filters">
              {activeFilters.map(({ key, label }) => {
                const value = filters[key] as string;
                return (
                  <span key={key} className="search-active-filter">
                    <span>{label}: {filterValueLabel(key, value, filterOptions)}</span>
                    <button type="button" aria-label={`Remove ${label} filter`} onClick={() => updateFilter(key, null)}>
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                );
              })}
              <button type="button" className="search-filter-clear" onClick={() => {
                setFilters({});
                replaceUrl(query, {});
              }}>Clear all</button>
            </div>
          )}

          {showFilters && filtersOpen && (
            <div className="search-filter-panel" id="search-filter-panel" aria-label="Search filters">
              <FilterSelect label="Section" allLabel="Any section" options={filterOptions.section} value={filters.section ?? null} onChange={(value) => updateFilter('section', value)} />
              <FilterSelect label="Type" allLabel="Any type" options={filterOptions.type} value={filters.type ?? null} onChange={(value) => updateFilter('type', value)} />
              <FilterSelect label="Origin" allLabel="Any origin" options={filterOptions.origin} value={filters.origin ?? null} onChange={(value) => updateFilter('origin', value)} />
              <FilterSelect label="Evidence" allLabel="Any evidence" options={filterOptions.evidence} value={filters.evidence ?? null} onChange={(value) => updateFilter('evidence', value)} />
              <FilterSelect label="Period" allLabel="Any period" options={filterOptions.period} value={filters.period ?? null} onChange={(value) => updateFilter('period', value)} />
              <FilterSelect label="Place" allLabel="Any place" options={filterOptions.place} value={filters.place ?? null} onChange={(value) => updateFilter('place', value)} />
              <FilterSelect label="Tag" allLabel="Any tag" options={filterOptions.tag} value={filters.tag ?? null} onChange={(value) => updateFilter('tag', value)} />
            </div>
          )}
        </>
      )}

      {error && <EmptyState title="The search index could not load">Try reloading the page. Every article is still reachable from the encyclopedia index.</EmptyState>}
      {!error && hasQuery && !filteredHits.length && index && (
        <EmptyState title={`No page matches “${query}”`}>
          Try a broader term, a deity name, or a source ID such as C03.
        </EmptyState>
      )}
      {hits.length > 0 && (
        <ul className="search-results" id="search-results" aria-label="Search results">
          {hits.map((hit, index_) => (
            <li key={hit.doc.slug}>
              <Link
                to={hit.doc.route}
                className="search-result"
                id={resultLinkId(hit.doc.slug)}
                onNavigate={onNavigate}
                onKeyDown={(event) => onResultKeyDown(event, index_)}
              >
                <div className="search-result__head">
                  <strong>{hit.doc.title}</strong>
                  <EvidenceBadge kind={hit.doc.evidence} />
                  <OriginBadge origin={hit.doc.origin} />
                </div>
                <p className="search-result__excerpt">{hit.excerpt}</p>
                <div className="search-result__meta">
                  <span>{sectionLabel(hit.doc.section)}</span>
                  <span>{humanize(hit.doc.type)}</span>
                </div>
              </Link>
              {hit.matchedHeadings.length > 0 && (
                <div className="search-result__headings">
                  <span>In:</span>
                  {hit.matchedHeadings.slice(0, 2).map((heading) => (
                    <Link key={heading.id} to={`${hit.doc.route}#${heading.id}`} onNavigate={onNavigate}>{heading.text}</Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useApp();
  const [dialogQuery, setDialogQuery] = useState('');
  const fullSearchPath = dialogQuery.trim() ? searchPath(dialogQuery, {}) : '/search/';
  return (
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search the archive" className="search-dialog">
      <SearchPanel autoFocus onNavigate={() => setSearchOpen(false)} showFilters={false} initialQuery={dialogQuery} onQueryChange={setDialogQuery} />
      <p className="search-dialog__footer">
        <Link to={fullSearchPath} onNavigate={() => setSearchOpen(false)}>Open full search with filters</Link>
      </p>
    </Dialog>
  );
}

export function SearchView() {
  const { search: params } = useApp();
  return (
    <div className="page">
      <header className="page-header">
        <span className="kicker">Find</span>
        <h1>Search the archive</h1>
      </header>
      <SearchPanel autoFocus initialQuery={params.get('q') ?? ''} syncUrl />
    </div>
  );
}
