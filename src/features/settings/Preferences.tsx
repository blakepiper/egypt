// Reader preferences. Everything here is stored in this browser and can be
// cleared in one action, which is also the honest way to describe it.

import { Link, useApp } from '../../app/state';
import { Button } from '../../design-system';
import { FilterBar, Section, Toggle } from '../../design-system/components';
import { allPages } from '../../generated';

export function PreferencesPanel() {
  const { preferences, update, reset, prefersReducedMotion, toggleBookmark } = useApp();

  return (
    <>
      <Section title="Display" description="These settings apply to this browser only.">
        <FilterBar
          label="Theme"
          allLabel="Follow the system"
          options={[{ id: 'daylight', label: 'Daylight' }, { id: 'duat', label: 'Duat' }]}
          value={preferences.theme === 'system' ? null : preferences.theme}
          onChange={(value) => update({ theme: (value as 'daylight' | 'duat') ?? 'system' })}
        />
        <FilterBar
          label="Motion"
          allLabel="Follow the system"
          options={[{ id: 'allow', label: 'Allow animation' }, { id: 'reduce', label: 'Reduce motion' }]}
          value={preferences.reducedMotion === 'system' ? null : preferences.reducedMotion}
          onChange={(value) => update({ reducedMotion: (value as 'allow' | 'reduce') ?? 'system' })}
        />
        <p className="muted">
          Motion is currently {prefersReducedMotion ? 'reduced' : 'allowed'}. No animation carries information that the
          text does not also carry.
        </p>
        <Toggle
          label="Low-performance mode"
          description="Starts the knowledge graph with fewer nodes."
          checked={preferences.lowPerformance}
          onChange={(value) => update({ lowPerformance: value })}
        />
        <Toggle
          label="Allow sound"
          description="Audio is off by default and the archive is complete without it."
          checked={preferences.sound}
          onChange={(value) => update({ sound: value })}
        />
      </Section>

      <Section title={`Bookmarks (${preferences.bookmarks.length})`}>
        {preferences.bookmarks.length === 0 ? (
          <p className="muted">Nothing is bookmarked yet. Any article can be bookmarked from its header.</p>
        ) : (
          <ul className="index-list">
            {preferences.bookmarks.map((slug) => {
              const page = allPages.find((entry) => entry.slug === slug);
              return (
                <li key={slug}>
                  {page ? <Link to={page.route}>{page.title}</Link> : <span>{slug}</span>}
                  <button type="button" className="entity-list__button" onClick={() => toggleBookmark(slug)}>Remove</button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Stored data" description="Theme, motion, sound, low-performance mode, bookmarks, recent pages, open tabs, and journey progress.">
        <Button onClick={reset}>Clear everything stored in this browser</Button>
      </Section>
    </>
  );
}
