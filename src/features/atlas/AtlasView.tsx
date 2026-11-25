// Schematic Nile Valley atlas using the archive’s place coordinates.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allPlaces, allEntities, allPages } from '../../generated';
import { FilterBar, FilterSelect, PageHeader, Section } from '../../design-system/components';
import { OriginBadge } from '../../design-system';

const CRUISE_STOPS = ['thebes', 'esna', 'el-kab', 'edfu', 'gebel-el-silsila', 'kom-ombo', 'daraw', 'aswan'];

const REGIONS = [
  { id: 'delta', label: 'Delta' },
  { id: 'lower', label: 'Lower Egypt' },
  { id: 'fayum', label: 'Fayum' },
  { id: 'middle', label: 'Middle Egypt' },
  { id: 'upper', label: 'Upper Egypt' },
  { id: 'nubia', label: 'Nubia' },
  { id: 'desert', label: 'Desert margin' },
];

type MapLabel = { x: number; y: number; anchor: 'start' | 'end'; name?: string };

const MAP_LABELS: Partial<Record<string, MapLabel>> = {
  delta: { x: 37, y: 13, anchor: 'end', name: 'Nile Delta' },
  memphis: { x: 39, y: 22, anchor: 'end', name: 'Memphis' },
  amarna: { x: 62, y: 36, anchor: 'start' },
  abydos: { x: 36, y: 52, anchor: 'end' },
  thebes: { x: 64, y: 62, anchor: 'start', name: 'Thebes / Luxor' },
  esna: { x: 36, y: 68, anchor: 'end' },
  'el-kab': { x: 61, y: 71, anchor: 'start', name: 'El Kab' },
  edfu: { x: 37, y: 75, anchor: 'end' },
  'gebel-el-silsila': { x: 38, y: 82, anchor: 'end' },
  'kom-ombo': { x: 65, y: 80, anchor: 'start' },
  daraw: { x: 65, y: 87, anchor: 'start' },
  aswan: { x: 39, y: 92, anchor: 'end' },
};

const NILE_CHANNEL = 'M50 13 C49 22 45 27 49 35 S53 42 49 48 S43 54 46 60 S51 65 49 71 S47 75 51 79 S49 87 51 91 S54 99 51 106';

