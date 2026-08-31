// The source catalog as a filterable list. Every C ID in the wiki links here,
// and every entry lists the pages that cite it, so provenance runs in both
// directions.

import { useEffect, useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allPages } from '../../generated';
import { loadSourceRecords } from '../../app/contentLoaders';
import { EmptyState, FilterBar, PageHeader } from '../../design-system/components';
import { OriginBadge } from '../../design-system';
import type { SourceEntry } from '../../types/content';

function statusKind(status: string): string {
  const value = status.toLowerCase();
  if (value.includes('primary')) return 'primary';
  if (value.includes('scholar')) return 'scholarship';
  if (value.includes('speculative') || value.includes('fringe')) return 'speculative';
  if (value.includes('archive') || value.includes('instructional') || value.includes('assessment') || value.includes('annotated') || value.includes('contextual') || value.includes('collection record') || value.includes('research process') || value.includes('report and presentation') || value.includes('generic academic') || value.includes('student')) return 'archive';
  return 'other';
}

const STATUS_FILTERS = [
  { id: 'scholarship', label: 'Scholarship' },
  { id: 'primary', label: 'Primary translation' },
  { id: 'archive', label: 'Archive notes' },
  { id: 'speculative', label: 'Speculative' },
  { id: 'other', label: 'Other' },
];

const ORIGIN_FILTERS = [
  { id: 'course', label: 'Course archive' },
  { id: 'supplemental', label: 'Supplemental research' },
];

export function SourcesView() {
  const { hash, search } = useApp();
  const [status, setStatus] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(search.get('catalog') === 'research' ? 'supplemental' : null);
  const [query, setQuery] = useState('');
  const [allSources, setAllSources] = useState<SourceEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSourceRecords().then((value) => { if (!cancelled) setAllSources(value); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setOrigin(search.get('catalog') === 'research' ? 'supplemental' : null);
  }, [search]);

  const sources = useMemo(() => (allSources ?? []).filter((source) => {
    if (origin && source.origin !== origin) return false;
    if (status && statusKind(source.status) !== status) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return `${source.id} ${source.title} ${source.status} ${source.use} ${source.sourceClass} ${source.limitations ?? ''}`.toLowerCase().includes(needle);
  }), [allSources, origin, status, query]);

  return (
    <div className="page">
      <PageHeader
       eyebrow="Archive"
       title="Source catalog"
        lead={allSources ? `${allSources.length} intellectual-source groups behind the archive. Course records and supplemental research are kept distinct, with access, limits, and reuse notes beside each record.` : 'Loading the source catalog…'}
      />
      <label className="search-field search-field--compact">
        <span className="sr-only">Filter sources</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by title, status, or ID…" type="search" />
      </label>
      <FilterBar label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
      <FilterBar label="Origin" options={ORIGIN_FILTERS} value={origin} onChange={setOrigin} />

      {!allSources && <p role="status" aria-live="polite">Loading source records…</p>}
      {allSources && sources.length === 0 && <EmptyState title="No source matches that filter" />}

      <ol className="source-catalog">
        {sources.map((source) => (
          <li key={source.id} id={source.id.toLowerCase()} className={hash === source.id.toLowerCase() ? 'is-targeted' : ''} tabIndex={-1}>
            <h2><span className="source-catalog__id">{source.id}</span> {source.title}</h2>
            <p className="source-catalog__meta"><OriginBadge origin={source.origin} /> <span>{source.sourceClass}</span>{source.accessDate && <span>Accessed {source.accessDate}</span>}</p>
            <p className="source-catalog__status">{source.status}</p>
            <p>{source.use}</p>
            {source.url && <p><a href={source.url} target="_blank" rel="noreferrer noopener">Open public source<span className="sr-only"> (opens in a new tab)</span></a></p>}
            {source.limitations && <p className="muted"><strong>Limits:</strong> {source.limitations}</p>}
            {source.reuse && <p className="muted"><strong>Reuse:</strong> {source.reuse}</p>}
            {source.files.length > 0 && (
              <details>
                <summary>{source.files.length} file{source.files.length === 1 ? '' : 's'} in the private source archive</summary>
                <ul className="source-catalog__files">
                  {source.files.map((file) => <li key={file.path}><code>{file.label}</code></li>)}
                </ul>
                <p className="muted">These files are held in <code>raw/</code>, which is not published. They are listed for provenance only.</p>
              </details>
            )}
            {source.citedBy.length > 0 && (
              <p className="source-catalog__cited">
                Cited on: {source.citedBy.map((slug, index) => {
                  const page = allPages.find((entry) => entry.slug === slug);
                  return page ? <span key={slug}>{index > 0 && ', '}<Link to={page.route}>{page.title}</Link></span> : null;
                })}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
