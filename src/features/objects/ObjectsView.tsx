// Objects and texts: close-reading layouts. The Plate 30 study is built so it
// works before any photograph has been cleared — the annotations describe a
// schematic of the scene, and the rights status is stated in the same view.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allObjects, allPages, decoderGroups } from '../../generated';
import { Card, CardGrid, EmptyState, FilterBar, MediaFigure, PageHeader, Section, SourceList } from '../../design-system/components';

const OBJECT_SLUGS = ['book-of-the-dead-plate-30', 'pyramid-texts', 'coffin-texts', 'book-of-the-dead', 'ptahhotep-and-ethical-life', 'visual-decoder'];

export function ObjectsView() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Objects and texts"
        title="Reading one thing closely"
        lead="Text-study layouts, an annotated object walkthrough, and the visual decoder. Where an image has not been cleared for publication, the study says so and works without it."
      />
      <Section title="Studies">
        <CardGrid>
          {allObjects.map((object) => (
            <Card key={object.id} to={`/objects/${object.id}/`} eyebrow={object.period} title={object.title}>{object.subtitle}</Card>
          ))}
          <Card to="/objects/decoder/" eyebrow="Tool" title="Visual decoder">
            Signs, crowns, priestly cues, and funerary scene cues, with identification confidence kept visible.
          </Card>
        </CardGrid>
      </Section>
      <Section title="The text-study articles">
        <ul className="index-list index-list--wide">
          {OBJECT_SLUGS.map((slug) => {
            const page = allPages.find((entry) => entry.slug === slug);
            return page ? (
              <li key={slug}>
                <div><Link to={page.route}><strong>{page.title}</strong></Link><p>{page.summary}</p></div>
                <span>{page.readingMinutes} min</span>
              </li>
            ) : null;
          })}
        </ul>
      </Section>
    </div>
  );
}

