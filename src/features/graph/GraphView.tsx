// The full knowledge-graph explorer. The graph data is a lazy chunk: it loads
// only on this route. Layout coordinates come from the build, so nothing moves
// on load, reduced motion changes nothing about correctness, and the same view
// can be reproduced from a URL.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GraphData, GraphEdge, GraphNode, EdgeType, NodeKind } from '../../types/content';
import { Link, useApp } from '../../app/state';
import { Button, OriginBadge } from '../../design-system';
import { EmptyState, FilterBar, PageHeader, relationLabel } from '../../design-system/components';
import { allPages, allPaths } from '../../generated';

const KIND_LABELS: Record<NodeKind, string> = {
  article: 'Article', concept: 'Concept', deity: 'Deity', place: 'Place', period: 'Period',
  practice: 'Practice', text: 'Text', object: 'Object', role: 'Role', source: 'Source group', journey: 'Journey',
};

type Point = { x: number; y: number };
type Camera = Point & { scale: number };
type GraphGesture = {
  type: 'pan' | 'node';
  pointerId: number;
  nodeId?: string;
  startX: number;
  startY: number;
  lastPoint: Point;
  moved: boolean;
};

const DEFAULT_CAMERA: Camera = { x: 0, y: 0, scale: 1 };
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 3.5;

