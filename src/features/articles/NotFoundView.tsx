// A useful 404 rather than a hosting error. The same file is written to
// `dist/404.html`, so GitHub Pages serves it for any unmatched path.

import { useMemo } from 'react';
import { Link } from '../../app/state';
import { allPages } from '../../generated';
import { PageHeader } from '../../design-system/components';
import { SearchPanel } from '../search/SearchDialog';

export function NotFoundView({ path }: { path: string }) {
  const guess = useMemo(() => {
    const words = path.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
    if (!words.length) return [];
    return allPages
      .map((page) => ({ page, score: words.filter((word) => page.slug.includes(word) || page.title.toLowerCase().includes(word)).length }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.page);
  }, [path]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Not found"
        title="There is no page at that address"
        lead={<>Nothing in the archive answers to <code>{path}</code>. It may have been renamed, or the link may have been mistyped.</>}
      />
      {guess.length > 0 && (
        <section className="stack-section">
          <h2>Did you mean one of these?</h2>
          <ul className="inline-list">
            {guess.map((page) => <li key={page.slug}><Link to={page.route}>{page.title}</Link></li>)}
          </ul>
        </section>
      )}
      <section className="stack-section">
        <h2>Search the archive</h2>
        <SearchPanel showFilters={false} />
      </section>
      <p><Link to="/">Return home</Link> · <Link to="/wiki/">Browse every article</Link></p>
    </div>
  );
}
