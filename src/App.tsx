// Route dispatch. Everything above an article route is loaded eagerly because it
// is small; search, the graph, the atlas, the timeline, journeys, and object
// studies are lazy chunks so an ordinary article load stays inside its budget.

import { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp } from './app/state';
import { Shell } from './app/Shell';
import { ArticleView } from './features/articles/ArticleView';
import { AboutView, ArchiveView, FieldGuideView, LearnView, WikiIndexView } from './features/articles/IndexViews';
import { NotFoundView } from './features/articles/NotFoundView';
import { HomeView } from './features/home/HomeView';
import { SearchDialog, SearchView } from './features/search/SearchDialog';

const BrowseView = lazy(() => import('./features/browse/BrowseView').then((m) => ({ default: m.BrowseView })));
const AtlasView = lazy(() => import('./features/atlas/AtlasView').then((m) => ({ default: m.AtlasView })));
const ChronologyView = lazy(() => import('./features/chronology/ChronologyView').then((m) => ({ default: m.ChronologyView })));
const GraphView = lazy(() => import('./features/graph/GraphView').then((m) => ({ default: m.GraphView })));
const JourneysView = lazy(() => import('./features/journeys/JourneyView').then((m) => ({ default: m.JourneysView })));
const JourneyView = lazy(() => import('./features/journeys/JourneyView').then((m) => ({ default: m.JourneyView })));
const ObjectsView = lazy(() => import('./features/objects/ObjectsView').then((m) => ({ default: m.ObjectsView })));
const ObjectStudyView = lazy(() => import('./features/objects/ObjectsView').then((m) => ({ default: m.ObjectStudyView })));
const DecoderView = lazy(() => import('./features/objects/ObjectsView').then((m) => ({ default: m.DecoderView })));
const AlphabetView = lazy(() => import('./features/objects/AlphabetView').then((m) => ({ default: m.AlphabetView })));
const PersonhoodView = lazy(() => import('./features/visualizations/Visualizations').then((m) => ({ default: m.PersonhoodView })));
const CreationView = lazy(() => import('./features/visualizations/Visualizations').then((m) => ({ default: m.CreationView })));
const CorpusRiverView = lazy(() => import('./features/visualizations/Visualizations').then((m) => ({ default: m.CorpusRiverView })));
const SourcesView = lazy(() => import('./features/archive/SourcesView').then((m) => ({ default: m.SourcesView })));
const Specimen = lazy(() => import('./features/specimen/Specimen').then((m) => ({ default: m.Specimen })));

const TITLES: Record<string, string> = {
  home: 'The Living Archive',
  'wiki-index': 'Encyclopedia',
  atlas: 'Atlas',
  chronology: 'Chronology',
  graph: 'Knowledge graph',
  journeys: 'Journeys',
  view: 'Interactive view',
  objects: 'Objects and texts',
  learn: 'Learn',
  archive: 'Archive',
  sources: 'Source catalog',
  'field-guide': 'Field guide',
  search: 'Search',
  browse: 'Browse',
  specimen: 'Design system specimen',
  about: 'About',
  'not-found': 'Page not found',
};

function Routes() {
  const { route } = useApp();

  useEffect(() => {
    if (route.name === 'article' || route.name === 'journey') return;
    const title = TITLES[route.name];
    document.title = route.name === 'home' ? 'The Living Archive' : `${title} — The Living Archive`;
  }, [route]);

  // A route change should start the reader at the top of the new document.
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0 });
  }, [route]);

  const view = (() => {
    switch (route.name) {
      case 'home': return <HomeView />;
      case 'wiki-index': return <WikiIndexView />;
      case 'article': return <ArticleView slug={route.slug} />;
      case 'atlas': return <AtlasView />;
      case 'chronology': return <ChronologyView />;
      case 'graph': return <GraphView />;
      case 'journeys': return <JourneysView />;
      case 'journey': return <JourneyView id={route.id} />;
      case 'view':
        if (route.id === 'personhood') return <PersonhoodView />;
        if (route.id === 'creation') return <CreationView />;
        if (route.id === 'funerary-corpora') return <CorpusRiverView />;
        return <NotFoundView path={`/views/${route.id}/`} />;
      case 'objects': return <ObjectsView />;
      case 'object':
        if (route.id === 'decoder') return <DecoderView />;
        if (route.id === 'alphabet') return <AlphabetView />;
        return <ObjectStudyView id={route.id} />;
      case 'learn': return <LearnView />;
      case 'archive': return <ArchiveView />;
      case 'sources': return <SourcesView />;
      case 'field-guide': return <FieldGuideView />;
      case 'search': return <SearchView />;
      case 'browse': return <BrowseView />;
      case 'specimen': return <Specimen />;
      case 'about': return <AboutView />;
      default: return <NotFoundView path={route.path} />;
    }
  })();

  return <Suspense fallback={<div className="page"><p role="status" aria-live="polite">Loading…</p></div>}>{view}</Suspense>;
}

function Frame() {
  const { route } = useApp();
  // The design-system specimen is preserved as a standalone reference route. It
  // brings its own chrome and its own keyboard shortcuts, so wrapping it in the
  // application shell would give the page two of each.
  if (route.name === 'specimen') {
    return (
      <Suspense fallback={<div className="page"><p role="status" aria-live="polite">Loading…</p></div>}>
        <Specimen />
      </Suspense>
    );
  }
  return (
    <>
      <Shell>
        <Routes />
      </Shell>
      <SearchDialog />
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <Frame />
    </AppProvider>
  );
}
