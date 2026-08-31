// Chronology layers. Periods, corpora, institutions, and evidence survival are
// drawn as parallel bands on one time axis, with an equivalent table underneath.
// Approximate dates are marked in both.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allPeriods, allPages } from '../../generated';
import { FilterBar, PageHeader, Section } from '../../design-system/components';
import { formatRange } from '../browse/BrowseView';
import type { Period } from '../../types/content';

const LANES: { kind: Period['kind'][]; label: string; description: string }[] = [
  { kind: ['period', 'intermediate', 'era'], label: 'Political periods', description: 'Dynastic divisions are a later organising scheme. Boundaries can be arbitrary and dates before 664 BCE are approximate.' },
  { kind: ['corpus'], label: 'Funerary corpora', description: 'These overlap like shingles. A corpus changing audience or medium is not the same as a corpus being replaced.' },
  { kind: ['institution', 'evidence'], label: 'Institutions and evidence', description: 'What survives changes independently of what happened. A gap in evidence is not a gap in practice.' },
];

const START = -5500;
const END = 400;

function position(year: number): number {
  return ((year - START) / (END - START)) * 100;
}

export function ChronologyView() {
  const { search, navigate, prefersReducedMotion } = useApp();
  const selectedId = search.get('period');
  const [lane, setLane] = useState<string | null>(null);
  const selected = useMemo(() => allPeriods.find((period) => period.id === selectedId) ?? null, [selectedId]);

  const lanes = LANES.filter((entry) => !lane || entry.label === lane);
  const chronologyPage = allPages.find((page) => page.slug === 'chronology');

  return (
    <div className="page chronology">
      <PageHeader
        eyebrow="Chronology"
        title="Layers, not a ladder"
        lead="Egyptian religious change was additive and recursive. Old language could be revived centuries later, and a corpus could change audience without disappearing. Read the bands as overlapping, not as a sequence of replacements."
        actions={chronologyPage && <Link className="archive-button" to={chronologyPage.route}>Read the chronology article</Link>}
      />

      <FilterBar label="Layer" options={LANES.map((entry) => ({ id: entry.label, label: entry.label }))} value={lane} onChange={setLane} allLabel="All layers" />

      <div className="timeline" role="group" aria-label="Timeline of periods, corpora, and evidence">
        <div className="timeline__axis" aria-hidden="true">
          {[-5000, -4000, -3000, -2000, -1000, 0].map((year) => (
            <span key={year} style={{ left: `${position(year)}%` }}>{year === 0 ? '1 CE' : `${Math.abs(year)} BCE`}</span>
          ))}
        </div>
        {lanes.map((entry) => (
          <div key={entry.label} className="timeline__lane">
            <h2>{entry.label}</h2>
            <p className="timeline__lane-description">{entry.description}</p>
            <div className="timeline__track">
              {allPeriods.filter((period) => entry.kind.includes(period.kind)).map((period) => {
                const left = position(period.start);
                const width = Math.max(1.2, position(period.end) - left);
                return (
                  <button
                    key={period.id}
                    type="button"
                    className={`timeline__band timeline__band--${period.kind} ${period.approximate ? 'is-approximate' : ''} ${selectedId === period.id ? 'is-selected' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%`, transition: prefersReducedMotion ? 'none' : undefined }}
                    aria-pressed={selectedId === period.id}
                    onClick={() => navigate(selectedId === period.id ? '/chronology/' : `/chronology/?period=${period.id}`)}
                  >
                    <span>{period.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <aside className="detail-panel" aria-live="polite">
          <h2>{selected.label}</h2>
          <p className="detail-panel__range">
            {formatRange(selected.start, selected.end)}
            {selected.approximate && <span className="detail-panel__approximate"> · dates approximate</span>}
          </p>
          <p>{selected.summary}</p>
          {selected.slug && <Link to={`/wiki/${selected.slug}/`}>Read the article</Link>}
        </aside>
      )}

      <Section title="The same information as a table" description="Every band above appears here, with its dates and whether they are approximate.">
        <div className="article-table" role="region" tabIndex={0} aria-label="Chronology table, scrollable">
          <table>
            <thead>
              <tr><th scope="col">Band</th><th scope="col">Layer</th><th scope="col">Dates</th><th scope="col">Approximate</th><th scope="col">Why it matters here</th></tr>
            </thead>
            <tbody>
              {allPeriods.map((period) => (
                <tr key={period.id} className={selectedId === period.id ? 'is-selected' : ''}>
                  <th scope="row">{period.slug ? <Link to={`/wiki/${period.slug}/`}>{period.label}</Link> : period.label}</th>
                  <td>{period.kind}</td>
                  <td>{formatRange(period.start, period.end)}</td>
                  <td>{period.approximate ? 'Yes' : 'No'}</td>
                  <td>{period.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
