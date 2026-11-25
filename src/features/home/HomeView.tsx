import { useMemo } from 'react';
import { href } from '../../app/routes';
import { Link, useApp } from '../../app/state';
import { allJourneys, allPages, allPaths } from '../../generated';
import { Card, CardGrid, Section } from '../../design-system/components';
import { Icon, OriginBadge } from '../../design-system';
import { sailingCompanion } from '../trip/itinerary';
import { HUB_GROUPS } from '../../app/sections';

export function HomeView() {
  const { preferences } = useApp();
  const recents = useMemo(
    () => preferences.recents.map((slug) => allPages.find((page) => page.slug === slug)).filter(Boolean).slice(0, 5),
    [preferences.recents],
  );

  return (
    <div className="page home">
      <section className="archive-landing" aria-labelledby="archive-title">
        <div className="archive-landing__intro">
          <span className="kicker">Ancient Egypt</span>
          <h1 id="archive-title">The Living Archive</h1>
          <p>Explore the places, beliefs, and objects that shaped life along the Nile. Start with the places we’ll visit or follow a question into the collection.</p>
          <div className="home__hero-actions">
            <Link className="archive-button archive-button--primary" to="/wiki/">Browse the encyclopedia</Link>
            <Link className="archive-button" to="/wiki/start-here/">Start here</Link>
          </div>
        </div>
        <Link className="archive-landing__feature" to={sailingCompanion}>
          <img src={href('/trip/silsila.webp')} alt="" width="768" height="512" />
          <div><span className="kicker">Illustrated journey</span><h2>Sailing south from Esna to Aswan</h2><p>Follow the places on our cruise.</p></div>
        </Link>
      </section>

      <nav className="archive-launchers" aria-label="Explore The Living Archive">
        <Link to="/atlas/"><Icon name="compass" /><strong>Atlas</strong><span>Find places along the Nile</span></Link>
        <Link to="/graph/"><Icon name="network" /><strong>Knowledge graph</strong><span>Trace a connection</span></Link>
        <Link to="/journeys/"><Icon name="water" /><strong>Journeys</strong><span>Explore a story step by step</span></Link>
        <Link to="/field-guide/"><Icon name="book" /><strong>Egypt field guide</strong><span>Know what to look for on site</span></Link>
      </nav>

      {recents.length > 0 && (
        <Section title="Where you left off">
          <ul className="inline-list">
            {recents.map((page) => <li key={page!.slug}><Link to={page!.route}>{page!.title}</Link></li>)}
          </ul>
        </Section>
      )}

      <Section title="Five ideas that hold the archive together" description="Each links to the article that develops it. The archive now moves from method and state formation to vulnerability, reception, and a living river.">
        <CardGrid>
          {['studying-religion-through-egypt', 'predynastic-egypt-and-state-formation', 'ritual-uncertainty-and-continuity', 'legacy-of-ancient-egypt', 'nile-travel-dahabiyas-and-changing-river']
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
              <OriginBadge origin={journey.origin} /> {journey.question}
            </Card>
          ))}
        </CardGrid>
      </Section>

      <Section title="Topic collections" description="Related articles grouped by subject.">
        <ul className="path-list">
          {allPaths.map((path) => (
            <li key={path.id}>
              <span className="path-list__head">
                <Link to={`/graph/?path=${path.id}`}><strong>{path.title}</strong></Link>
                <OriginBadge origin={path.origin} />
              </span>
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
