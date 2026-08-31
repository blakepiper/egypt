// Application state: the current route, the open article tabs, and the reader's
// stored preferences. Everything persisted here stays in this browser. Nothing
// is sent anywhere, and the version field lets a later release discard data it
// no longer understands.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { BASE, href, parseRoute, toAppPath, type Route } from './routes';

const STORE_KEY = 'living-archive:v1';

export interface OpenTab { slug: string; title: string }

export interface Preferences {
  version: 1;
  theme: 'daylight' | 'duat' | 'system';
  reducedMotion: 'system' | 'reduce' | 'allow';
  sound: boolean;
  lowPerformance: boolean;
  bookmarks: string[];
  recents: string[];
  progress: Record<string, string[]>;
  tabs: OpenTab[];
}

const DEFAULTS: Preferences = {
  version: 1,
  theme: 'system',
  reducedMotion: 'system',
  sound: false,
  lowPerformance: false,
  bookmarks: [],
  recents: [],
  progress: {},
  tabs: [],
};

function load(): Preferences {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    if (parsed.version !== 1) return DEFAULTS;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

interface AppState {
  route: Route;
  search: URLSearchParams;
  hash: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  preferences: Preferences;
  update: (patch: Partial<Preferences>) => void;
  reset: () => void;
  toggleBookmark: (slug: string) => void;
  openTab: (tab: OpenTab) => void;
  closeTab: (slug: string) => void;
  resetTabs: () => void;
  setProgress: (key: string, items: string[]) => void;
  prefersReducedMotion: boolean;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const Context = createContext<AppState | null>(null);

function currentLocation() {
  if (typeof window === 'undefined') return { path: '/', search: '', hash: '' };
  return { path: toAppPath(window.location.pathname), search: window.location.search, hash: window.location.hash.slice(1) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(currentLocation);
  const [preferences, setPreferences] = useState<Preferences>(load);
  const [searchOpen, setSearchOpen] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const skipScroll = useRef(false);

  useEffect(() => {
    const onPopState = () => setLocation(currentLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setSystemReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(preferences)); } catch { /* storage may be unavailable */ }
  }, [preferences]);

  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    const url = href(path);
    if (options?.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    skipScroll.current = Boolean(path.includes('#'));
    setLocation(currentLocation());
  }, []);

  const route = useMemo(() => parseRoute(location.path), [location.path]);
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  // These are stable across renders on purpose. An effect that opens a tab must
  // not re-run every time any other preference changes, or "Reset desktop" would
  // immediately re-add the article the reader is looking at.
  const reset = useCallback(() => setPreferences({ ...DEFAULTS }), []);

  const toggleBookmark = useCallback((slug: string) => setPreferences((current) => ({
    ...current,
    bookmarks: current.bookmarks.includes(slug)
      ? current.bookmarks.filter((item) => item !== slug)
      : [...current.bookmarks, slug],
  })), []);

  const openTab = useCallback((tab: OpenTab) => setPreferences((current) => {
    const without = current.tabs.filter((item) => item.slug !== tab.slug);
    return {
      ...current,
      tabs: [...without, tab].slice(-8),
      recents: [tab.slug, ...current.recents.filter((item) => item !== tab.slug)].slice(0, 12),
    };
  }), []);

  const closeTab = useCallback((slug: string) => setPreferences((current) => ({
    ...current, tabs: current.tabs.filter((tab) => tab.slug !== slug),
  })), []);

  const resetTabs = useCallback(() => setPreferences((current) => ({ ...current, tabs: [] })), []);

  const setProgress = useCallback((key: string, items: string[]) => setPreferences((current) => ({
    ...current, progress: { ...current.progress, [key]: items },
  })), []);

  const value = useMemo<AppState>(() => ({
    route,
    search,
    hash: location.hash,
    navigate,
    preferences,
    update,
    reset,
    toggleBookmark,
    openTab,
    closeTab,
    resetTabs,
    setProgress,
    prefersReducedMotion: preferences.reducedMotion === 'reduce' || (preferences.reducedMotion === 'system' && systemReducedMotion),
    searchOpen,
    setSearchOpen,
  }), [route, search, location.hash, navigate, preferences, update, reset, toggleBookmark, openTab, closeTab, resetTabs, setProgress, systemReducedMotion, searchOpen]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const value = useContext(Context);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

/** Internal link. Modifier clicks and middle clicks fall through to the browser. */
export function Link({
  to, children, className, onNavigate, ...props
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { navigate } = useApp();
  const external = /^https?:/.test(to);
  return (
    <a
      {...props}
      className={className}
      href={external ? to : href(to)}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      onClick={(event) => {
        if (external || event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        navigate(to);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

export { BASE };
