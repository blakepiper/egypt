// Structured browse: every page reachable by letter, hub, type, tag, period,
// place, deity, source group, and media. These lists are the accessible
// counterpart to search and to the graph.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allEntities, allMedia, allPages, allPeriods, allPlaces, allSources } from '../../generated';
import { FilterBar, PageHeader, Section, EmptyState } from '../../design-system/components';
import { HUB_GROUPS, sectionLabel } from '../../app/sections';

type Mode = 'alphabetical' | 'hub' | 'type' | 'deity' | 'place' | 'period' | 'source' | 'media';

const MODES: { id: Mode; label: string }[] = [
  { id: 'alphabetical', label: 'A–Z' },
  { id: 'hub', label: 'By hub' },
  { id: 'type', label: 'By type' },
  { id: 'deity', label: 'Deities' },
  { id: 'place', label: 'Places' },
  { id: 'period', label: 'Periods' },
  { id: 'source', label: 'Source groups' },
  { id: 'media', label: 'Media' },
];

export function BrowseView() {
  const { search } = useApp();
  const tagFilter = search.get('tag');
  const [mode, setMode] = useState<Mode>(tagFilter ? 'alphabetical' : 'alphabetical');

  const pages = useMemo(
    () => (tagFilter ? allPages.filter((page) => page.tags.includes(tagFilter)) : allPages),
    [tagFilter],
  );

  const letters = useMemo(() => {
    const groups = new Map<string, typeof allPages>();
    for (const page of [...pages].sort((a, b) => a.title.localeCompare(b.title))) {
      const letter = page.title[0].toUpperCase();
      groups.set(letter, [...(groups.get(letter) ?? []), page]);
    }
    return [...groups];
  }, [pages]);

  const types = useMemo(() => {
    const groups = new Map<string, typeof allPages>();
    for (const page of pages) groups.set(page.type, [...(groups.get(page.type) ?? []), page]);
    return [...groups].sort((a, b) => a[0].localeCompare(b[0]));
  }, [pages]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Browse"
        title="Every way into the archive"
        lead={`${allPages.length} pages, ${allEntities.length} catalogued entities, ${allPlaces.length} places, ${allSources.length} source groups.`}
      />
      <FilterBar label="View" options={MODES} value={mode} onChange={(value) => setMode((value as Mode) ?? 'alphabetical')} allLabel="A–Z" />

      {tagFilter && (
        <p className="browse__filter-note">
          Filtered to the tag <strong>{tagFilter}</strong>. <Link to="/browse/">Clear</Link>
        </p>
      )}

      {mode === 'alphabetical' && (
        <Section title="Alphabetical index">
          {letters.length === 0 && <EmptyState title="No page carries that tag" />}
          {letters.map(([letter, group]) => (
            <div key={letter} className="index-block">
              <h3>{letter}</h3>
              <ul className="index-list">
                {group.map((page) => (
                  <li key={page.slug}>
                    <Link to={page.route}>{page.title}</Link>
                    <span>{sectionLabel(page.section)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {mode === 'hub' && (
        <Section title="By hub">
          {HUB_GROUPS.map((hub) => (
            <div key={hub.label} className="index-block">
              <h3>{hub.label}</h3>
              <ul className="index-list">
                {hub.slugs.map((slug) => {
                  const page = allPages.find((entry) => entry.slug === slug);
                  return page ? <li key={slug}><Link to={page.route}>{page.title}</Link><span>{page.readingMinutes} min</span></li> : null;
                })}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {mode === 'type' && (
        <Section title="By page type">
          {types.map(([type, group]) => (
            <div key={type} className="index-block">
              <h3>{type.replace(/-/g, ' ')}</h3>
              <ul className="index-list">
                {group.map((page) => <li key={page.slug}><Link to={page.route}>{page.title}</Link><span>{page.words.toLocaleString()} words</span></li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {mode === 'deity' && (
        <Section title="Deities" description="Derived from the deity field guide, which is the archive's own table.">
          <ul className="entity-list">
            {allEntities.filter((entity) => entity.kind === 'deity').map((entity) => (
              <li key={entity.id}>
                <strong>{entity.label}</strong>
                <p>{entity.summary}</p>
                {entity.iconography?.length ? <p className="muted">Recognise: {entity.iconography.join('; ')}</p> : null}
                {entity.cultCenters?.length ? <p className="muted">Places: {entity.cultCenters.join('; ')}</p> : null}
                <Link to="/wiki/deity-field-guide/">In the field guide</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {mode === 'place' && (
        <Section title="Places">
          <ul className="entity-list">
            {allPlaces.map((place) => (
              <li key={place.id}>
                <strong>{place.label}</strong>
                {place.aliases.length > 0 && <span className="muted"> — also {place.aliases.join(', ')}</span>}
                <p>{place.summary}</p>
                <Link to={`/atlas/?place=${place.id}`}>Show on the atlas</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {mode === 'period' && (
        <Section title="Periods and corpora">
          <ul className="entity-list">
            {allPeriods.map((period) => (
              <li key={period.id}>
                <strong>{period.label}</strong>
                <span className="muted"> — {formatRange(period.start, period.end)}{period.approximate ? ', approximate' : ''}</span>
                <p>{period.summary}</p>
                <Link to={`/chronology/?period=${period.id}`}>Show on the timeline</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {mode === 'source' && (
        <Section title="Source groups">
          <ul className="entity-list">
            {allSources.map((source) => (
              <li key={source.id}>
                <strong>{source.id} — {source.title}</strong>
                <p>{source.status}</p>
                <Link to={`/archive/sources/#${source.id.toLowerCase()}`}>Full record</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {mode === 'media' && (
        <Section title="Media" description="Only cleared assets appear in a production build.">
          {allMedia.length === 0
            ? <EmptyState title="No media has been cleared yet">
                The media manifest is in place and the build refuses any asset that is not cleared. Rights research is
                the next stage of work; see the archive's maintenance notes.
              </EmptyState>
            : (
              <ul className="entity-list">
                {allMedia.map((media) => (
                  <li key={media.id}>
                    <strong>{media.id}</strong>
                    <p>{media.caption}</p>
                    <p className="muted">{media.attribution} · {media.license}</p>
                  </li>
                ))}
              </ul>
            )}
        </Section>
      )}
    </div>
  );
}

export function formatRange(start: number, end: number): string {
  const format = (year: number) => (year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`);
  return `${format(start)} – ${format(end)}`;
}
