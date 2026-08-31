// Guided experiences. Each one is a stepper: it works with a keyboard, it works
// with animation disabled, it is complete when muted, and it carries its
// evidence boundary in the same view as the narration.

import { useEffect, useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allJourneys, allPages, allPlaces } from '../../generated';
import { INTERACTIVE_VIEWS } from '../../app/views';
import { Button, OriginBadge } from '../../design-system';
import {
  Card, CardGrid, EmptyState, EvidenceRow, PageHeader, ReconstructionBoundary, Section, SourceList,
} from '../../design-system/components';

export function JourneysView() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Journeys"
        title="Guided sequences with their limits attached"
        lead="Each journey names its period, its place, the evidence it rests on, and the point where the sources stop. None of them animates anything essential: the stepper and the text carry the whole argument."
      />
      <CardGrid>
        {allJourneys.map((journey) => (
          <Card key={journey.id} to={`/journeys/${journey.id}/`} eyebrow={journey.period} title={journey.title} footer={<><OriginBadge origin={journey.origin} /> <span>{journey.scenes.length} steps</span></>}>
            {journey.question}
          </Card>
        ))}
      </CardGrid>

      <Section title="Interactive views" description="Generated from the archive's own tables, so a view and the article behind it cannot drift apart.">
        <CardGrid>
          {INTERACTIVE_VIEWS.map((view) => (
            <Card key={view.id} to={`/views/${view.id}/`} eyebrow="Interactive view" title={view.title}>{view.blurb}</Card>
          ))}
        </CardGrid>
      </Section>
    </div>
  );
}