export function ObjectStudyView({ id }: { id: string }) {
  const object = useMemo(() => allObjects.find((entry) => entry.id === id) ?? null, [id]);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  if (!object) {
    return <div className="page"><EmptyState title="That study is not in the archive"><Link to="/objects/">See all studies</Link></EmptyState></div>;
  }

  const article = allPages.find((page) => page.slug === object.slug);
  const region = object.regions.find((entry) => entry.id === activeRegion) ?? null;

  return (
    <div className="page object-study">
      <PageHeader
        eyebrow={`Object study · ${object.period}`}
        title={object.title}
        lead={object.subtitle}
        actions={article && <Link className="archive-button" to={article.route}>Read the article</Link>}
      />

      <aside className="archive-callout archive-callout--uncertainty">
        <span className="archive-callout__label">Image rights</span>
        <p>{object.imageStatus}</p>
      </aside>

      <div className="object-study__layout">
        <div className="object-study__viewer">
          {object.mediaId ? <MediaFigure id={object.mediaId} /> : (
            <svg className="object-study__schematic" viewBox="0 0 100 100" role="group" aria-label={`Schematic layout of ${object.title}. Each labelled area is also listed below.`}>
              <rect x="0" y="0" width="100" height="100" className="object-study__ground" />
              <line x1="0" y1="12" x2="100" y2="12" className="object-study__register" />
              <line x1="0" y1="88" x2="100" y2="88" className="object-study__register" />
              {object.regions.map((entry) => (
                <g key={entry.id} className={`object-study__region ${activeRegion === entry.id ? 'is-active' : ''}`}>
                  <rect
                    x={entry.x}
                    y={entry.y}
                    width={entry.w}
                    height={entry.h}
                    rx="1.5"
                    role="button"
                    tabIndex={0}
                    aria-pressed={activeRegion === entry.id}
                    aria-label={entry.label}
                    onClick={() => setActiveRegion(activeRegion === entry.id ? null : entry.id)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActiveRegion(entry.id); } }}
                  />
                  <text x={entry.x + entry.w / 2} y={entry.y + entry.h / 2} textAnchor="middle">{entry.label}</text>
                </g>
              ))}
            </svg>
          )}
          <p className="object-study__caption">
            Schematic, not a reproduction. Positions show the arrangement described in the source packet so the reading
            order can be followed. Nothing here is traced from the original.
          </p>
        </div>

        <aside className="detail-panel">
          {region ? (
            <>
              <h2>{region.label}</h2>
              <h3>What is visible</h3><p>{region.visible}</p>
              <h3>How it is read</h3><p>{region.reading}</p>
              <h3>Confidence</h3><p className="muted">{region.confidence}</p>
              <button type="button" className="archive-button archive-button--quiet" onClick={() => setActiveRegion(null)}>Clear selection</button>
            </>
          ) : (
            <>
              <h2>Select an area</h2>
              <p>Each area separates what is visible in the image from how the archive reads it, and states how confident that reading is.</p>
              <ul className="object-study__region-list">
                {object.regions.map((entry) => (
                  <li key={entry.id}><button type="button" onClick={() => setActiveRegion(entry.id)}>{entry.label}</button></li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      <Section title="Scene reading order" description="The sequence the text moves through, one step at a time.">
        <ol className="object-study__sequence">
          {object.sequence.map((line, index) => (
            <li key={index} className={index === step ? 'is-current' : ''}>
              <button type="button" onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined}>{line}</button>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What the scene teaches">
        <CardGrid>
          {object.lessons.map((lesson) => <Card key={lesson.title} title={lesson.title}>{lesson.body}</Card>)}
        </CardGrid>
      </Section>

      {object.correction && (
        <aside className="archive-callout archive-callout--contested">
          <span className="archive-callout__label">Correction to the student report</span>
          <p>{object.correction}</p>
        </aside>
      )}

      <Section title="Evidence and sources">
        <p>{object.evidenceNote}</p>
        <SourceList ids={object.sourceIds} />
      </Section>
    </div>
  );
}

export function DecoderView() {
  const { search, navigate } = useApp();
  const group = search.get('group');
  const [query, setQuery] = useState('');
  const groups = useMemo(
    () => decoderGroups
      .filter((entry) => !group || entry.group === group)
      .map((entry) => ({
        ...entry,
        rows: entry.rows.filter((row) => !query.trim() || `${row.term} ${row.meaning}`.toLowerCase().includes(query.trim().toLowerCase())),
      }))
      .filter((entry) => entry.rows.length > 0),
    [group, query],
  );
  const article = allPages.find((page) => page.slug === 'visual-decoder');

  return (
    <div className="page">
      <PageHeader
        eyebrow="Tool"
        title="Visual decoder"
        lead="Iconography is an entry point, not an identity. Crowns and heads are shared between deities, so read inscriptions, companions, place, and action before deciding who you are looking at."
        actions={article && <Link className="archive-button" to={article.route}>Read the full article</Link>}
      />
      <label className="search-field search-field--compact">
        <span className="sr-only">Filter the decoder</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter signs and cues…" type="search" />
      </label>
      <FilterBar
        label="Group"
        options={decoderGroups.map((entry) => ({ id: entry.group, label: entry.group, count: entry.rows.length }))}
        value={group}
        onChange={(value) => navigate(value ? `/objects/decoder/?group=${encodeURIComponent(value)}` : '/objects/decoder/')}
      />
      {groups.length === 0 && <EmptyState title="Nothing matches that filter" />}
      {groups.map((entry) => (
        <Section key={entry.group} title={entry.group}>
          <dl className="decoder-list">
            {entry.rows.map((row) => (
              <div key={row.term}>
                <dt>{row.term}</dt>
                <dd>{row.meaning}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ))}
      <Section title="Where to use this">
        <ul className="inline-list">
          {['egypt-trip-field-guide', 'deity-field-guide', 'book-of-the-dead-plate-30']
            .map((slug) => allPages.find((page) => page.slug === slug))
            .filter(Boolean)
            .map((page) => <li key={page!.slug}><Link to={page!.route}>{page!.title}</Link></li>)}
        </ul>
      </Section>
      <p className="muted">
        Groups above are generated from the archive's own tables in the visual decoder article, so the tool and the
        article cannot drift apart.
      </p>
    </div>
  );
}
