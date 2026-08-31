// Sacred atlas. The map is a schematic drawn from the archive's own place list,
// oriented the Egyptian way: upstream is south, and the Nile runs down the
// middle of the page from the Delta at the top. Every marker is duplicated in a
// list, which also carries the orientation corrections.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allPlaces, allEntities, allPages } from '../../generated';
import { FilterBar, PageHeader, Section } from '../../design-system/components';

const REGIONS = [
  { id: 'delta', label: 'Delta' },
  { id: 'lower', label: 'Lower Egypt' },
  { id: 'fayum', label: 'Fayum' },
  { id: 'middle', label: 'Middle Egypt' },
  { id: 'upper', label: 'Upper Egypt' },
  { id: 'nubia', label: 'Nubia' },
  { id: 'desert', label: 'Desert margin' },
];

export function AtlasView() {
  const { search, navigate } = useApp();
  const selectedId = search.get('place');
  const [region, setRegion] = useState<string | null>(null);

  const places = useMemo(() => allPlaces.filter((place) => !region || place.region === region), [region]);
  const selected = useMemo(() => allPlaces.find((place) => place.id === selectedId) ?? null, [selectedId]);
  const geographyPage = allPages.find((page) => page.slug === 'sacred-geography');

  return (
    <div className="page atlas">
      <PageHeader
        eyebrow="Atlas"
        title="Upstream is south"
        lead="Egyptian geography runs along the river, not along the compass. Upper Egypt is the south because it is upstream; Lower Egypt is the north because it is downstream. The sun sets in the west, and so the cemeteries are on the west bank."
        actions={geographyPage && <Link className="archive-button" to={geographyPage.route}>Read sacred geography</Link>}
      />

      <FilterBar label="Region" options={REGIONS} value={region} onChange={setRegion} />

      <div className="atlas__layout">
        <div className="atlas__map-frame">
          <svg className="atlas__map" viewBox="0 0 100 104" role="group" aria-label="Schematic map of the Nile valley with cult centres. Each marker is also listed beside the map.">
            <defs>
              <linearGradient id="nile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--atlas-water-top)" />
                <stop offset="100%" stopColor="var(--atlas-water-bottom)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="104" className="atlas__ground" />
            <path className="atlas__delta" d="M50 14 L30 2 L70 2 Z" />
            <path className="atlas__river" d="M50 2 C 46 24, 54 40, 48 56 C 44 70, 54 82, 50 100" stroke="url(#nile)" fill="none" />
            <path className="atlas__valley" d="M50 2 C 46 24, 54 40, 48 56 C 44 70, 54 82, 50 100" fill="none" />
            <text className="atlas__compass" x="6" y="8">North · downstream</text>
            <text className="atlas__compass" x="6" y="100">South · upstream</text>
            <text className="atlas__compass atlas__compass--side" x="4" y="54">West · the dead</text>
            <text className="atlas__compass atlas__compass--side" x="96" y="54" textAnchor="end">East · sunrise</text>
            {places.map((place) => (
              <g key={place.id} className={`atlas__marker atlas__marker--${place.bank} ${selectedId === place.id ? 'is-selected' : ''}`}>
                {/* The interactive element is the marker itself, so its hit area
                    matches what a reader sees and the label never steals a click. */}
                <circle
                  cx={place.x}
                  cy={place.y}
                  r={selectedId === place.id ? 2.4 : 1.5}
                  role="button"
                  tabIndex={0}
                  aria-label={`${place.label}, ${place.region} Egypt`}
                  aria-pressed={selectedId === place.id}
                  onClick={() => navigate(selectedId === place.id ? '/atlas/' : `/atlas/?place=${place.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/atlas/?place=${place.id}`); }
                  }}
                />
                <text x={place.x + (place.x < 50 ? -3 : 3)} y={place.y + 0.8} textAnchor={place.x < 50 ? 'end' : 'start'}>{place.label}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="atlas__panel">
          {selected ? (
            <aside className="detail-panel" aria-live="polite">
              <h2>{selected.label}</h2>
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
        </div>
      </div>

      <Section title="Places in the archive" description="Ordered from the Delta upstream to Nubia, which is the order an Egyptian text would use.">
        <ul className="entity-list">
          {places.map((place) => (
            <li key={place.id} id={place.id}>
              <button type="button" className="entity-list__button" onClick={() => navigate(`/atlas/?place=${place.id}`)}>
                <strong>{place.label}</strong>
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
