import { useMemo } from 'react';
import { Link, useApp } from '../../app/state';
import { allJourneys, allPages, allPaths, contentManifest } from '../../generated';
import { Card, CardGrid, Section } from '../../design-system/components';
import { HUB_GROUPS } from '../../app/sections';

export function HomeView() {
  const { preferences } = useApp();
  const recents = useMemo(
    () => preferences.recents.map((slug) => allPages.find((page) => page.slug === slug)).filter(Boolean).slice(0, 5),
    [preferences.recents],
  );

  return (
    <div className="page home">
      <section className="home__hero">
        <span className="kicker">Religion of Ancient Egypt · REL 395, Spring 2017</span>
        <h1>A three-thousand-year argument about keeping the world alive</h1>
        <p>
          Egyptian religion was not one creed held still for thirty centuries. It was a working system for maintaining
          order, presence, and continuity against collapse — and it kept changing. This archive holds{' '}
          {contentManifest.counts.pages} pages, {contentManifest.counts.sources} source groups, and{' '}
          {contentManifest.counts.edges} traced relationships, with the evidence for each claim kept in view.
        </p>
        <div className="home__hero-actions">
          <Link className="archive-button archive-button--primary" to="/wiki/start-here/">Start here</Link>
          <Link className="archive-button" to="/wiki/">Browse the encyclopedia</Link>
          <Link className="archive-button archive-button--quiet" to="/graph/">Open the graph</Link>
        </div>
      </section>

      {recents.length > 0 && (
        <Section title="Where you left off">
          <ul className="inline-list">
            {recents.map((page) => <li key={page!.slug}><Link to={page!.route}>{page!.title}</Link></li>)}
          </ul>
        </Section>
      )}

      <Section title="Five ideas that hold the archive together" description="Each links to the article that develops it.">
        <CardGrid>
          {['creation-traditions', 'how-egyptian-religion-works', 'heka-and-operative-ritual', 'temples-priests-and-offerings', 'personhood-and-the-afterlife']
            .map((slug) => allPages.find((page) => page.slug === slug))
            .filter(Boolean)
            .map((page) => (
              <Card key={page!.slug} to={page!.route} eyebrow={page!.type.replace(/-/g, ' ')} title={page!.title}>
                {page!.summary}
              </Card>
            ))}
        </CardGrid>
      </Section>

      <Section title="Guided experiences" description="Longer sequences that keep their sources and their limits visible.">
        <CardGrid>
          {allJourneys.map((journey) => (
            <Card key={journey.id} to={`/journeys/${journey.id}/`} eyebrow="Journey" title={journey.title}>
              {journey.question}
            </Card>
          ))}
        </CardGrid>
      </Section>

      <Section title="Knowledge paths" description="Short reading routes through the graph.">
        <ul className="path-list">
          {allPaths.map((path) => (
            <li key={path.id}>
              <Link to={`/graph/?path=${path.id}`}><strong>{path.title}</strong></Link>
              <p>{path.blurb}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Everything in the encyclopedia">
        <div className="hub-columns">
          {HUB_GROUPS.map((hub) => (
            <div key={hub.label}>
              <h3>{hub.label}</h3>
              <ul>
                {hub.slugs.map((slug) => {
                  const page = allPages.find((entry) => entry.slug === slug);
                  return page ? <li key={slug}><Link to={page.route}>{page.title}</Link></li> : null;
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
