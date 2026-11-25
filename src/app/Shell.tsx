// Global navigation, preferences, and the print-safe document wrapper.

import { useEffect, type ReactNode } from 'react';
import { Button, Icon } from '../design-system';
import { Link, useApp } from './state';
import { isTripRoute, type Route } from './routes';
import { tripTitle } from '../features/trip/itinerary';
import { contentManifest } from '../generated';

const TRIP_NAV = [
  { to: '/itinerary/', label: 'Itinerary', icon: 'water' as const },
  { to: '/faq/', label: 'Travel FAQ', icon: 'compass' as const },
  { to: '/learn/', label: 'Learn About Ancient Egypt', icon: 'book' as const },
];

const ARCHIVE_NAV = [
  { to: '/wiki/', label: 'Encyclopedia', icon: 'book' as const },
  { to: '/atlas/', label: 'Atlas', icon: 'compass' as const },
  { to: '/chronology/', label: 'Chronology', icon: 'sun' as const },
  { to: '/graph/', label: 'Graph', icon: 'network' as const },
  { to: '/journeys/', label: 'Journeys', icon: 'water' as const },
  { to: '/objects/', label: 'Objects', icon: 'temple' as const },
  { to: '/explore/', label: 'Explore', icon: 'book' as const },
  { to: '/archive/', label: 'Archive', icon: 'archive' as const },
];

function navIsCurrent(to: string, route: Route): boolean {
  if (to === '/itinerary/') return route.name === 'itinerary';
  if (to === '/faq/') return route.name === 'faq';
  if (to === '/wiki/') return route.name === 'wiki-index' || route.name === 'article';
  if (to === '/atlas/') return route.name === 'atlas';
  if (to === '/chronology/') return route.name === 'chronology';
  if (to === '/graph/') return route.name === 'graph';
  if (to === '/journeys/') return route.name === 'journeys' || route.name === 'journey';
  if (to === '/objects/') return route.name === 'objects' || route.name === 'object';
  if (to === '/explore/') return route.name === 'explore';
  if (to === '/archive/') return route.name === 'archive' || route.name === 'sources';
  return false;
}

export function Shell({ children }: { children: ReactNode }) {
  const { route, preferences, update, setSearchOpen, prefersReducedMotion } = useApp();

  const trip = isTripRoute(route);
  const theme = preferences.theme;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme === 'system' ? '' : theme;
    root.dataset.motion = prefersReducedMotion ? 'reduce' : 'allow';
    root.dataset.performance = preferences.lowPerformance ? 'low' : 'normal';
  }, [theme, prefersReducedMotion, preferences.lowPerformance]);

  // Command-K and slash open archive search.
  useEffect(() => {
    if (trip) {
      setSearchOpen(false);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setSearchOpen, trip]);

  return (
    <div className="shell">
      <header className={trip ? 'shell__bar shell__bar--trip' : 'shell__bar'}>
        <div className="shell__identity">
          {!trip && (
            <Link className="archive-button archive-button--primary shell__trip-link" to="/">
              <span aria-hidden="true">←</span> Back to trip
            </Link>
          )}
          <Link className={trip ? 'shell__mark shell__mark--trip' : 'shell__mark'} to={trip ? '/' : '/learn/'}>
            <img className="shell__mark-glyph" src={`${import.meta.env.BASE_URL}media/archive-app-icon.png`} alt="" aria-hidden="true" />
            <span>{trip ? tripTitle : 'The Living Archive'}</span>
          </Link>
        </div>

        <nav className={trip ? 'shell__nav shell__nav--trip' : 'shell__nav'} aria-label="Main">
          <ul>
            {(trip ? TRIP_NAV : ARCHIVE_NAV).map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={navIsCurrent(item.to, route) ? 'is-current' : ''} aria-current={navIsCurrent(item.to, route) ? 'page' : undefined}>
                  <Icon name={item.icon} size={15} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shell__tools">
          {!trip && (
            <Button variant="quiet" onClick={() => setSearchOpen(true)} aria-keyshortcuts="Control+K">
              <Icon name="search" size={15} /><span className="shell__tools-label">Search</span><kbd>⌘K</kbd>
            </Button>
          )}
          <Button
            variant="quiet"
            iconOnly
            aria-label={theme === 'duat' ? 'Use the daylight theme' : 'Use the Duat theme'}
            aria-pressed={theme === 'duat'}
            onClick={() => update({ theme: theme === 'duat' ? 'daylight' : 'duat' })}
          >
            <Icon name={theme === 'duat' ? 'sun' : 'moon'} size={15} />
          </Button>
        </div>
      </header>

      <main id="main-content" className={trip ? 'shell__main' : 'shell__main shell__main--archive'} tabIndex={-1}>{children}</main>

      {trip ? (
        <footer className="shell__footer">
          <strong>{tripTitle}</strong>
          <Link to="/learn/">The Living Archive</Link>
        </footer>
      ) : (
        <footer className="shell__footer">
          <div>
            <strong>The Living Archive</strong>
            <p>
              {contentManifest.counts.pages} pages, {contentManifest.counts.sources} source groups,{' '}
              {contentManifest.counts.edges} graph relationships. Built from ancient texts, modern scholarship, and a
              reviewed source collection.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul>
              <li><Link to="/about/">About and privacy</Link></li>
              <li><Link to="/archive/sources/">Source catalog</Link></li>
              <li><Link to="/browse/">Browse everything</Link></li>
              <li><Link to="/specimen/">Design system specimen</Link></li>
            </ul>
          </nav>
        </footer>
      )}
    </div>
  );
}