export function AtlasView() {
  const { search, navigate } = useApp();
  const selectedId = search.get('place');
  const [region, setRegion] = useState<string | null>(null);

  const selected = useMemo(() => allPlaces.find((place) => place.id === selectedId) ?? null, [selectedId]);
  const activeRegion = selected && selected.region !== region ? null : region;
  const places = useMemo(() => allPlaces.filter((place) => !activeRegion || place.region === activeRegion), [activeRegion]);
  const selectPlace = (id: string) => navigate(id ? `/atlas/?place=${id}` : '/atlas/');
  const setRegionFilter = (nextRegion: string | null) => {
    setRegion(nextRegion);
    if (nextRegion && selected && selected.region !== nextRegion) selectPlace('');
  };
  const selectedLabel = selected && (MAP_LABELS[selected.id] ?? {
    x: selected.x < 50 ? selected.x + 7 : selected.x - 7,
    y: Math.max(10, Math.min(selected.y, 96)),
    anchor: selected.x < 50 ? 'start' as const : 'end' as const,
  });
  const geographyPage = allPages.find((page) => page.slug === 'sacred-geography');

  return (
    <div className="page atlas">
      <PageHeader
        eyebrow="Sacred geography"
        title="Nile Valley Atlas"
        lead="Find ancient sites, temple towns, and stops on our cruise. Select a place for its history and related reading."
        actions={geographyPage && <Link className="archive-button" to={geographyPage.route}>Read sacred geography</Link>}
      />

      <div className="atlas__controls">
        <FilterSelect
          label="Find a place"
          allLabel="Choose a place"
          options={allPlaces.map((place) => ({ id: place.id, label: place.label }))}
          value={selected?.id ?? null}
          onChange={(id) => {
            setRegion(null);
            selectPlace(id ?? '');
          }}
        />
        <FilterBar label="Region" options={REGIONS} value={activeRegion} onChange={setRegionFilter} />
      </div>

      <div className="atlas__layout">
        <figure className="atlas__map-frame">
          <figcaption className="atlas__map-caption">
            <strong>The Nile Valley</strong>
            <span>Schematic map</span>
          </figcaption>
          <svg className="atlas__map" viewBox="0 0 100 106" role="group" aria-label="Nile Valley schematic. Blue markers are cruise stops. Use Find a place to access every location.">
            <rect width="100" height="106" className="atlas__ground" />
            <g aria-hidden="true">
              <path className="atlas__terrain" d="M0 24Q16 18 31 24T28 42Q14 52 24 68T31 106H0ZM100 17Q81 20 78 32T80 57Q92 69 78 84T77 106H100Z" />
              <path className="atlas__contours" d="M0 36Q18 27 20 35T12 52T18 70T19 106 M0 42Q11 34 14 38T8 52T12 74T12 106 M100 30Q90 30 87 42T94 63T89 83T89 106 M100 40Q93 42 94 51T99 70T95 87T96 106" />
              <path className="atlas__sea" d="M0 0H100V9Q84 5 68 7T39 5T15 8L0 9Z" />
              <path className="atlas__delta" d="M37 5Q49 2 62 7Q58 12 51 17Q43 14 37 5Z" />
              <path className="atlas__floodplain" d={NILE_CHANNEL} />
              <path className="atlas__river" d={NILE_CHANNEL} />
              <path className="atlas__distributaries" d="M50 15Q45 10 43 5M50 15Q54 11 57 6" />
              <text className="atlas__region" x="24" y="3.9" textAnchor="middle">Mediterranean Sea</text>
              <text className="atlas__region" x="7" y="37">Western Desert</text>
              <text className="atlas__region" x="93" y="47" textAnchor="end">Eastern Desert</text>
              <text className="atlas__region" x="58" y="101">Nubia</text>
              <path className="atlas__north" d="M91 22V13M88.5 16L91 13 93.5 16" />
              <text className="atlas__region" x="91" y="11.6" textAnchor="middle">N</text>
            </g>
            <g aria-hidden="true" className="atlas__labels">
              {places.map((place) => {
                const current = place.id === selectedId;
                const label = current ? selectedLabel : MAP_LABELS[place.id];
                if (!label || (!current && selectedLabel && Math.abs(selectedLabel.y - label.y) < 4 && selectedLabel.anchor === label.anchor)) return null;
                const end = label.anchor === 'end' ? label.x + 1.4 : label.x - 1.4;
                return (
                  <g key={place.id} className={current ? 'is-selected' : undefined}>
                    <line x1={place.x} y1={place.y} x2={end} y2={label.y} />
                    <text x={label.x} y={label.y} textAnchor={label.anchor} dominantBaseline="central">{label.name ?? place.label}</text>
                  </g>
                );
              })}
            </g>
            {places.map((place) => {
              const current = place.id === selectedId;
              const cruiseStop = CRUISE_STOPS.includes(place.id);
              return (
                <g key={place.id} className={`atlas__marker${current ? ' is-selected' : ''}${cruiseStop ? ' is-cruise-stop' : ''}`}>
                  <circle className="atlas__marker-dot" cx={place.x} cy={place.y} r={current ? 1.65 : cruiseStop ? 1.22 : 0.8} />
                  <circle
                    className="atlas__marker-hit"
                    cx={place.x}
                    cy={place.y}
                    r="1.65"
                    role="button"
                    tabIndex={0}
                    aria-label={place.label}
                    aria-pressed={current}
                    onClick={() => selectPlace(current ? '' : place.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPlace(current ? '' : place.id); }
                    }}
                  >
                    <title>{place.label}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
          <ul className="atlas__key" aria-label="Map key">
            <li><span className="atlas__key-river" aria-hidden="true" />Nile</li>
            <li><span className="atlas__key-stop" aria-hidden="true" />Cruise stop</li>
            <li><span className="atlas__key-place" aria-hidden="true" />Other place</li>
          </ul>
        </figure>

        <div className="atlas__panel">
          {selected ? (
            <aside className="detail-panel" aria-live="polite">
              <h2>{selected.label} <OriginBadge origin={selected.origin ?? 'archive'} /></h2>
              {selected.aliases.length > 0 && <p className="muted">Also {selected.aliases.join(', ')}</p>}
              <p>{selected.summary}</p>
              <dl className="detail-panel__facts">
                <div><dt>Region</dt><dd>{selected.region}</dd></div>
                <div><dt>Bank</dt><dd>{selected.bank}</dd></div>
              </dl>
              {selected.deities.length > 0 && (
                <p>
                  Deities: {selected.deities.map((id, index) => {
                    const entity = allEntities.find((entry) => entry.id === id);
                    return <span key={id}>{index > 0 && ', '}{entity?.label ?? id}</span>;
                  })}
                </p>
              )}
              {selected.slug && <Link to={`/wiki/${selected.slug}/`}>Read the article</Link>}
            </aside>
          ) : (
            <aside className="detail-panel detail-panel--empty">
              <h2>Select a place</h2>
              <p>Choose a marker on the map or an entry in the list. The list below carries the same information and works without the map.</p>
            </aside>
          )}
          <section className="detail-panel atlas__cruise" aria-labelledby="atlas-cruise-title">
            <h2 id="atlas-cruise-title">Along our cruise route</h2>
            <ul>
              {CRUISE_STOPS.map((id) => {
                const place = allPlaces.find((entry) => entry.id === id);
                return place && <li key={id}><button type="button" aria-pressed={selectedId === id} onClick={() => {
                  setRegion(null);
                  selectPlace(id);
                }}>{place.label}</button></li>;
              })}
            </ul>
          </section>
        </div>
      </div>

      <Section title="Places in the archive" description="Ordered from the Delta upstream to Nubia, which is the order an Egyptian text would use.">
        <ul className="entity-list">
          {places.map((place) => (
            <li key={place.id} id={place.id}>
              <button type="button" className="entity-list__button" onClick={() => navigate(`/atlas/?place=${place.id}`)}>
                <strong>{place.label}</strong> <OriginBadge origin={place.origin ?? 'archive'} />
              </button>
              {place.aliases.length > 0 && <span className="muted"> — also {place.aliases.join(', ')}</span>}
              <p>{place.summary}</p>
              {place.slug && <Link to={`/wiki/${place.slug}/`}>Read more</Link>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
