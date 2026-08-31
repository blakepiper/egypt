import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

type IconName = 'archive' | 'book' | 'close' | 'compass' | 'moon' | 'network' | 'search' | 'sun' | 'temple' | 'water';

const iconPaths: Record<IconName, ReactNode> = {
  archive: <><path d="M4 7h16v13H4z"/><path d="M3 3h18v4H3zM9 11h6"/></>,
  book: <><path d="M4 5.5c3.7-.8 6.3.1 8 2.1v12c-1.7-2-4.3-2.9-8-2.1z"/><path d="M20 5.5c-3.7-.8-6.3.1-8 2.1v12c1.7-2 4.3-2.9 8-2.1z"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/></>,
  moon: <path d="M19 15.8A8 8 0 0 1 8.2 5a8 8 0 1 0 10.8 10.8Z"/>,
  network: <><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m10.7 7.2-4.4 8.6M13.3 7.2l4.4 8.6M7.5 18h9"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,
  sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></>,
  temple: <><path d="M3 20h18M5 17h14M7 7v10M11 7v10M15 7v10M4 7h16L12 3z"/></>,
  water: <><path d="M3 8c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M3 13c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M3 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/></>,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

export interface WindowProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  status?: ReactNode;
  statusEnd?: ReactNode;
  padded?: boolean;
  flat?: boolean;
  managed?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  onClose?: () => void;
}

let nextWindowLayer = 10;

export const Window = forwardRef<HTMLElement, WindowProps>(function Window(
  {
    title,
    status,
    statusEnd,
    padded = true,
    flat = false,
    managed = false,
    minimizable = managed,
    maximizable = managed,
    onClose,
    className = '',
    style,
    children,
    ...props
  },
  forwardedRef,
) {
  const titleId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [layer, setLayer] = useState(nextWindowLayer++);

  const setRootRef = (node: HTMLElement | null) => {
    rootRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const bringForward = () => setLayer(++nextWindowLayer);
  const canDrag = () => managed && !maximized && window.matchMedia('(min-width: 761px)').matches;
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag() || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    bringForward();
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, ...position };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const root = rootRef.current;
    const nextX = dragStart.current.x + event.clientX - dragStart.current.pointerX;
    const nextY = dragStart.current.y + event.clientY - dragStart.current.pointerY;
    if (!root) return setPosition({ x: nextX, y: nextY });
    const rect = root.getBoundingClientRect();
    setPosition({
      x: Math.min(Math.max(nextX, position.x - rect.left + 24), position.x + window.innerWidth - rect.right - 64),
      y: Math.min(Math.max(nextY, position.y + 72 - rect.top), position.y + window.innerHeight - rect.top - 32),
    });
  };
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const windowStyle = {
    ...style,
    '--archive-window-x': `${position.x}px`,
    '--archive-window-y': `${position.y}px`,
    zIndex: layer,
  } as CSSProperties;

  return (
    <section
      {...props}
      ref={setRootRef}
      aria-labelledby={titleId}
      className={`archive-window ${flat ? 'archive-window--flat' : ''} ${managed ? 'archive-window--managed' : ''} ${minimized ? 'archive-window--minimized' : ''} ${maximized ? 'archive-window--maximized' : ''} ${className}`}
      style={windowStyle}
      onPointerDown={(event) => { bringForward(); props.onPointerDown?.(event); }}
    >
      <div
        className="archive-window__bar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => maximizable && setMaximized(!maximized)}
      >
        {managed ? (
          <span className="archive-window__widgets">
            {onClose && <button className="archive-window__widget archive-window__widget--close" aria-label="Close window" onClick={onClose}>×</button>}
            {minimizable && <button className="archive-window__widget archive-window__widget--minimize" aria-label={minimized ? 'Restore window' : 'Minimize window'} aria-expanded={!minimized} onClick={() => { setMinimized(!minimized); setMaximized(false); }}>{minimized ? '+' : '−'}</button>}
            {maximizable && <button className="archive-window__widget archive-window__widget--maximize" aria-label={maximized ? 'Restore window size' : 'Maximize window'} onClick={() => { setMaximized(!maximized); setMinimized(false); }}>{maximized ? '◱' : '□'}</button>}
          </span>
        ) : (
          <span className="archive-window__widgets" aria-hidden="true"><i className="archive-window__widget"/><i className="archive-window__widget"/></span>
        )}
        <span className="archive-window__grip" aria-hidden="true"/>
        <span className="archive-window__title" id={titleId}>{title}</span>
        <span className="archive-window__grip" aria-hidden="true"/>
      </div>
      <div className={`archive-window__body ${padded ? 'archive-window__body--padded' : ''}`}>{children}</div>
      {(status || statusEnd) && <div className="archive-window__status"><span>{status}</span><span>{statusEnd}</span></div>}
    </section>
  );
});

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'quiet';
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', iconOnly = false, className = '', type = 'button', ...props },
  ref,
) {
  return <button {...props} ref={ref} type={type} className={`archive-button archive-button--${variant} ${iconOnly ? 'archive-button--icon' : ''} ${className}`} />;
});

export type EvidenceKind = 'primary' | 'archive' | 'scholarship' | 'speculative';

export function EvidenceBadge({ kind }: { kind: EvidenceKind }) {
  const labels: Record<EvidenceKind, string> = {
    primary: 'Primary source',
    archive: 'Archive synthesis',
    scholarship: 'Scholarship',
    speculative: 'Artistic / contested',
  };
  return <span className={`evidence-badge evidence-badge--${kind}`}>{labels[kind]}</span>;
}

export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return <aside className="archive-callout"><span className="archive-callout__label">{label}</span>{children}</aside>;
}