export function JourneyView({ id }: { id: string }) {
  const { prefersReducedMotion, preferences, setProgress } = useApp();
  const journey = useMemo(() => allJourneys.find((entry) => entry.id === id) ?? null, [id]);
  const [step, setStep] = useState(0);

  useEffect(() => { setStep(0); }, [id]);
  useEffect(() => {
    if (!journey) return;
    document.title = `${journey.title} — The Living Archive`;
  }, [journey]);

  useEffect(() => {
    if (!journey) return;
    const key = `journey:${journey.id}`;
    const seen = new Set(preferences.progress[key] ?? []);
    const sceneId = journey.scenes[step]?.id;
    if (sceneId && !seen.has(sceneId)) setProgress(key, [...seen, sceneId]);
    // Progress is intentionally write-only here: reading it on every step would
    // re-run this effect continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey, step]);

  const moveToStep = (index: number, focus = false) => {
    const next = Math.max(0, Math.min(journey?.scenes.length ? journey.scenes.length - 1 : 0, index));
    setStep(next);
    if (focus && journey) {
      window.requestAnimationFrame(() => document.getElementById(`journey-tab-${journey.scenes[next].id}`)?.focus());
    }
  };

  if (!journey) {
    return <div className="page"><EmptyState title="That journey is not in the archive"><Link to="/journeys/">See all journeys</Link></EmptyState></div>;
  }

  const scene = journey.scenes[step];
  const completed = (preferences.progress[`journey:${journey.id}`] ?? []).length;

  return (
    <div className="page journey">
      <PageHeader
        eyebrow="Journey"
        title={journey.title}
        lead={journey.question}
        meta={<><span>{journey.place}</span><span>{journey.period}</span><span>{journey.scenes.length} steps</span><span>{completed} seen</span></>}
      />

      <div className="journey__provenance"><OriginBadge origin={journey.origin} /><span>{journey.origin === 'supplemental' ? 'A contemporary, research-led route with itinerary boundaries.' : 'A course-derived historical sequence.'}</span></div>
      {journey.includedScope && <p className="journey__scope"><strong>Included route:</strong> {journey.includedScope}</p>}
      {journey.optionalExtensions && <aside className="archive-callout archive-callout--uncertainty"><span className="archive-callout__label">Separate optional extensions</span><p>{journey.optionalExtensions}</p></aside>}

      <div className="journey__frame">
        <nav className="journey__steps" aria-label="Journey steps">
          <ol role="tablist" aria-label="Journey stages">
            {journey.scenes.map((entry, index) => (
              <li key={entry.id} role="presentation">
                <button
                  id={`journey-tab-${entry.id}`}
                  type="button"
                  role="tab"
                  className={index === step ? 'is-current' : ''}
                  aria-selected={index === step}
                  aria-current={index === step ? 'step' : undefined}
                  aria-controls="journey-panel"
                  aria-setsize={journey.scenes.length}
                  aria-posinset={index + 1}
                  tabIndex={index === step ? 0 : -1}
                  aria-label={`Stage ${index + 1} of ${journey.scenes.length}, day ${entry.day ?? index + 1}, ${entry.stopType?.replace(/-/g, ' ') ?? 'journey stop'}: ${entry.title}`}
                  onClick={() => moveToStep(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); moveToStep(index + 1, true); }
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); moveToStep(index - 1, true); }
                    if (event.key === 'Home') { event.preventDefault(); moveToStep(0, true); }
                    if (event.key === 'End') { event.preventDefault(); moveToStep(journey.scenes.length - 1, true); }
                  }}
                >
                  <span className="journey__step-number">{index + 1}</span>
                  <span>{entry.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="journey__panel">
        <div className="journey__status" role="status" aria-live="polite">Stage {step + 1} of {journey.scenes.length}: {scene.title}. Day {scene.day ?? step + 1}; {scene.stopType?.replace(/-/g, ' ') ?? 'journey stop'}{scene.place ? `; ${scene.place}` : ''}. {scene.sourcePages?.length ?? 0} linked reading {scene.sourcePages?.length === 1 ? 'page' : 'pages'}.</div>
        <div className={`journey__scene ${prefersReducedMotion ? 'is-static' : ''}`} key={scene.id} id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${scene.id}`} tabIndex={-1}>
          <span className="kicker">{scene.kicker}</span>
          <h2>{scene.title}</h2>
          <EvidenceRow
            evidence={scene.evidence}
            origin={journey.origin}
            meta={<>{scene.day && <span>Day {scene.day}</span>}{scene.stopType && <span>{scene.stopType.replace(/-/g, ' ')}</span>}{scene.corpus && <span>{scene.corpus}</span>}{scene.place && <span>{scene.place}</span>}</>}
          />
          <p className="journey__body">{scene.body}</p>
          {scene.detail && scene.detail.length > 0 && (
            <ul className="journey__detail">{scene.detail.map((line, index) => <li key={index}>{line}</li>)}</ul>
          )}
          {scene.sourceIds.length > 0 && <SourceList ids={scene.sourceIds} />}
          {scene.sourcePages && scene.sourcePages.length > 0 && (
            <div className="journey__context">
              <strong>Read alongside this stage</strong>
              <ul className="inline-list">{scene.sourcePages.map((slug) => { const page = allPages.find((entry) => entry.slug === slug); return page ? <li key={slug}><Link to={page.route}>{page.title}</Link></li> : null; })}</ul>
            </div>
          )}
          {scene.reflection && <p className="journey__reflection"><strong>Pause and reflect:</strong> {scene.reflection}</p>}

          <div className="journey__controls">
            <Button onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Previous</Button>
            <span>{step + 1} of {journey.scenes.length}</span>
            <Button variant="primary" onClick={() => setStep((current) => Math.min(journey.scenes.length - 1, current + 1))} disabled={step === journey.scenes.length - 1}>Next</Button>
          </div>
        </div>
        </div>
      </div>

      <ReconstructionBoundary
        period={journey.period}
        place={journey.place}
        evidence={journey.evidenceBoundary}
        reconstruction={journey.reconstruction}
        sources={journey.sourceIds}
      />

      <JourneyRouteMap journey={journey} />

      <Section title="The whole journey as text" description={journey.accessibleSummary}>
        <ol className="journey__transcript">
          {journey.scenes.map((entry) => (
            <li key={entry.id}>
              <h3>{entry.title}</h3>
              <p className="muted">{entry.kicker}{entry.corpus ? ` · ${entry.corpus}` : ''}</p>
              <p className="muted">Stage {journey.scenes.indexOf(entry) + 1} · Day {entry.day ?? journey.scenes.indexOf(entry) + 1} · {entry.stopType?.replace(/-/g, ' ') ?? 'journey stop'}{entry.place ? ` · ${entry.place}` : ''}</p>
              <p>{entry.body}</p>
              {entry.detail && <ul>{entry.detail.map((line, index) => <li key={index}>{line}</li>)}</ul>}
              {entry.sourceIds.length > 0 && <SourceList ids={entry.sourceIds} />}
              {entry.sourcePages && entry.sourcePages.length > 0 && <ul className="inline-list">{entry.sourcePages.map((slug) => { const page = allPages.find((item) => item.slug === slug); return page ? <li key={slug}><Link to={page.route}>{page.title}</Link></li> : null; })}</ul>}
              {entry.reflection && <p><strong>Pause and reflect:</strong> {entry.reflection}</p>}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Read the articles behind this">
        <ul className="inline-list">
          {journey.sourcePages.map((slug) => {
            const page = allPages.find((entry) => entry.slug === slug);
            return page ? <li key={slug}><Link to={page.route}>{page.title}</Link></li> : null;
          })}
        </ul>
      </Section>
    </div>
  );
}

// One journey covers a fraction of the country, so the sketch is cropped to its
// own stops rather than drawn on a full-Egypt frame where they collapse into a
// corner. Marker, label, and stroke sizes are derived from the crop, because a
// fixed user-unit size renders differently once the frame changes scale.
function routeFrame(places: { x: number; y: number }[]) {
  const xs = places.map((place) => place.x);
  const ys = places.map((place) => place.y);
  const pad = 8;
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;
  // Hold the frame near the shape of the column it renders in. A north-south
  // route would otherwise letterbox inside a wide box, and the spare width is
  // what the side labels need anyway.
  const ratio = 1.4;
  const width = maxX - minX;
  const height = maxY - minY;
  if (width / height < ratio) {
    const grow = (height * ratio - width) / 2;
    minX -= grow; maxX += grow;
  } else {
    const grow = (width / ratio - height) / 2;
    minY -= grow; maxY += grow;
  }
  const unit = Math.max(maxX - minX, maxY - minY);
  return {
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    unit,
    marker: unit * 0.018,
    label: unit * 0.028,
  };
}

/** A public-location route sketch. Unnamed or private scenes intentionally do not become markers. */
function JourneyRouteMap({ journey }: { journey: (typeof allJourneys)[number] }) {
  const stops = journey.scenes.map((scene, index) => {
    if (!scene.place) return null;
    const place = allPlaces.find((entry) => (entry.visibility ?? 'public') === 'public' && (entry.id === scene.place || entry.label.toLowerCase() === scene.place?.toLowerCase()));
    return place ? { scene, place, index } : null;
  }).filter(Boolean) as { scene: (typeof journey.scenes)[number]; place: (typeof allPlaces)[number]; index: number }[];
  if (stops.length < 2) return null;
  const points = stops.map(({ place }) => `${place.x},${place.y}`).join(' ');
  const frame = routeFrame(stops.map(({ place }) => place));
  return (
    <Section title="Public route sketch" description="The line follows the ordered public locations recorded for this journey. Scenes without a verified public place remain in the transcript and are not pinned.">
      <div className="journey-route">
        <svg className="journey-route__map" viewBox={frame.viewBox} role="img" aria-labelledby="journey-route-title journey-route-description">
          <title id="journey-route-title">Public locations along {journey.title}</title>
          <desc id="journey-route-description">A southbound schematic route through {stops.map(({ place }) => place.label).join(', ')}.</desc>
          <path className="journey-route__river" d="M50 2 C 46 24, 54 40, 48 56 C 44 70, 54 82, 50 100" style={{ strokeWidth: frame.unit * 0.013 }} />
          <polyline className="journey-route__line" points={points} style={{ strokeWidth: frame.unit * 0.008, strokeDasharray: `${frame.unit * 0.02} ${frame.unit * 0.01}` }} />
          {stops.map(({ scene, place, index }) => {
            // Labels alternate sides so consecutive stops on a nearly straight
            // north-south line do not print on top of one another.
            const toLeft = index % 2 === 1;
            return (
              <g key={`${scene.id}-${place.id}`} className="journey-route__stop">
                <circle cx={place.x} cy={place.y} r={frame.marker} style={{ strokeWidth: frame.unit * 0.0035 }} />
                <text
                  x={place.x + (toLeft ? -frame.marker * 1.7 : frame.marker * 1.7)}
                  y={place.y + frame.label * 0.35}
                  textAnchor={toLeft ? 'end' : 'start'}
                  style={{ fontSize: frame.label }}
                >
                  {index + 1}. {place.label}
                </text>
              </g>
            );
          })}
        </svg>
        <ol className="journey-route__list">
          {stops.map(({ scene, place, index }) => <li key={`${scene.id}-${place.id}`}><strong>Stage {index + 1}: {place.label}</strong><span>{scene.title}</span></li>)}
        </ol>
      </div>
    </Section>
  );
}
