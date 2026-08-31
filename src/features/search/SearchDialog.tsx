// Search is one component used two ways: a dialog from the shell, and the full
// `/search/` route. Both share ranking, filters, and keyboard behaviour.

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { SearchIndex } from '../../types/content';
import { loadSearchIndex, search, type SearchFilters, type SearchHit } from './searchClient';
import { Link, useApp } from '../../app/state';
import { Dialog, EmptyState, FilterBar } from '../../design-system/components';
import { EvidenceBadge, Icon } from '../../design-system';
import { allPages, allPeriods, allPlaces } from '../../generated';
import { sectionLabel } from '../../app/sections';

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

export function SearchPanel({
  autoFocus, onNavigate, showFilters = true, initialQuery = '',
}: { autoFocus?: boolean; onNavigate?: () => void; showFilters?: boolean; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useApp();
  const { index, error } = useIndex(true);
  const deferred = useDeferredValue(query);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  const hits = useMemo<SearchHit[]>(() => {
    if (!index || !deferred.trim()) return [];
    return search(index, deferred, filters);
  }, [index, deferred, filters]);

  useEffect(() => { setActiveIndex(0); }, [deferred, filters]);

  const sections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const page of allPages) counts.set(page.section, (counts.get(page.section) ?? 0) + 1);
    return [...counts].map(([id, count]) => ({ id, label: sectionLabel(id as never), count }));
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((current) => Math.min(current + 1, hits.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
    else if (event.key === 'Enter' && hits[activeIndex]) {
      event.preventDefault();
      navigate(hits[activeIndex].doc.route);
      onNavigate?.();
    }
  };

  return (
    <div className="search-panel">
      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">Search the archive</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Titles, headings, terms, or a source ID such as C14"
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-controls="search-results"
          aria-describedby="search-help"
        />
      </label>
      <p id="search-help" className="search-help">
        {index ? `${index.docs.length} pages, ${index.terms.toLocaleString()} indexed terms. Use the arrow keys and Enter.` : 'Loading the index…'}
      </p>

      {showFilters && (
        <div className="search-filters">
          <FilterBar label="Section" options={sections} value={filters.section ?? null} onChange={(value) => setFilters((f) => ({ ...f, section: value }))} />
          <FilterBar
            label="Evidence"
            options={[
              { id: 'primary', label: 'Primary source' },
              { id: 'scholarship', label: 'Scholarship' },
              { id: 'archive', label: 'Archive synthesis' },
              { id: 'speculative', label: 'Contested' },
            ]}
            value={filters.evidence ?? null}
            onChange={(value) => setFilters((f) => ({ ...f, evidence: value }))}
          />
          <FilterBar
            label="Period"
            options={allPeriods.filter((period) => period.kind === 'period' || period.kind === 'era').map((period) => ({ id: period.id, label: period.label.split(',')[0] }))}
            value={filters.period ?? null}
            onChange={(value) => setFilters((f) => ({ ...f, period: value }))}
          />
          <FilterBar
            label="Place"
            options={allPlaces.slice(0, 10).map((place) => ({ id: place.id, label: place.label }))}
            value={filters.place ?? null}
            onChange={(value) => setFilters((f) => ({ ...f, place: value }))}
          />
        </div>
      )}

      <div className="search-results" id="search-results" role="listbox" aria-label="Search results">
        {error && <EmptyState title="The search index could not load">Try reloading the page. Every article is still reachable from the encyclopedia index.</EmptyState>}
        {!error && query.trim() && !hits.length && index && (
          <EmptyState title={`No page matches “${query}”`}>
            Try a broader term, a deity name, or a source ID such as C03.
          </EmptyState>
        )}
        {hits.map((hit, index_) => (
          <Link
            key={hit.doc.slug}
            to={hit.doc.route}
            className={`search-result ${index_ === activeIndex ? 'is-active' : ''}`}
            role="option"
            aria-selected={index_ === activeIndex}
            onNavigate={onNavigate}
            onMouseEnter={() => setActiveIndex(index_)}
          >
            <div className="search-result__head">
              <strong>{hit.doc.title}</strong>
              <EvidenceBadge kind={hit.doc.evidence} />
            </div>
            <p className="search-result__excerpt">{hit.excerpt}</p>
            <div className="search-result__meta">
              <span>{sectionLabel(hit.doc.section)}</span>
              <span>{hit.doc.type.replace(/-/g, ' ')}</span>
              {hit.matchedHeadings.length > 0 && <span>In: {hit.matchedHeadings.slice(0, 2).join(', ')}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useApp();
  return (
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search the archive" className="search-dialog">
      <SearchPanel autoFocus onNavigate={() => setSearchOpen(false)} showFilters={false} />
      <p className="search-dialog__footer">
        <Link to="/search/" onNavigate={() => setSearchOpen(false)}>Open full search with filters</Link>
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
      <SearchPanel autoFocus initialQuery={params.get('q') ?? ''} />
    </div>
  );
}
