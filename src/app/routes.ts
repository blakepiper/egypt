// Route parsing. The application is served from generated HTML entry points, so
// every route is a real path and a reload lands on the same page. The base path
// comes from Vite, which lets the same build run at `/` locally and at
// `/<repository>/` on GitHub Pages.

export const BASE: string = import.meta.env.BASE_URL || '/';

export type Route =
  | { name: 'home' }
  | { name: 'wiki-index' }
  | { name: 'article'; slug: string }
  | { name: 'atlas' }
  | { name: 'chronology' }
  | { name: 'graph' }
  | { name: 'journeys' }
  | { name: 'journey'; id: string }
  | { name: 'view'; id: string }
  | { name: 'objects' }
  | { name: 'object'; id: string }
  | { name: 'learn' }
  | { name: 'archive' }
  | { name: 'sources' }
  | { name: 'field-guide' }
  | { name: 'search' }
  | { name: 'browse' }
  | { name: 'specimen' }
  | { name: 'about' }
  | { name: 'not-found'; path: string };

/** Turn an application path such as `/wiki/set/` into a full URL for the host. */
export function href(path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const [pathname, rest] = splitPath(path);
  return `${BASE}${pathname.replace(/^\//, '')}${rest}`;
}

function splitPath(path: string): [string, string] {
  const index = path.search(/[?#]/);
  return index === -1 ? [path, ''] : [path.slice(0, index), path.slice(index)];
}

/** Strip the base path off a browser pathname. */
export function toAppPath(pathname: string): string {
  const base = BASE.replace(/\/$/, '');
  let path = pathname;
  if (base && (path === base || path.startsWith(`${base}/`))) path = path.slice(base.length);
  if (!path.startsWith('/')) path = `/${path}`;
  if (!path.endsWith('/')) path = `${path}/`;
  return path.replace(/\/{2,}/g, '/');
}

export function parseRoute(pathname: string): Route {
  const path = toAppPath(pathname);
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return { name: 'home' };
  const [first, second] = segments;
  switch (first) {
    case 'wiki':
      return second ? { name: 'article', slug: second } : { name: 'wiki-index' };
    case 'atlas': return { name: 'atlas' };
    case 'chronology': return { name: 'chronology' };
    case 'graph': return { name: 'graph' };
    case 'journeys': return second ? { name: 'journey', id: second } : { name: 'journeys' };
    case 'views': return second ? { name: 'view', id: second } : { name: 'journeys' };
    case 'objects': return second ? { name: 'object', id: second } : { name: 'objects' };
    case 'learn': return { name: 'learn' };
    case 'archive': return second === 'sources' ? { name: 'sources' } : { name: 'archive' };
    case 'field-guide': return { name: 'field-guide' };
    case 'search': return { name: 'search' };
    case 'browse': return { name: 'browse' };
    case 'specimen': return { name: 'specimen' };
    case 'about': return { name: 'about' };
    default: return { name: 'not-found', path };
  }
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'home': return '/';
    case 'wiki-index': return '/wiki/';
    case 'article': return `/wiki/${route.slug}/`;
    case 'journey': return `/journeys/${route.id}/`;
    case 'view': return `/views/${route.id}/`;
    case 'object': return `/objects/${route.id}/`;
    case 'sources': return '/archive/sources/';
    case 'not-found': return route.path;
    default: return `/${route.name}/`;
  }
}
