// Learn: the four-week plan as a checklist and topic-based concept checks.
// Both are generated from the wiki pages and store progress in this browser only.

import { useMemo, useState } from 'react';
import { Link, useApp } from '../../app/state';
import { allPages, visualizationData } from '../../generated';
import { Button } from '../../design-system';
import { Section } from '../../design-system/components';

function useChecklist(key: string) {
  const { preferences, setProgress } = useApp();
  const done = useMemo(() => new Set(preferences.progress[key] ?? []), [preferences.progress, key]);
  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id); else next.add(id);
    setProgress(key, [...next]);
  };
  return { done, toggle, clear: () => setProgress(key, []) };
}

export function RelearningPlan() {
  const { weeks } = visualizationData;
  const { done, toggle, clear } = useChecklist('four-week-plan');
  const total = weeks.reduce((count, week) => count + week.steps.length, 0);
  const page = allPages.find((entry) => entry.slug === 'four-week-relearning-plan');

  if (!weeks.length) return null;

  return (
    <Section
      title="Four-week learning plan"
      description={<>A route back through the material, generated from <Link to={page?.route ?? '/learn/'}>the plan page</Link>. Progress is kept in this browser and nowhere else.</>}
    >
      <p className="progress-line" role="status">
        <strong>{done.size} of {total}</strong> steps done.
        {done.size > 0 && <> <Button variant="quiet" onClick={clear}>Reset progress</Button></>}
      </p>
      <div className="plan-weeks">
        {weeks.map((week) => {
          const complete = week.steps.filter((step) => done.has(step.id)).length;
          return (
            <article key={week.id} className="plan-week">
              <header>
                <h3>{week.title}</h3>
                <span className="muted">{complete}/{week.steps.length}</span>
              </header>
              <ul className="plan-week__steps">
                {week.steps.map((step) => (
                  <li key={step.id}>
                    <label>
                      <input type="checkbox" checked={done.has(step.id)} onChange={() => toggle(step.id)} />
                      <span>{step.text}</span>
                    </label>
                    {step.slugs.length > 0 && (
                      <span className="plan-week__links">
                        {step.slugs.map((slug) => {
                          const target = allPages.find((entry) => entry.slug === slug);
                          return target ? <Link key={slug} to={target.route}>{target.title}</Link> : null;
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {week.checkpoint && <p className="plan-week__checkpoint"><strong>Checkpoint:</strong> {week.checkpoint}</p>}
            </article>
          );
        })}
      </div>
    </Section>
  );
}

export function ConceptChecks() {
  const { checks } = visualizationData;
  const [revealed, setRevealed] = useState<string[]>([]);

  if (!checks.length) return null;

  return (
    <Section
      title="Concept checks"
      description={<>Try to answer before revealing. These prompts revisit the ideas that connect the archive's major subjects.</>}
    >
      <div className="check-list">
        {checks.map((check) => {
          const open = revealed.includes(check.id);
          return (
            <article key={check.id} className="check-block">
              <h3>{check.title}</h3>
              {check.lead && <p className="muted">{check.lead}</p>}
              <Button
                aria-expanded={open}
                onClick={() => setRevealed((current) => (open ? current.filter((id) => id !== check.id) : [...current, check.id]))}
              >
                {open ? 'Hide the prompts' : `Reveal ${check.prompts.length} prompts`}
              </Button>
              {open && (
                <>
                  <ul className="check-block__prompts">
                    {check.prompts.map((prompt, index) => <li key={index}>{prompt}</li>)}
                  </ul>
                  {check.caution && (
                    <aside className="archive-callout archive-callout--contested">
                      <span className="archive-callout__label">Interpretive caution</span>
                      <p>{check.caution}</p>
                    </aside>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
