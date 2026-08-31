// Hub routes that list pages: the encyclopedia index, Learn, Archive, and the
// field guide. They share one layout so the archive reads consistently.

import { Link } from '../../app/state';
import { allPages, allPaths, contentManifest, navigationSections } from '../../generated';
import { OriginBadge } from '../../design-system';
import { Card, CardGrid, EmptyState, PageHeader, Section } from '../../design-system/components';
import type { SectionId } from '../../types/content';
import { PreferencesPanel } from '../settings/Preferences';
import { ConceptChecks, RelearningPlan } from '../learn/StudyPlan';

function SectionHub({ id, eyebrow, lead }: { id: SectionId; eyebrow: string; lead: string }) {
  const section = navigationSections.find((entry) => entry.id === id);
  if (!section) return <EmptyState title="Nothing is listed for this section yet" />;
  return (
    <div className="page">
      <PageHeader eyebrow={eyebrow} title={section.label} lead={lead} />
      {section.groups.filter((group) => group.pages.length > 0).map((group) => (
        <Section key={group.label} title={group.label}>
          <CardGrid>
            {group.pages.map((page) => (
              <Card key={page.slug} to={page.route} title={page.title}>{page.summary}</Card>
            ))}
          </CardGrid>
        </Section>
      ))}
    </div>
  );
}

export function WikiIndexView() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Encyclopedia"
        title="Every article in the archive"
        lead={`${contentManifest.counts.pages} pages and about ${Math.round(contentManifest.counts.words / 1000)},000 words, arranged by subject and connected through the graph.`}
      />
      {navigationSections.find((section) => section.id === 'encyclopedia')?.groups.map((group) => (
        <Section key={group.label} title={group.label}>
          <ul className="index-list index-list--wide">
            {group.pages.map((page) => {
              const meta = allPages.find((entry) => entry.slug === page.slug);
              return (
                <li key={page.slug}>
                  <div>
                    <Link to={page.route}><strong>{page.title}</strong></Link>
                    <p>{page.summary}</p>
                  </div>
                  <span>{meta?.readingMinutes ?? 1} min</span>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}
      <Section title="Not listed above">
        <ul className="inline-list">
          {allPages
            .filter((page) => !navigationSections.some((section) => section.groups.some((group) => group.pages.some((entry) => entry.slug === page.slug))))
            .map((page) => <li key={page.slug}><Link to={page.route}>{page.title}</Link></li>)}
        </ul>
      </Section>
    </div>
  );
}

export function LearnView() {
  const section = navigationSections.find((entry) => entry.id === 'learn');
  return (
    <div className="page">
      <PageHeader
        eyebrow="Learn"
        title="Learn"
        lead="Short reading routes, a four-week plan, and concept checks for building a connected understanding of ancient Egyptian religion. Progress is stored in this browser only."
      />
      <RelearningPlan />
      <ConceptChecks />
      <Section title="Learning paths" description="Choose a question and follow a deliberate sequence. The graph view keeps every step available as a text route.">
        <CardGrid>
          {allPaths.map((path) => (
            <Card key={path.id} to={`/graph/?path=${path.id}`} eyebrow={<OriginBadge origin={path.origin} />} title={path.title} footer={`${path.steps.length} steps`}>
              {path.blurb}
            </Card>
          ))}
        </CardGrid>
      </Section>
      {section?.groups.filter((group) => group.pages.length > 0).map((group) => (
        <Section key={group.label} title={group.label}>
          <CardGrid>
            {group.pages.map((page) => <Card key={page.slug} to={page.route} title={page.title}>{page.summary}</Card>)}
          </CardGrid>
        </Section>
      ))}
    </div>
  );
}

export function ArchiveView() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Archive"
        title="Provenance and maintenance"
        lead="Where each claim came from, how deeply the sources were read, and which interpretations remain provisional."
      />
      <Section title="Start with the catalog">
        <CardGrid>
          <Card to="/archive/sources/" eyebrow="Reference" title="Source catalog">
            {contentManifest.counts.courseSources} course-source groups with stable C IDs, alongside the supplemental research registry.
          </Card>
          <Card to="/archive/sources/?catalog=research" eyebrow="Research registry" title="Supplemental research">
            {contentManifest.counts.researchSources} opened research records with stable R IDs, access notes, limitations, and reuse conditions. <OriginBadge origin="supplemental" />
          </Card>
        </CardGrid>
      </Section>
      {navigationSections.find((section) => section.id === 'archive')?.groups.map((group) => (
        <Section key={group.label} title={group.label}>
          <CardGrid>
            {group.pages.map((page) => <Card key={page.slug} to={page.route} title={page.title}>{page.summary}</Card>)}
          </CardGrid>
        </Section>
      ))}
    </div>
  );
}

export function FieldGuideView() {
  return <SectionHub id="field-guide" eyebrow="Field guide" lead="What to notice at sites and museums, with the visual decoder alongside. Travel logistics are deliberately excluded: they go stale and this archive does not check them." />;
}

export function AboutView() {
  return (
    <div className="page page--prose">
      <PageHeader eyebrow="About" title="What this is, and what it does with your data" />
      <div className="prose">
        <p>
          The Living Archive is a sourced guide to ancient Egyptian religion. Its written source of truth is a set of{' '}
          {contentManifest.counts.pages} Markdown documents. Everything the application shows is compiled from those
          documents and from a small set of reviewed data files at build time.
        </p>
        <h2>Privacy</h2>
        <p>
          There is no analytics, no advertising, no tracker, no account, and no remote font. The site is static files on
          GitHub Pages. Your theme, motion and sound preferences, bookmarks, recent pages, open tabs, and reading
          progress are stored in this browser's local storage and never leave it. Clearing site data removes all of it.
        </p>
        <h2>How to read the evidence labels</h2>
        <ul>
          <li><strong>Primary source</strong> — a modern translation or reproduction of an ancient text or image.</li>
          <li><strong>Scholarship</strong> — a modern scholarly account, named in the source catalog.</li>
          <li><strong>Archive synthesis</strong> — an interpretation assembled from the source collection, including archival notes. It is not scholarly consensus.</li>
          <li><strong>Artistic or contested</strong> — a reconstruction, or a claim the archive records without endorsing.</li>
        </ul>
        <h2>What this archive will not do</h2>
        <p>
          It will not present a single timeless Egyptian mind, treat research notes as authority, or use generated
          imagery as evidence. Reconstructions state their period, place, social position, evidence, and
          limits in the same view as the reconstruction itself.
        </p>
        <p>
          The immutable source files in <code>raw/</code> are not published. References to them appear as filenames
          rather than as links.
        </p>
        <p><Link to="/archive/">Go to the archive controls</Link></p>
      </div>
      <PreferencesPanel />
    </div>
  );
}
