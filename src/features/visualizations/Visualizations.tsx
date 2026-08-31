// Three interactive views built from the wiki's own tables and sections. Each
// one has a text equivalent carrying the same content, and none of them adds a
// claim the article does not already make.

import { useMemo, useState } from 'react';
import { Link } from '../../app/state';
import { allEntities, allPages, allPeriods, visualizationData } from '../../generated';
import {
  Card, CardGrid, PageHeader, ReconstructionBoundary, Section, SourceList,
} from '../../design-system/components';
import { formatRange } from '../browse/BrowseView';

/* ------------------------------------------------- personhood constellation */

export function PersonhoodView() {
  const { rows, problems } = visualizationData.personhood;
  const [selected, setSelected] = useState<string | null>(null);
  const active = rows.find((row) => row.id === selected) ?? null;
  const entity = active ? allEntities.find((record) => record.id === active.id || record.label.toLowerCase().startsWith(active.term.split(' ')[0].toLowerCase())) : null;
  const article = allPages.find((page) => page.slug === 'personhood-and-the-afterlife');

  return (
    <div className="page">
      <PageHeader
        eyebrow="Interactive view"
        title="Personhood constellation"
        lead="Calling all of these “soul” hides what separates them. Select an aspect to see what it was for and which problem it solved. The table below carries the same content."
        actions={article && <Link className="archive-button" to={article.route}>Read the article</Link>}
      />

      <div className="constellation">
        <svg viewBox="-160 -160 320 320" className="constellation__canvas" role="group" aria-label="The seven aspects of a person arranged in a ring. Each is also listed in the table below.">
          <circle cx="0" cy="0" r="118" className="constellation__orbit" />
          <text x="0" y="4" textAnchor="middle" className="constellation__centre">a person</text>
          {rows.map((row) => {
            const radians = (row.angle * Math.PI) / 180;
            const x = Math.cos(radians) * 118;
            const y = Math.sin(radians) * 118;
            return (
              <g key={row.id} className={`constellation__node ${selected === row.id ? 'is-selected' : ''}`}>
                <line x1="0" y1="0" x2={x} y2={y} />
                <circle
                  cx={x}
                  cy={y}
                  r={selected === row.id ? 15 : 11}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected === row.id}
                  aria-label={row.term}
                  onClick={() => setSelected(selected === row.id ? null : row.id)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(row.id); } }}
                />
                <text x={x} y={y - 20} textAnchor="middle">{row.term.split('/')[0].trim()}</text>
              </g>
            );
          })}
        </svg>

        <aside className="detail-panel">
          {active ? (
            <>
              <h2>{active.term}</h2>
              <h3>Working meaning in this course</h3><p>{active.meaning}</p>
              <h3>Common image or issue</h3><p>{active.image}</p>
              {entity && <><h3>In the graph</h3><p>{entity.summary}</p></>}
            </>
          ) : (
            <>
              <h2>Select an aspect</h2>
              <p>
                Translations vary across scholarship and no short English gloss exhausts a term. The exam answers in the
                archive call the ka a remote agency or double and the akh the active spirit in the Duat. Those are memory
                aids, not definitions.
              </p>
            </>
          )}
        </aside>
      </div>

      <Section title="The same information as a table">
        <div className="article-table" role="region" tabIndex={0} aria-label="Aspects of a person, scrollable">
          <table>
            <thead><tr><th scope="col">Term</th><th scope="col">Working meaning</th><th scope="col">Common image or issue</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={selected === row.id ? 'is-selected' : ''}>
                  <th scope="row">{row.term}</th><td>{row.meaning}</td><td>{row.image}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="The problems these aspects solve" description="The funerary archive keeps returning to the same practical difficulties.">
        <CardGrid>
          {problems.map((problem) => (
            <Card key={problem.label} title={problem.label[0].toUpperCase() + problem.label.slice(1)}>{problem.body.replace(/;$/, '.')}</Card>
          ))}
        </CardGrid>
      </Section>
    </div>
  );
}

/* --------------------------------------------- creation-tradition comparison */

