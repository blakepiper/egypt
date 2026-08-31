// The source catalog as a filterable list. Every C ID in the wiki links here,
// and every entry lists the pages that cite it, so provenance runs in both
// directions.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allPages, allSources } from '../../generated';
import { EmptyState, FilterBar, PageHeader } from '../../design-system/components';

function statusKind(status: string): string {
  const value = status.toLowerCase();
  if (value.includes('student')) return 'student';
  if (value.includes('primary')) return 'primary';
  if (value.includes('scholar')) return 'scholarship';
  if (value.includes('speculative') || value.includes('fringe')) return 'speculative';
  if (value.includes('course')) return 'course';
  return 'other';
}

const STATUS_FILTERS = [
  { id: 'scholarship', label: 'Scholarship' },
  { id: 'primary', label: 'Primary translation' },
  { id: 'student', label: 'Student work' },
  { id: 'course', label: 'Course record' },
  { id: 'speculative', label: 'Speculative' },
  { id: 'other', label: 'Other' },
];

export function SourcesView() {
  const { hash } = useApp();
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const sources = useMemo(() => allSources.filter((source) => {
    if (status && statusKind(source.status) !== status) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return `${source.id} ${source.title} ${source.status} ${source.use}`.toLowerCase().includes(needle);
  }), [status, query]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Archive"
        title="Source catalog"
        lead={`${allSources.length} intellectual-source groups behind the archive. “Student” means a course artefact, not independent authority. “Primary translation” means a modern translation of an ancient source.`}
      />
      <label className="search-field search-field--compact">
        <span className="sr-only">Filter sources</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by title, status, or ID…" type="search" />
      </label>
      <FilterBar label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />

      {sources.length === 0 && <EmptyState title="No source matches that filter" />}

      <ol className="source-catalog">
        {sources.map((source) => (
          <li key={source.id} id={source.id.toLowerCase()} className={hash === source.id.toLowerCase() ? 'is-targeted' : ''} tabIndex={-1}>
            <h2><span className="source-catalog__id">{source.id}</span> {source.title}</h2>
            <p className="source-catalog__status">{source.status}</p>
            <p>{source.use}</p>
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