function clampZoom(scale: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

export function GraphView() {
  const { search, navigate, prefersReducedMotion, preferences } = useApp();
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<NodeKind | null>(null);
  const [relation, setRelation] = useState<EdgeType | null>(null);
  const [hops, setHops] = useState<1 | 2>(1);
  const [pinned, setPinned] = useState<string[]>([]);
  const [trail, setTrail] = useState<string[]>([]);
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [nodePositions, setNodePositions] = useState<Record<string, Point>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<GraphGesture | null>(null);
  const suppressClickRef = useRef(false);

  const focusId = search.get('node');
  const pathId = search.get('path');

  useEffect(() => {
    let cancelled = false;
    import('../../generated/graph.json')
      .then((module) => { if (!cancelled) setData(module.default as unknown as GraphData); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const byId = useMemo(() => new Map((data?.nodes ?? []).map((node) => [node.id, node])), [data]);

  const setFocus = useCallback((id: string | null) => {
    const params = new URLSearchParams(search);
    if (id) params.set('node', id); else params.delete('node');
    navigate(`/graph/${params.toString() ? `?${params}` : ''}`);
    if (id) setTrail((current) => (current[current.length - 1] === id ? current : [...current, id].slice(-8)));
  }, [navigate, search]);

  const path = pathId ? allPaths.find((entry) => entry.id === pathId) ?? null : null;

  // The visible slice: the focused node plus one or two hops, filtered.
  const view = useMemo(() => {
    if (!data) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
    const matchesFilters = (node: GraphNode) => (!kind || node.kind === kind);
    const edgeAllowed = (edge: GraphEdge) => (!relation || edge.type === relation);

    if (path) {
      const ids = new Set(path.steps.map((step) => `page:${step.slug}`));
      return {
        nodes: data.nodes.filter((node) => ids.has(node.id)),
        edges: data.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to) && edgeAllowed(edge)),
      };
    }

    if (!focusId) {
      // Overview: the most connected reviewed nodes, so the first paint is legible.
      const ranked = [...data.nodes].filter(matchesFilters).sort((a, b) => b.degree - a.degree).slice(0, preferences.lowPerformance ? 40 : 90);
      const ids = new Set([...ranked.map((node) => node.id), ...pinned]);
      return {
        nodes: data.nodes.filter((node) => ids.has(node.id)),
        edges: data.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to) && edgeAllowed(edge)),
      };
    }

    const ids = new Set<string>([focusId, ...pinned]);
    let frontier = new Set(ids);
    for (let hop = 0; hop < hops; hop += 1) {
      const next = new Set<string>();
      for (const edge of data.edges) {
        if (!edgeAllowed(edge)) continue;
        if (frontier.has(edge.from)) next.add(edge.to);
        if (frontier.has(edge.to)) next.add(edge.from);
      }
      next.forEach((id) => ids.add(id));
      frontier = next;
    }
    const nodes = data.nodes.filter((node) => ids.has(node.id) && (node.id === focusId || matchesFilters(node)));
    const visible = new Set(nodes.map((node) => node.id));
    return { nodes, edges: data.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to) && edgeAllowed(edge)) };
  }, [data, focusId, hops, kind, relation, pinned, path, preferences.lowPerformance]);

  const viewKey = useMemo(() => view.nodes.map((node) => node.id).join('|'), [view.nodes]);
  const positionFor = useCallback((node: GraphNode): Point => nodePositions[node.id] ?? { x: node.x, y: node.y }, [nodePositions]);

  // A new filtered slice gets a clean camera and deterministic starting points;
  // dragging only updates nodePositions, so it never snaps back mid-gesture.
  useEffect(() => {
    setNodePositions(Object.fromEntries(view.nodes.map((node) => [node.id, { x: node.x, y: node.y }])));
    setCamera(DEFAULT_CAMERA);
  }, [viewKey]);

  const results = useMemo(() => {
    if (!data || query.trim().length < 2) return [];
    const needle = query.trim().toLowerCase();
    return data.nodes.filter((node) => node.label.toLowerCase().includes(needle)).slice(0, 12);
  }, [data, query]);

  const bounds = useMemo(() => {
    if (!view.nodes.length) return { minX: -400, minY: -400, width: 800, height: 800 };
    // Keep the camera coordinate system stable while a node is being dragged.
    // The extra padding leaves room for ordinary repositioning without making
    // the pointer mapping jump whenever a node becomes an outermost point.
    const xs = view.nodes.map((node) => node.x);
    const ys = view.nodes.map((node) => node.y);
    const minX = Math.min(...xs) - 80;
    const minY = Math.min(...ys) - 80;
    return { minX, minY, width: Math.max(200, Math.max(...xs) - minX + 80), height: Math.max(200, Math.max(...ys) - minY + 80) };
  }, [view.nodes]);

  const focused = focusId ? byId.get(focusId) ?? null : null;
  const focusedEdges = useMemo(
    () => (focusId ? view.edges.filter((edge) => edge.from === focusId || edge.to === focusId) : []),
    [view.edges, focusId],
  );
  const diagramEdges = useMemo(() => {
    if (!focusId) return view.edges;
    // Keep a focused diagram legible and cheap to update. The complete
    // filtered relationship set remains available in the textual disclosure
    // below, while the canvas emphasizes the selected node's direct links.
    return focusedEdges;
  }, [focusedEdges, focusId, view.edges]);

  const screenToViewBox = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const renderedScale = Math.min(rect.width / bounds.width, rect.height / bounds.height);
    const renderedWidth = bounds.width * renderedScale;
    const renderedHeight = bounds.height * renderedScale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    return {
      x: bounds.minX + (clientX - rect.left - offsetX) / renderedScale,
      y: bounds.minY + (clientY - rect.top - offsetY) / renderedScale,
    };
  }, [bounds]);

  const zoomTo = useCallback((nextScale: number, anchor: Point) => {
    setCamera((current) => {
      const scale = clampZoom(nextScale);
      const worldX = (anchor.x - current.x) / current.scale;
      const worldY = (anchor.y - current.y) / current.scale;
      return { scale, x: anchor.x - worldX * scale, y: anchor.y - worldY * scale };
    });
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const anchor = { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 };
    setCamera((current) => {
      const scale = clampZoom(current.scale * factor);
      const worldX = (anchor.x - current.x) / current.scale;
      const worldY = (anchor.y - current.y) / current.scale;
      return { scale, x: anchor.x - worldX * scale, y: anchor.y - worldY * scale };
    });
  }, [bounds]);

  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    zoomTo(camera.scale * (event.deltaY < 0 ? 1.15 : 0.87), screenToViewBox(event.clientX, event.clientY));
  };

  const beginPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    suppressClickRef.current = false;
    gestureRef.current = {
      type: 'pan', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastPoint: screenToViewBox(event.clientX, event.clientY), moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const beginNodeDrag = (event: React.PointerEvent<SVGGElement>, nodeId: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    suppressClickRef.current = false;
    gestureRef.current = {
      type: 'node', nodeId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastPoint: screenToViewBox(event.clientX, event.clientY), moved: false,
    };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const moveGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const point = screenToViewBox(event.clientX, event.clientY);
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 4) gesture.moved = true;
    const delta = { x: point.x - gesture.lastPoint.x, y: point.y - gesture.lastPoint.y };
    gesture.lastPoint = point;

    if (gesture.type === 'pan') {
      setCamera((current) => ({ ...current, x: current.x + delta.x, y: current.y + delta.y }));
    } else if (gesture.nodeId) {
      const world = { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale };
      setNodePositions((current) => ({ ...current, [gesture.nodeId!]: world }));
    }
  };

  const endGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    suppressClickRef.current = gesture.moved;
    gestureRef.current = null;
  };

  // Arrow keys move between neighbours; Home returns to the focused origin.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!focusId) return;
    const neighbours = focusedEdges.map((edge) => (edge.from === focusId ? edge.to : edge.from));
    if (!neighbours.length) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      setFocus(neighbours[0]);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      setFocus(neighbours[neighbours.length - 1]);
    } else if (event.key === 'Home' && trail.length > 1) {
      event.preventDefault();
      setFocus(trail[0]);
    }
  };

  if (error) return <div className="page"><EmptyState title="The graph data could not load">Every relationship also appears on its article page under “Nearby in the graph”.</EmptyState></div>;
  if (!data) return <div className="page"><p role="status" aria-live="polite">Loading the graph…</p></div>;

  return (
    <div className="page graph-page">
      <PageHeader
        eyebrow="Knowledge graph"
        title={path ? path.title : 'Follow the relationships'}
        lead={path ? path.blurb : `${data.nodes.length} nodes and ${data.edges.length} relationships. Wiki links form the document layer; reviewed entities and curated relations form the semantic layer. Curated edges explain themselves.`}
        actions={
          <>
            <Button onClick={() => { setFocus(null); setPinned([]); setTrail([]); setKind(null); setRelation(null); navigate('/graph/'); }}>Reset</Button>
            {focused && <Button onClick={() => setPinned((current) => current.includes(focused.id) ? current.filter((id) => id !== focused.id) : [...current, focused.id])}>
              {pinned.includes(focused.id) ? 'Unpin' : 'Pin'} {focused.label}
            </Button>}
          </>
        }
      />

      {path && (
        <ol className="graph-path">
          {path.steps.map((step) => (
            <li key={step.slug}>
              <Link to={`/wiki/${step.slug}/`}><strong>{allPages.find((page) => page.slug === step.slug)?.title ?? step.slug.replace(/-/g, ' ')}</strong></Link>
              <p>{step.why}</p>
              {step.reflection && <p className="muted"><strong>Reflect:</strong> {step.reflection}</p>}
            </li>
          ))}
        </ol>
      )}

      <div className="graph-controls">
        <label className="search-field search-field--compact">
          <span className="sr-only">Find a node</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a node…" type="search" />
        </label>
        {results.length > 0 && (
          <ul className="graph-results">
            {results.map((node) => (
              <li key={node.id}>
                <button type="button" onClick={() => { setFocus(node.id); setQuery(''); }}>{node.label} <span>{KIND_LABELS[node.kind]}</span></button>
              </li>
            ))}
          </ul>
        )}
        <FilterBar label="Node type" options={Object.entries(KIND_LABELS).map(([id, label]) => ({ id, label }))} value={kind} onChange={(value) => setKind(value as NodeKind | null)} />
        <FilterBar label="Relation" options={data.edgeTypes.map((type) => ({ id: type, label: relationLabel(type) }))} value={relation} onChange={(value) => setRelation(value as EdgeType | null)} />
        <FilterBar label="Expansion" options={[{ id: '1', label: 'One hop' }, { id: '2', label: 'Two hops' }]} value={String(hops)} onChange={(value) => setHops(value === '2' ? 2 : 1)} allLabel="One hop" />
      </div>

      {trail.length > 1 && (
        <nav className="graph-trail" aria-label="Path you followed">
          <ol>
            {trail.map((id, index) => (
              <li key={`${id}-${index}`}><button type="button" onClick={() => setFocus(id)}>{byId.get(id)?.label ?? id}</button></li>
            ))}
          </ol>
        </nav>
      )}

      <div className="graph-layout">
        <div className="graph-viewport">
          <div className="graph-viewport__toolbar" role="group" aria-label="Graph view controls">
            <span className="graph-viewport__hint" id="graph-instructions">Drag the background to pan; drag a node to reposition it. Scroll to zoom. Keyboard users can focus a node and use arrow keys to follow a relationship.</span>
            <div className="graph-viewport__tools">
              <Button variant="quiet" iconOnly aria-label="Zoom out" onClick={() => zoomBy(0.8)}>−</Button>
              <output aria-live="polite">{Math.round(camera.scale * 100)}%</output>
              <Button variant="quiet" iconOnly aria-label="Zoom in" onClick={() => zoomBy(1.25)}>+</Button>
              <Button variant="quiet" onClick={() => setCamera(DEFAULT_CAMERA)}>Reset view</Button>
            </div>
          </div>
          <p id="graph-canvas-summary" className="sr-only">Interactive knowledge graph showing {view.nodes.length} visible nodes and {view.edges.length} visible relationships. The complete node and relationship lists follow the diagram.</p>
          <svg
            ref={svgRef}
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
            className={`graph-canvas ${prefersReducedMotion ? 'is-static' : ''}`}
            preserveAspectRatio="xMidYMid meet"
            role="group"
            aria-labelledby="graph-canvas-summary"
            aria-describedby="graph-instructions"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={beginPan}
            onPointerMove={moveGesture}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
            onWheel={onWheel}
          >
            <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
            {diagramEdges.map((edge, index) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              const fromPoint = positionFor(from);
              const toPoint = positionFor(to);
              const active = focusId === edge.from || focusId === edge.to;
              return (
                <g key={index} className={`graph-edge graph-edge--${edge.type} ${active ? 'is-active' : ''}`}>
                  <line x1={fromPoint.x} y1={fromPoint.y} x2={toPoint.x} y2={toPoint.y} strokeWidth={Math.min(3, 0.6 + edge.weight * 0.3)} />
                  {active && edge.type !== 'links_to' && (
                    <text x={(fromPoint.x + toPoint.x) / 2} y={(fromPoint.y + toPoint.y) / 2 - 4} textAnchor="middle">{relationLabel(edge.type)}</text>
                  )}
                </g>
              );
            })}
            {view.nodes.map((node) => (
              <g
                key={node.id}
                className={`graph-node graph-node--${node.kind} ${node.id === focusId ? 'is-focused' : ''} ${pinned.includes(node.id) ? 'is-pinned' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, ${KIND_LABELS[node.kind]}, ${node.degree} connections, ${node.origin} origin, ${node.evidence} evidence`}
                aria-pressed={node.id === focusId}
                onPointerDown={(event) => beginNodeDrag(event, node.id)}
                onClick={() => {
                  if (suppressClickRef.current) { suppressClickRef.current = false; return; }
                  setFocus(node.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFocus(node.id); }
                }}
              >
                <title>{node.label}</title>
                {(() => {
                  const point = positionFor(node);
                  const radius = node.id === focusId ? 12 : 4 + Math.min(6, node.degree * 0.35);
                  return (
                    <>
                      <circle className="graph-node__hit" cx={point.x} cy={point.y} r={Math.max(10, radius + 4)} />
                      <circle className="graph-node__dot" cx={point.x} cy={point.y} r={radius} />
                      <text x={point.x} y={point.y - 12} textAnchor="middle">{node.label}</text>
                    </>
                  );
                })()}
              </g>
            ))}
            </g>
          </svg>
        </div>

        <aside className="graph-detail">
          {focused ? (
            <>
              <span className="kicker">{KIND_LABELS[focused.kind]}</span>
              <h2>{focused.label}</h2>
              <p><OriginBadge origin={focused.origin} /> <span className="muted">{focused.evidence}</span></p>
              <p>{focused.summary}</p>
              {focused.route && <Link className="archive-button archive-button--primary" to={focused.route}>Open the page</Link>}
              <h3>Why these are connected</h3>
              <ul className="graph-relations">
                {focusedEdges.map((edge, index) => {
                  const otherId = edge.from === focused.id ? edge.to : edge.from;
                  const other = byId.get(otherId);
                  if (!other) return null;
                  return (
                    <li key={index}>
                      <button type="button" onClick={() => setFocus(other.id)}>{other.label}</button>
                      <span className="graph-relations__type">{relationLabel(edge.type)}{edge.from === focused.id ? '' : ' (incoming)'}</span>
                      <p>{edge.note ?? (edge.type === 'links_to' ? `One page links to the other ${edge.weight} time${edge.weight === 1 ? '' : 's'}. A wiki link is a document connection, not a claim about the kind of relationship.` : `Recorded in ${edge.source}.`)}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <h2>Nothing is selected</h2>
              <p>Search for a node, choose one in the diagram, or open a knowledge path. Everything visible in the diagram is also listed here once a node is selected.</p>
              <h3>Knowledge paths</h3>
              <ul className="graph-relations">
                {allPaths.map((entry) => (
                  <li key={entry.id}>
                    <Link to={`/graph/?path=${entry.id}`}>{entry.title}</Link>
                    <p>{entry.blurb}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      <section className="graph-list" aria-labelledby="graph-list-title">
        <h2 id="graph-list-title">Every visible node as a list</h2>
        <ul>
          {view.nodes.map((node) => (
            <li key={node.id}>
              <button type="button" onClick={() => setFocus(node.id)}>{node.label}</button>
              <span>{KIND_LABELS[node.kind]}</span>
              <OriginBadge origin={node.origin} />
              <span>{node.degree} connection{node.degree === 1 ? '' : 's'}</span>
              {node.route && <Link to={node.route}>Open</Link>}
            </li>
          ))}
        </ul>
      </section>

      <details className="graph-list graph-list--edges">
        <summary>Every visible relationship as a list ({view.edges.length})</summary>
        {view.edges.length === 0 ? <p className="muted">No relationship matches the current filters.</p> : (
          <ul>
            {view.edges.map((edge, index) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              return <li key={`${edge.from}-${edge.to}-${edge.type}-${index}`}><button type="button" onClick={() => setFocus(from.id)}>{from.label}</button><span>{relationLabel(edge.type)}</span><button type="button" onClick={() => setFocus(to.id)}>{to.label}</button>{edge.note && <p>{edge.note}</p>}</li>;
            })}
          </ul>
        )}
      </details>
    </div>
  );
}
