// Reusable pieces built on top of the design system's primitives. Anything that
// appears on more than one feature screen lives here so it keeps one keyboard
// behaviour, one narrow-layout treatment, and one set of accessible names.

import {
  useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode,
} from 'react';
import { Button, EvidenceBadge, Icon, OriginBadge, type EvidenceKind } from './index';
import { Link } from '../app/state';
import { loadSourceRecords } from '../app/contentLoaders';
import { allMedia } from '../generated';
import { BASE } from '../app/routes';
import type { Backlink, CalloutKind, ContentOrigin, HeadingRef, MediaRecord, RelatedPage, EdgeType, SourceEntry } from '../types/content';

/* ------------------------------------------------------------------ layout */

export function PageHeader({
  eyebrow, title, lead, meta, actions,
}: { eyebrow: ReactNode; title: string; lead?: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <span className="kicker">{eyebrow}</span>
      <h1>{title}</h1>
      {lead && <p className="page-header__lead">{lead}</p>}
      {meta && <div className="page-header__meta">{meta}</div>}
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((item, index) => (
          <li key={index}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Section({ title, description, children, id }: { title: string; description?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="stack-section" id={id}>
      <h2>{title}</h2>
      {description && <p className="stack-section__description">{description}</p>}
      {children}
    </section>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="card-grid">{children}</div>;
}

export function Card({
  to, eyebrow, title, children, badge, footer,
}: { to?: string; eyebrow?: ReactNode; title: string; children?: ReactNode; badge?: ReactNode; footer?: ReactNode }) {
  const body = (
    <>
      {eyebrow && <span className="kicker">{eyebrow}</span>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {badge && <div className="card__badge">{badge}</div>}
      {footer && <div className="card__footer">{footer}</div>}
    </>
  );
  return to ? <Link className="card card--link" to={to}>{body}</Link> : <div className="card">{body}</div>;
}

/* ------------------------------------------------------------- article bits */

export function TableOfContents({ headings, activeId }: { headings: HeadingRef[]; activeId: string | null }) {
  const [open, setOpen] = useState(true);
  if (!headings.length) return null;
  return (
    <nav className="toc" aria-labelledby="toc-title">
      <div className="toc__head">
        <h2 id="toc-title">On this page</h2>
        <Button variant="quiet" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</Button>
      </div>
      {open && (
        <ol className="toc__list">
          {headings.map((heading) => (
            <li key={heading.id} className={`toc__item toc__item--level-${heading.level}`}>
              <a href={`#${heading.id}`} aria-current={activeId === heading.id ? 'true' : undefined}>{heading.text}</a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

const RELATION_LABELS: Record<EdgeType, string> = {
  links_to: 'Links here',
  draws_from: 'Draws from',
  part_of: 'Part of',
  appears_in: 'Appears in',
  associated_with: 'Associated with',
  practiced_at: 'Practised at',
  changes_during: 'Changes during',
  precedes: 'Precedes',
  maintains: 'Maintains',
  threatens: 'Threatens',
  restores: 'Restores',
  contrasts_with: 'Contrasts with',
  contested_by: 'Contested by',
  depicted_in: 'Depicted in',
  transmitted_through: 'Transmitted through',
  adapted_by: 'Adapted by',
  reinterpreted_by: 'Reinterpreted by',
  manifested_in: 'Manifested in',
  encountered_at: 'Encountered at',
};

export function relationLabel(type: EdgeType): string {
  return RELATION_LABELS[type] ?? type;
}

export function Backlinks({ items }: { items: Backlink[] }) {
  if (!items.length) return <p className="muted">No other page links here yet.</p>;
  const groups = new Map<EdgeType, Backlink[]>();
  for (const item of items) {
    groups.set(item.relation, [...(groups.get(item.relation) ?? []), item]);
  }
  return (
    <div className="backlinks">
      {[...groups].map(([relation, list]) => (
        <div key={relation} className="backlinks__group">
          <h3>{relationLabel(relation)}</h3>
          <ul>
            {list.map((item) => (
              <li key={item.slug}>
                <Link to={item.route}>{item.title}</Link>
                {item.contexts.length > 0 && <span className="backlinks__context"> — from “{item.contexts.slice(0, 2).join('”, “')}”</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RelatedPages({ items }: { items: RelatedPage[] }) {
  if (!items.length) return null;
  return (
    <ul className="related-list">
      {items.map((item) => (
        <li key={item.slug}>
          <Link to={item.route}><strong>{item.title}</strong></Link>
          <span className="related-list__relation">{relationLabel(item.relation)}</span>
          <p>{item.note ?? item.summary}</p>
        </li>
      ))}
    </ul>
  );
}

function useSourceRecords(): SourceEntry[] | null {
  const [records, setRecords] = useState<SourceEntry[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadSourceRecords().then((value) => { if (!cancelled) setRecords(value); });
    return () => { cancelled = true; };
  }, []);
  return records;
}

export function SourceList({ ids, idPrefix }: { ids: string[]; idPrefix?: string }) {
  const sourceRecords = useSourceRecords();
  if (!ids.length) return null;
  if (!sourceRecords) {
    return <ul className="source-list" aria-label="Sources cited"><li><span className="source-list__id">{ids.join(', ')}</span><div>Loading source records…</div></li></ul>;
  }
  const entries = ids.map((id) => ({ id, source: sourceRecords.find((source) => source.id === id) }));
  return (
    <ul className="source-list">
      {entries.map(({ id, source }) => (
        <li key={id} id={idPrefix ? `${idPrefix}-${id.toLowerCase()}` : undefined}>
          {source ? <Link to={sourceHref(source.origin, id)} className="source-list__id">{id}</Link> : <span className="source-list__id">{id}</span>}
          <div>
            {source ? <>
              <strong>{source.title}</strong>
              <span className="source-list__badges"><OriginBadge origin={source.origin} />{source.sourceClass && <span className="source-list__class">{source.sourceClass}</span>}</span>
              {source.status && <span className="source-list__status">{source.status}</span>}
            </> : <strong>Source record unavailable</strong>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function sourceHref(origin: 'course' | 'supplemental', id: string): string {
  return `/archive/sources/${origin === 'supplemental' ? '?catalog=research' : ''}#${id.toLowerCase()}`;
}

/**
 * An inline definition for the first use of a glossary term. It is a real
 * `<details>`-free disclosure: the definition is in the DOM, reachable by
 * keyboard, and readable by a screen reader whether or not it is expanded.
 */
export function TermDefinition({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>();

  useLayoutEffect(() => {
    if (!open) { setPopupStyle(undefined); return; }
    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const width = Math.min(384, window.innerWidth - 32);
      const height = bodyRef.current?.getBoundingClientRect().height ?? 80;
      const left = Math.min(Math.max(16, trigger.left), Math.max(16, window.innerWidth - width - 16));
      const below = trigger.bottom + 8;
      const top = below + height <= window.innerHeight - 16 ? below : Math.max(16, trigger.top - height - 8);
      setPopupStyle({
        '--term-popup-left': `${left}px`,
        '--term-popup-top': `${top}px`,
        '--term-popup-width': `${width}px`,
      } as React.CSSProperties);
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={`term-definition ${open ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="term-definition__trigger"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {term}
      </button>
      <span ref={bodyRef} id={id} className="term-definition__body" style={popupStyle} role="note" hidden={!open}>
        {definition}. <Link to="/wiki/glossary/">Glossary</Link>
      </span>
    </span>
  );
}

export function Citation({ id }: { id: string }) {
  const source = useSourceRecords()?.find((entry) => entry.id === id);
  if (!source) return <span>{id}</span>;
  return <Link className="citation" to={sourceHref(source.origin, id)} title={source.title}>{id}</Link>;
}

/* ------------------------------------------------------- evidence and rights */

export function EvidenceCallout({ kind, label, children }: { kind: CalloutKind; label: string; children: ReactNode }) {
  const defaultLabels: Record<CalloutKind, string> = {
    evidence: 'Evidence',
    uncertainty: 'Uncertainty',
    contested: 'Contested interpretation',
    note: 'Note',
    reconstruction: 'Reconstruction',
    research: 'Supplemental research',
  };
  return (
    <aside className={`archive-callout archive-callout--${kind}`}>
      <span className="archive-callout__label">{label || defaultLabels[kind]}</span>
      {children}
    </aside>
  );
}

export function ReconstructionBoundary({
  period, place, evidence, reconstruction, sources,
}: { period: string; place: string; evidence: string; reconstruction: string; sources: string[] }) {
  return (
    <aside className="reconstruction" aria-labelledby="reconstruction-title">
      <h2 id="reconstruction-title">How this was reconstructed</h2>
      <dl>
        <div><dt>Period</dt><dd>{period}</dd></div>
        <div><dt>Place</dt><dd>{place}</dd></div>
        <div><dt>Evidence boundary</dt><dd>{evidence}</dd></div>
        <div><dt>Method</dt><dd>{reconstruction}</dd></div>
      </dl>
      <SourceList ids={sources} />
    </aside>
  );
}

export function RightsCredit({ media }: { media: MediaRecord }) {
  return (
    <p className="rights-credit">
      <span>{media.attribution}</span>
      {media.institution && <span> · {media.institution}</span>}
      {media.objectId && <span> · {media.objectId}</span>}
      <span> · {media.license}</span>
      {media.source.startsWith('http')
        ? <> · <a href={media.source} target="_blank" rel="noreferrer noopener">Source record<span className="sr-only"> (opens in a new tab)</span></a></>
        : <> · {media.source}</>}
    </p>
  );
}

/**
 * Media is addressed by manifest ID, never by file path. An unregistered or
 * uncleared ID renders a visible placeholder instead of a broken image, so a
 * rights gap shows up in the page rather than in a console.
 */
export function MediaFigure({ id, sizes = '(min-width: 900px) 640px, 100vw' }: { id: string; sizes?: string }) {
  const media = allMedia.find((record) => record.id === id);
  if (!media) {
    return (
      <figure className="media-figure media-figure--pending">
        <div className="media-figure__placeholder">Media <code>{id}</code> is not in the cleared manifest.</div>
      </figure>
    );
  }
  const variants = media.variants ?? [];
  const srcSet = (format: 'avif' | 'webp' | 'fallback') => variants.map((variant) => `${BASE}media/${variant[format]} ${variant.width}w`).join(', ');
  return (
    <figure className="media-figure">
      <picture>
        {variants.length > 0 && <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />}
        {variants.length > 0 && <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />}
        <img
          src={`${BASE}media/${media.file}`}
          srcSet={variants.length > 0 ? srcSet('fallback') : undefined}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          style={media.focalPoint ? { objectPosition: `${media.focalPoint.x * 100}% ${media.focalPoint.y * 100}%` } : undefined}
        />
      </picture>
      <figcaption>
        <span className="media-figure__caption">{media.caption}</span>
        <RightsCredit media={media} />
      </figcaption>
    </figure>
  );
}

export function DeepZoomViewer({
  id, regions, activeRegion, onRegionChange,
}: {
  id: string;
  regions: { id: string; x: number; y: number; w: number; h: number; label: string; imageRegion?: boolean }[];
  activeRegion: string | null;
  onRegionChange: (id: string | null) => void;
}) {
  const media = allMedia.find((record) => record.id === id);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  if (!media?.deepZoom) return <MediaFigure id={id} />;

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const setClampedZoom = (value: number) => {
    const next = Math.min(3, Math.max(1, value));
    setZoom(next);
    if (next === 1) setPan({ x: 0, y: 0 });
  };
  const levelIndex = Math.min(media.deepZoom.levels.length - 1, Math.ceil(Math.log2(zoom)) + 1);
  const level = media.deepZoom.levels[levelIndex];
  const visibleRegions = [...regions].filter((region) => region.imageRegion !== false).sort((a, b) => (b.w * b.h) - (a.w * a.h));

  return (
    <figure className="deep-zoom">
      <div className="deep-zoom__controls" role="group" aria-label="Image zoom controls">
        <Button variant="quiet" onClick={() => setClampedZoom(zoom - 0.5)} disabled={zoom === 1} aria-label="Zoom out">−</Button>
        <label><span className="sr-only">Zoom level</span><input type="range" min="1" max="3" step="0.25" value={zoom} onChange={(event) => setClampedZoom(Number(event.target.value))} /></label>
        <Button variant="quiet" onClick={() => setClampedZoom(zoom + 0.5)} disabled={zoom === 3} aria-label="Zoom in">+</Button>
        <Button variant="quiet" onClick={reset}>Reset</Button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
      </div>
      <div
        className="deep-zoom__viewport"
        role="group"
        aria-label={`${media.alt} Use the zoom controls or arrow keys to inspect the image.`}
        tabIndex={0}
        onKeyDown={(event) => {
          const movements: Record<string, { x: number; y: number }> = {
            ArrowLeft: { x: 6, y: 0 }, ArrowRight: { x: -6, y: 0 }, ArrowUp: { x: 0, y: 6 }, ArrowDown: { x: 0, y: -6 },
          };
          if (event.key === 'Home') { event.preventDefault(); reset(); return; }
          const movement = movements[event.key];
          if (!movement || zoom === 1) return;
          event.preventDefault();
          setPan((current) => ({
            x: Math.max(-35, Math.min(35, current.x + movement.x)),
            y: Math.max(-35, Math.min(35, current.y + movement.y)),
          }));
        }}
      >
        <div
          className="deep-zoom__canvas"
          style={{
            aspectRatio: `${level.width} / ${level.height}`,
            transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
          }}
        >
          {Array.from({ length: level.rows }, (_, row) => Array.from({ length: level.cols }, (_, col) => (
            <img
              key={`${col}-${row}`}
              src={`${BASE}media/${level.path}/${col}-${row}.webp`}
              alt=""
              draggable={false}
              loading="lazy"
              style={{
                left: `${(col * media.deepZoom!.tileSize / level.width) * 100}%`,
                top: `${(row * media.deepZoom!.tileSize / level.height) * 100}%`,
                width: `${(Math.min(media.deepZoom!.tileSize, level.width - col * media.deepZoom!.tileSize) / level.width) * 100}%`,
                height: `${(Math.min(media.deepZoom!.tileSize, level.height - row * media.deepZoom!.tileSize) / level.height) * 100}%`,
              }}
            />
          )))}
          {visibleRegions.map((region) => (
            <button
              key={region.id}
              type="button"
              className={`deep-zoom__hotspot ${activeRegion === region.id ? 'is-active' : ''}`}
              style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.w}%`, height: `${region.h}%` }}
              aria-pressed={activeRegion === region.id}
              onClick={() => onRegionChange(activeRegion === region.id ? null : region.id)}
            >
              <span>{region.label}</span>
            </button>
          ))}
        </div>
      </div>
      <figcaption>
        <span className="media-figure__caption">{media.caption}</span>
        <RightsCredit media={media} />
      </figcaption>
    </figure>
  );
}

/* --------------------------------------------------------------- interaction */

export function FilterBar({
  label, options, value, onChange, allLabel = 'All',
}: { label: string; options: { id: string; label: string; count?: number }[]; value: string | null; onChange: (value: string | null) => void; allLabel?: string }) {
  const id = useId();
  return (
    <div className="filter-bar" role="group" aria-labelledby={id}>
      <span className="filter-bar__label" id={id}>{label}</span>
      <div className="filter-bar__options">
        <button type="button" className={`chip ${value === null ? 'is-active' : ''}`} aria-pressed={value === null} onClick={() => onChange(null)}>{allLabel}</button>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`chip ${value === option.id ? 'is-active' : ''}`}
            aria-pressed={value === option.id}
            onClick={() => onChange(value === option.id ? null : option.id)}
          >
            {option.label}{option.count != null && <span className="chip__count">{option.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (value: boolean) => void; description?: string }) {
  const id = useId();
  return (
    <div className="toggle">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>
        {label}
        {description && <span className="toggle__description">{description}</span>}
      </label>
    </div>
  );
}

export function Dialog({
  open, onClose, title, children, className = '',
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('is-dialog-open');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('is-dialog-open');
      restoreTo.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className={`archive-window ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog__head">
          <h2 id={titleId}>{title}</h2>
          <Button variant="quiet" iconOnly aria-label="Close" onClick={onClose}><Icon name="close" /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- media shells */

export function Transcript({ text, label = 'Transcript' }: { text: string; label?: string }) {
  return (
    <details className="transcript">
      <summary>{label}</summary>
      <div className="transcript__body">{text.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </details>
  );
}

/**
 * Video is click-to-load with visible controls and no autoplay. Nothing is
 * fetched from the provider until the reader activates the player.
 */
export function VideoPlayer({ id }: { id: string }) {
  const [active, setActive] = useState(false);
  const media = allMedia.find((record) => record.id === id && record.kind === 'video');
  if (!media) return <div className="media-figure media-figure--pending"><div className="media-figure__placeholder">Video <code>{id}</code> is not in the cleared manifest.</div></div>;
  return (
    <figure className="video-player">
      {active ? (
        <video controls preload="metadata" poster={media.poster ? `${BASE}media/${media.poster}` : undefined}>
          <source src={`${BASE}media/${media.file}`} />
        </video>
      ) : (
        <button type="button" className="video-player__poster" onClick={() => setActive(true)}>
          <span>Load video</span>
          <small>{media.caption}</small>
        </button>
      )}
      <figcaption>
        <span>{media.caption}</span>
        <RightsCredit media={media} />
        {media.transcript && <Transcript text={media.transcript} />}
      </figcaption>
    </figure>
  );
}

export function EvidenceRow({ evidence, origin, meta }: { evidence: EvidenceKind; origin?: ContentOrigin; meta?: ReactNode }) {
  return (
    <div className="evidence-row">
      <EvidenceBadge kind={evidence} />
      {origin && <OriginBadge origin={origin} />}
      {meta}
    </div>
  );
}

/** Shared empty state so every list failure reads the same way. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