export function CreationView() {
  const { creation, grammar } = visualizationData.creation.length ? visualizationData : { creation: [], grammar: [] };
  const [compared, setCompared] = useState<string[]>(creation.slice(0, 2).map((entry) => entry.id));
  const article = allPages.find((page) => page.slug === 'creation-traditions');

  const toggle = (id: string) => setCompared((current) => (
    current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id].slice(-3)
  ));

  const shown = creation.filter((entry) => compared.includes(entry.id));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Interactive view"
        title="Creation traditions side by side"
        lead="These accounts were not rivals waiting for a winner. Compare up to three at once; the shared grammar underneath them is what makes the comparison work."
        actions={article && <Link className="archive-button" to={article.route}>Read the article</Link>}
      />

      <Section title="Choose traditions to compare">
        <div className="filter-bar__options">
          {creation.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`chip ${compared.includes(entry.id) ? 'is-active' : ''}`}
              aria-pressed={compared.includes(entry.id)}
              onClick={() => toggle(entry.id)}
            >
              {entry.place}
            </button>
          ))}
        </div>
      </Section>

      <div className="comparison" data-count={shown.length}>
        {shown.map((entry) => (
          <article key={entry.id} className="comparison__column">
            <span className="kicker">Cult centre</span>
            <h2>{entry.place}</h2>
            {entry.creator && <p className="comparison__creator">{entry.creator}</p>}
            {entry.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {article && <Link to={`${article.route}#${entry.id}`}>Read this section</Link>}
          </article>
        ))}
        {shown.length === 0 && <p className="muted">Select at least one tradition above.</p>}
      </div>

      <Section title="What they share" description="The recurrent grammar the article sets out. Every tradition above works through these five moves.">
        <ol className="grammar-list">
          {grammar.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
      </Section>

      <aside className="archive-callout archive-callout--evidence">
        <span className="archive-callout__label">What the comparison does not claim</span>
        <p>
          Placing these next to each other is a modern convenience. Egyptian sources rarely set them against one another,
          and a god could be supreme in one cult centre without erasing the others. The Khonsu Cosmogony is a late temple
          composition that deliberately builds a local totality out of several inherited systems.
        </p>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------- funerary corpus river */

const CORPUS_PERIOD: Record<string, string> = {
  'pyramid-texts': 'corpus-pyramid-texts',
  'coffin-texts': 'corpus-coffin-texts',
  'amduat-and-book-of-gates': 'corpus-underworld-books',
  'book-of-the-dead': 'corpus-book-of-the-dead',
};

const START = -2600;
const END = 200;

export function CorpusRiverView() {
  const corpora = visualizationData.corpora;
  const [selected, setSelected] = useState<string | null>(null);
  const article = allPages.find((page) => page.slug === 'funerary-text-tradition');

  const streams = useMemo(() => corpora.map((corpus) => {
    const period = allPeriods.find((entry) => entry.id === CORPUS_PERIOD[corpus.slug ?? '']);
    const page = corpus.slug ? allPages.find((entry) => entry.slug === corpus.slug) : undefined;
    const start = period?.start ?? START;
    const end = period?.end ?? END;
    return {
      ...corpus,
      label: page?.title ?? corpus.label,
      route: page?.route,
      start,
      end,
      left: ((start - START) / (END - START)) * 100,
      width: ((end - start) / (END - START)) * 100,
      range: formatRange(start, end),
    };
  }), [corpora]);

  const active = streams.find((stream) => stream.slug === selected) ?? null;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Interactive view"
        title="Funerary corpus river"
        lead="The archive's own metaphor is a roof of overlapping shingles. Each corpus inherits, repositions, and innovates; none of them simply replaces the last. The overlaps below are the point."
        actions={article && <Link className="archive-button" to={article.route}>Read the article</Link>}
      />

      <div className="river" role="group" aria-label="Four overlapping funerary corpora on one time axis. The same information is tabulated below.">
        <div className="river__axis" aria-hidden="true">
          {[-2500, -2000, -1500, -1000, -500, 0].map((year) => (
            <span key={year} style={{ left: `${((year - START) / (END - START)) * 100}%` }}>
              {year === 0 ? '1 CE' : `${Math.abs(year)} BCE`}
            </span>
          ))}
        </div>
        {streams.map((stream) => (
          <div key={stream.label} className="river__lane">
            <button
              type="button"
              className={`river__stream ${selected === stream.slug ? 'is-selected' : ''}`}
              style={{ left: `${stream.left}%`, width: `${stream.width}%` }}
              aria-pressed={selected === stream.slug}
              onClick={() => setSelected(selected === stream.slug ? null : stream.slug ?? null)}
            >
              <span>{stream.label}</span>
            </button>
          </div>
        ))}
      </div>

      {active && (
        <aside className="detail-panel" aria-live="polite">
          <h2>{active.label}</h2>
          <p className="detail-panel__range">{active.range} · dates approximate</p>
          <dl className="detail-panel__facts">
            <div><dt>Early prominence</dt><dd>{active.prominence}</dd></div>
            <div><dt>Medium</dt><dd>{active.medium}</dd></div>
            <div><dt>Principal user</dt><dd>{active.user}</dd></div>
          </dl>
          <p>{active.emphases}</p>
          {active.route && <Link to={active.route}>Read the article</Link>}
        </aside>
      )}

      <Section title="The same information as a table">
        <div className="article-table" role="region" tabIndex={0} aria-label="Funerary corpora, scrollable">
          <table>
            <thead>
              <tr>
                <th scope="col">Corpus</th><th scope="col">Early prominence</th><th scope="col">Medium</th>
                <th scope="col">Principal user</th><th scope="col">Recurring emphases</th>
              </tr>
            </thead>
            <tbody>
              {streams.map((stream) => (
                <tr key={stream.label}>
                  <th scope="row">{stream.route ? <Link to={stream.route}>{stream.label}</Link> : stream.label}</th>
                  <td>{stream.prominence}</td><td>{stream.medium}</td><td>{stream.user}</td><td>{stream.emphases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <ReconstructionBoundary
        period="Old Kingdom to Roman Period"
        place="Egypt, principally the royal and elite necropoleis"
        evidence="The bands show when each corpus was most prominent in surviving evidence, not when it started or stopped being used. Dates before 664 BCE are approximate, and survival is uneven: royal material dominates some stretches simply because it was carved in stone."
        reconstruction="Bands come from the period registry; the columns are the archive's own comparison table, read directly from the funerary-text-tradition article."
        sources={['C02', 'C23', 'C13', 'C14', 'C17']}
      />

      <aside className="archive-callout archive-callout--contested">
        <span className="archive-callout__label">On “democratization”</span>
        <p>
          Older scholarship described royal privileges spreading to everyone. Distribution did broaden, but elaborate
          coffins and papyri stayed expensive, and status, literacy, workshops, and institutional connections still
          decided who got what. Royal and nonroyal traditions continued to differ.
        </p>
      </aside>

      <Section title="Sources">
        <SourceList ids={['C02', 'C23', 'C13', 'C14', 'C15', 'C17']} />
      </Section>
    </div>
  );
}
