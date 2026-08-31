// The application shell: global navigation, the article tab strip, preference
// controls, and the print-safe document wrapper. The desktop metaphor stays,
// but reading is never blocked by it — on narrow screens and in print the
// window chrome collapses to ordinary document flow.

import { useEffect, type ReactNode } from 'react';
import { Button, Icon } from '../design-system';
import { Link, useApp } from './state';
import { contentManifest } from '../generated';

const NAV = [
  { to: '/wiki/', label: 'Encyclopedia', icon: 'book' as const },
  { to: '/atlas/', label: 'Atlas', icon: 'compass' as const },
  { to: '/chronology/', label: 'Chronology', icon: 'sun' as const },
  { to: '/graph/', label: 'Graph', icon: 'network' as const },
  { to: '/journeys/', label: 'Journeys', icon: 'water' as const },
  { to: '/objects/', label: 'Objects', icon: 'temple' as const },
  { to: '/learn/', label: 'Learn', icon: 'book' as const },
  { to: '/archive/', label: 'Archive', icon: 'archive' as const },
];

export function Shell({ children }: { children: ReactNode }) {
  const { route, preferences, update, setSearchOpen, prefersReducedMotion, navigate, closeTab, resetTabs } = useApp();

  const theme = preferences.theme;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme === 'system' ? '' : theme;
    root.dataset.motion = prefersReducedMotion ? 'reduce' : 'allow';
    root.dataset.performance = preferences.lowPerformance ? 'low' : 'normal';
  }, [theme, prefersReducedMotion, preferences.lowPerformance]);

  // Command-K and slash open search from anywhere that is not a text field.
  useEffect(() => {
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
  }, [setSearchOpen]);

  const activeSlug = route.name === 'article' ? route.slug : null;

  return (
    <div className="shell">
      <header className="shell__bar">
        <Link className="shell__mark" to="/">
          <img className="shell__mark-glyph" src={`${import.meta.env.BASE_URL}media/archive-app-icon.png`} alt="" aria-hidden="true" />
          <span>The Living Archive</span>
        </Link>

        <nav className="shell__nav" aria-label="Main">
          <ul>
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={route.name !== 'home' && item.to.startsWith(`/${route.name}`) ? 'is-current' : ''}>
                  <Icon name={item.icon} size={15} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shell__tools">
          <Button variant="quiet" onClick={() => setSearchOpen(true)} aria-keyshortcuts="Control+K">
            <Icon name="search" size={15} /><span className="shell__tools-label">Search</span><kbd>⌘K</kbd>
          </Button>
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

      {preferences.tabs.length > 0 && (
        <div className="shell__tabs" role="region" aria-label="Open articles">
          <ul>
            {preferences.tabs.map((tab) => (
              <li key={tab.slug} className={tab.slug === activeSlug ? 'is-active' : ''}>
                <Link to={`/wiki/${tab.slug}/`}>{tab.title}</Link>
                <button type="button" aria-label={`Close ${tab.title}`} onClick={() => {
                  closeTab(tab.slug);
                  if (tab.slug === activeSlug) navigate('/wiki/');
                }}>×</button>
              </li>
            ))}
          </ul>
          <Button variant="quiet" onClick={() => { resetTabs(); }}>Reset desktop</Button>
        </div>
      )}

      <main id="main-content" className="shell__main" tabIndex={-1}>{children}</main>

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
    </div>
  );
}
