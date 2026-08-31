// Guided experiences. Each one is a stepper: it works with a keyboard, it works
// with animation disabled, it is complete when muted, and it carries its
// evidence boundary in the same view as the narration.

import { useEffect, useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allJourneys, allPages } from '../../generated';
import { INTERACTIVE_VIEWS } from '../../app/views';
import { Button } from '../../design-system';
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
          <Card key={journey.id} to={`/journeys/${journey.id}/`} eyebrow={journey.period} title={journey.title} footer={<span>{journey.scenes.length} steps</span>}>
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

      <div className="journey__frame">
        <nav className="journey__steps" aria-label="Journey steps">
          <ol>
            {journey.scenes.map((entry, index) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={index === step ? 'is-current' : ''}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => setStep(index)}
                >
                  <span className="journey__step-number">{index + 1}</span>
                  <span>{entry.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className={`journey__scene ${prefersReducedMotion ? 'is-static' : ''}`} key={scene.id} aria-live="polite">
          <span className="kicker">{scene.kicker}</span>
          <h2>{scene.title}</h2>
          <EvidenceRow
            evidence={scene.evidence}
            meta={<>{scene.corpus && <span>{scene.corpus}</span>}{scene.place && <span>{scene.place}</span>}</>}
          />
          <p className="journey__body">{scene.body}</p>
          {scene.detail && scene.detail.length > 0 && (
            <ul className="journey__detail">{scene.detail.map((line, index) => <li key={index}>{line}</li>)}</ul>
          )}
          {scene.sourceIds.length > 0 && <SourceList ids={scene.sourceIds} />}

          <div className="journey__controls">
            <Button onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Previous</Button>
            <span>{step + 1} of {journey.scenes.length}</span>
            <Button variant="primary" onClick={() => setStep((current) => Math.min(journey.scenes.length - 1, current + 1))} disabled={step === journey.scenes.length - 1}>Next</Button>
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

      <Section title="The whole journey as text" description={journey.accessibleSummary}>
        <ol className="journey__transcript">
          {journey.scenes.map((entry) => (
            <li key={entry.id}>
              <h3>{entry.title}</h3>
              <p className="muted">{entry.kicker}{entry.corpus ? ` · ${entry.corpus}` : ''}</p>
              <p>{entry.body}</p>
              {entry.detail && <ul>{entry.detail.map((line, index) => <li key={index}>{line}</li>)}</ul>}
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
