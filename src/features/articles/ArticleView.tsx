// The encyclopedia reading route. Article payloads are split per page and loaded
// on demand, so an ordinary article route never downloads the search index, the
// full graph, or another page's body.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArticlePayload } from '../../types/content';
import { Blocks } from './Blocks';
import { Link, useApp } from '../../app/state';
import { contentManifest, allPages } from '../../generated';
import { HUB_GROUPS, sectionLabel } from '../../app/sections';
import {
  Backlinks, Breadcrumbs, EvidenceRow, RelatedPages, SourceList, TableOfContents,
} from '../../design-system/components';
import { Button, Icon } from '../../design-system';
import { NeighborhoodGraph } from '../graph/NeighborhoodGraph';

const loaders = import.meta.glob<{ default: ArticlePayload }>('../../generated/articles/*.json');

export function loadArticle(slug: string): Promise<ArticlePayload> | null {
  const loader = loaders[`../../generated/articles/${slug}.json`];
  if (!loader) return null;
  return loader().then((module) => module.default);
}

export function ArticleView({ slug }: { slug: string }) {
  const { hash, openTab, preferences, toggleBookmark } = useApp();
  const [article, setArticle] = useState<ArticlePayload | null>(null);
  const [error, setError] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setArticle(null);
    setError(false);
    const promise = loadArticle(slug);
    if (!promise) { setError(true); return; }
    promise.then((payload) => { if (!cancelled) setArticle(payload); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} — The Living Archive`;
    openTab({ slug: article.slug, title: article.title });
  }, [article, openTab]);

  // Move focus and scroll to a section when the URL carries a fragment.
  useEffect(() => {
    if (!article || !hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: preferences.reducedMotion === 'reduce' ? 'auto' : 'smooth', block: 'start' });
    (target as HTMLElement).focus({ preventScroll: true });
  }, [article, hash, preferences.reducedMotion]);

  // Reading position indicator, driven by which heading is currently on screen.
  useEffect(() => {
    if (!article || !bodyRef.current) return;
    const headings = Array.from(bodyRef.current.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px' },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [article]);

  const siblings = useMemo(() => {
    const group = HUB_GROUPS.find((hub) => hub.slugs.includes(slug));
    if (!group) return { previous: null, next: null, label: null };
    const index = group.slugs.indexOf(slug);
    const at = (position: number) => {
      const target = group.slugs[position];
      const page = allPages.find((entry) => entry.slug === target);
      return page ? { title: page.title, route: page.route } : null;
    };
    return { previous: at(index - 1), next: at(index + 1), label: group.label };
  }, [slug]);

  if (error) {
    return (
      <div className="article-missing">
        <h1>That article is not in the archive</h1>
        <p>
          The wiki holds {contentManifest.counts.pages} pages. <Link to="/wiki/">Browse the index</Link> or{' '}
          <Link to="/search/">search the archive</Link>.
        </p>
      </div>
    );
  }

  if (!article) {
    return <div className="article-loading" role="status" aria-live="polite">Loading article…</div>;
  }

  const bookmarked = preferences.bookmarks.includes(article.slug);
  const repository = contentManifest.repositoryUrl;

  return (
    <article className="article" aria-labelledby="article-title">
      <Breadcrumbs
        trail={[
          { label: 'Home', to: '/' },
          { label: sectionLabel(article.meta.section), to: article.meta.section === 'encyclopedia' ? '/wiki/' : `/${article.meta.section}/` },
          { label: article.title },
        ]}
      />

      <header className="article__header">
        <h1 id="article-title">{article.title}</h1>
        {article.meta.summary && <p className="article__summary">{article.meta.summary}</p>}
        <EvidenceRow
          evidence={article.meta.evidence}
          meta={
            <>
              <span className="article__type">{article.meta.type.replace(/-/g, ' ')}</span>
              <span>{article.meta.readingMinutes} min read</span>
              {article.meta.updated && <span>Updated {article.meta.updated}</span>}
            </>
          }
        />
        {article.meta.tags.length > 0 && (
          <ul className="tag-list" aria-label="Tags">
            {article.meta.tags.map((tag) => <li key={tag}><Link to={`/browse/?tag=${encodeURIComponent(tag)}`}>{tag}</Link></li>)}
          </ul>
        )}
        <div className="article__actions">
          <Button variant={bookmarked ? 'primary' : 'default'} aria-pressed={bookmarked} onClick={() => toggleBookmark(article.slug)}>
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
          <Button onClick={() => { void navigator.clipboard?.writeText(window.location.href); }}>Copy link</Button>
          {repository && (
            <a className="archive-button archive-button--quiet" href={`${repository}/blob/main/${article.sourcePath}`} target="_blank" rel="noreferrer noopener">
              View Markdown source
            </a>
          )}
        </div>
      </header>

      <div className="article__layout">
        <div className="article__aside">
          <TableOfContents headings={article.toc} activeId={activeHeading} />
        </div>

        <div className="article__body" ref={bodyRef}>
          <Blocks blocks={article.blocks} />

          {article.sourceIds.length > 0 && (
            <section className="article__section" aria-labelledby="article-sources">
              <h2 id="article-sources">Sources cited on this page</h2>
              <SourceList ids={article.sourceIds} />
            </section>
          )}

          {article.related.length > 0 && (
            <section className="article__section" aria-labelledby="article-related">
              <h2 id="article-related">Related pages</h2>
              <RelatedPages items={article.related} />
            </section>
          )}

          <section className="article__section" aria-labelledby="article-graph">
            <h2 id="article-graph">Nearby in the graph</h2>
            <NeighborhoodGraph slice={article.neighborhood} originId={`page:${article.slug}`} />
          </section>

          <section className="article__section" aria-labelledby="article-backlinks">
            <h2 id="article-backlinks">What links here</h2>
            <Backlinks items={article.backlinks} />
          </section>

          {(siblings.previous || siblings.next) && (
            <nav className="article__pager" aria-label={`Within ${siblings.label}`}>
              {siblings.previous
                ? <Link className="article__pager-link" to={siblings.previous.route}><Icon name="compass" /><span><small>Previous</small>{siblings.previous.title}</span></Link>
                : <span />}
              {siblings.next && (
                <Link className="article__pager-link article__pager-link--next" to={siblings.next.route}>
                  <span><small>Next</small>{siblings.next.title}</span><Icon name="compass" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </article>
  );
}
