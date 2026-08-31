// The full knowledge-graph explorer. The graph data is a lazy chunk: it loads
// only on this route. Layout coordinates come from the build, so nothing moves
// on load, reduced motion changes nothing about correctness, and the same view
// can be reproduced from a URL.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GraphData, GraphEdge, GraphNode, EdgeType, NodeKind } from '../../types/content';
import { Link, useApp } from '../../app/state';
import { Button, Icon, OriginBadge } from '../../design-system';
import { EmptyState, FilterSelect, PageHeader, Segmented, relationLabel } from '../../design-system/components';
import { allPages, allPaths } from '../../generated';

const KIND_LABELS: Record<NodeKind, string> = {
  article: 'Article', concept: 'Concept', deity: 'Deity', place: 'Place', period: 'Period',
  practice: 'Practice', text: 'Text', object: 'Object', role: 'Role', source: 'Source group', journey: 'Journey',
};

// links_to and draws_from are derived from the pages themselves; every other
// relation was written by hand. The filter groups them the same way the lead
// paragraph describes them, so the two layers stay one idea across the page.
const DOCUMENT_RELATIONS = new Set<EdgeType>(['links_to', 'draws_from']);
const COMMUNITY_COLORS = [
  '--archive-color-primary-soft', '--archive-color-secondary-soft', '--archive-color-success',
  '--archive-color-gold', '--archive-color-sacred', '--archive-color-warning', '--archive-color-selection',
];

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
  const layerParam = search.get('layer') === 'all' ? 'all' : 'curated';
  const [layer, setLayer] = useState<'curated' | 'all'>(layerParam);
  const communityParam = search.get('community');
  const communityParamId = communityParam !== null && /^\d+$/.test(communityParam) ? Number(communityParam) : null;
  const [community, setCommunity] = useState<number | null>(communityParamId);
  const [hops, setHops] = useState<1 | 2>(1);
  const [pinned, setPinned] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [nodePositions, setNodePositions] = useState<Record<string, Point>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<GraphGesture | null>(null);

  const focusId = search.get('node');
  const pathId = search.get('path');

  useEffect(() => { setLayer(layerParam); }, [layerParam]);
  useEffect(() => { setCommunity(communityParamId); }, [communityParamId]);

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

  const setLayerFromControl = useCallback((value: string) => {
    const next = value === 'all' ? 'all' : 'curated';
    const params = new URLSearchParams(search);
    if (next === 'all') params.set('layer', 'all'); else params.delete('layer');
    setLayer(next);
    navigate(`/graph/${params.toString() ? `?${params}` : ''}`);
  }, [navigate, search]);

  const setCommunityFromControl = useCallback((id: number | null) => {
    const params = new URLSearchParams(search);
    if (id === null) params.delete('community'); else params.set('community', String(id));
    setCommunity(id);
    navigate(`/graph/${params.toString() ? `?${params}` : ''}`);
  }, [navigate, search]);

  const path = pathId ? allPaths.find((entry) => entry.id === pathId) ?? null : null;

  // The visible slice: the focused node plus one or two hops, filtered.
  const view = useMemo(() => {
    if (!data) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
    const matchesFilters = (node: GraphNode) => (!kind || node.kind === kind);
    const edgeAllowed = (edge: GraphEdge) => (layer === 'all' || !DOCUMENT_RELATIONS.has(edge.type)) && (!relation || edge.type === relation);
    const nodeAllowed = (node: GraphNode) => matchesFilters(node)
      && (layer === 'all' || node.semanticDegree > 0 || node.id === focusId)
      && (!node.control || node.id === focusId)
      && (community === null || node.community === community || node.id === focusId);

    if (path) {
      const ids = new Set(path.steps.map((step) => `page:${step.slug}`));
      const visible = new Set(data.nodes.filter((node) => ids.has(node.id) && nodeAllowed(node)).map((node) => node.id));
      return {
        nodes: data.nodes.filter((node) => visible.has(node.id)),
        edges: data.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to) && edgeAllowed(edge)),
      };
    }

    if (!focusId) {
      // The curated layer is one connected component and small enough to show
      // in full; the document layer keeps the compact degree-ranked overview.
      const candidates = data.nodes.filter(nodeAllowed);
      const ranked = layer === 'curated'
        ? candidates
        : [...candidates].sort((a, b) => b.semanticDegree - a.semanticDegree || b.degree - a.degree).slice(0, preferences.lowPerformance ? 40 : 90);
      const ids = new Set([...ranked.map((node) => node.id), ...pinned]);
      return {
        nodes: data.nodes.filter((node) => ids.has(node.id) && nodeAllowed(node)),
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
    const nodes = data.nodes.filter((node) => ids.has(node.id) && nodeAllowed(node));
    const visible = new Set(nodes.map((node) => node.id));
    return { nodes, edges: data.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to) && edgeAllowed(edge)) };
  }, [community, data, focusId, hops, kind, layer, relation, pinned, path, preferences.lowPerformance]);

  const contextId = hoveredId ?? keyboardFocusId ?? focusId;
  const contextNodeIds = useMemo(() => {
    if (!contextId) return new Set<string>();
    const ids = new Set<string>([contextId]);
    for (const edge of view.edges) {
      if (edge.from === contextId) ids.add(edge.to);
      if (edge.to === contextId) ids.add(edge.from);
    }
    return ids;
  }, [contextId, view.edges]);

  // A label the reader cannot see is a node they cannot learn anything from,
  // so the view always names what it can: everything when the slice is small,
  // the best-connected nodes when it is not.
  const labelled = useMemo(() => {
    if (view.nodes.length <= 45) return new Set(view.nodes.map((node) => node.id));
    return new Set(
      [...view.nodes].sort((a, b) => b.degree - a.degree).slice(0, 30).map((node) => node.id),
    );
  }, [view.nodes]);

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

  // Counts come from the whole graph, not the visible slice, so an option can
  // promise what it will show before it is chosen. Empty options are dropped,
  // because an entity kind with nothing in it filters the graph down to nothing.
  const totals = useMemo(() => {
    const kinds = new Map<NodeKind, number>();
    const relations = new Map<EdgeType, number>();
    for (const node of data?.nodes ?? []) kinds.set(node.kind, (kinds.get(node.kind) ?? 0) + 1);
    for (const edge of data?.edges ?? []) relations.set(edge.type, (relations.get(edge.type) ?? 0) + 1);
    return { kinds, relations };
  }, [data]);

  const kindOptions = useMemo(
    () => (Object.keys(KIND_LABELS) as NodeKind[])
      .map((id) => ({ id, label: KIND_LABELS[id], count: totals.kinds.get(id) ?? 0 }))
      .filter((option) => option.count > 0)
      .sort((a, b) => b.count - a.count),
    [totals],
  );

  const relationGroups = useMemo(() => {
    const build = (types: EdgeType[]) => types
      .map((id) => ({ id, label: relationLabel(id), count: totals.relations.get(id) ?? 0 }))
      .filter((option) => option.count > 0)
      .sort((a, b) => b.count - a.count);
    const types = data?.edgeTypes ?? [];
    return [
      { label: 'Document layer', options: build(types.filter((type) => DOCUMENT_RELATIONS.has(type))) },
      { label: 'Curated semantic layer', options: build(types.filter((type) => !DOCUMENT_RELATIONS.has(type))) },
    ].filter((group) => group.options.length > 0);
  }, [data, totals]);

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

  const filtersActive = community !== null || kind !== null || relation !== null || hops !== 1;
  const focused = focusId ? byId.get(focusId) ?? null : null;
  const communityLabels = useMemo(
    () => new Map((data?.communities ?? []).map((entry) => [entry.id, entry.label])),
    [data],
  );
  const labelForCommunity = (node: GraphNode): string =>
    node.community >= 0 ? (communityLabels.get(node.community) ?? 'Curated community') : 'No curated community';
  const focusedEdges = useMemo(
    () => (focusId ? view.edges.filter((edge) => edge.from === focusId || edge.to === focusId) : []),
    [view.edges, focusId],
  );

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
    gestureRef.current = {
      type: 'pan', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastPoint: screenToViewBox(event.clientX, event.clientY), moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const beginNodeDrag = (event: React.PointerEvent<SVGGElement>, nodeId: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
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

  // Selecting happens here rather than in a click handler on the node. The
  // drag gesture captures the pointer on the svg, and a captured pointer
  // retargets its click to the capturing element, so a handler on the node
  // group never runs. A node gesture that never moved is the click.
  const endGesture = (event: React.PointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (gesture.type === 'node' && !gesture.moved && gesture.nodeId) setFocus(gesture.nodeId);
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
            <Button onClick={() => { setFocus(null); setPinned([]); setTrail([]); setKind(null); setRelation(null); setCommunity(null); setLayer('curated'); navigate('/graph/'); }}>Reset</Button>
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
        <div className="graph-controls__row">
          <div className="graph-controls__find">
            <label className="search-field search-field--compact">
              <Icon name="search" />
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
          </div>
          <FilterSelect
            label="Node type"
            allLabel={`Every type (${data.nodes.length})`}
            options={kindOptions}
            value={kind}
            onChange={(value) => setKind(value as NodeKind | null)}
          />
          <FilterSelect
            label="Relation"
            allLabel={`Every relation (${data.edges.length})`}
            groups={relationGroups}
            value={relation}
            onChange={(value) => setRelation(value as EdgeType | null)}
          />
          <Segmented
            label="Layer"
            options={[{ id: 'curated', label: 'Curated relations' }, { id: 'all', label: 'Everything, including wiki links' }]}
            value={layer}
            onChange={setLayerFromControl}
          />
          <Segmented
            label="Expansion"
            options={[{ id: '1', label: 'One hop' }, { id: '2', label: 'Two hops' }]}
            value={String(hops)}
            onChange={(value) => setHops(value === '2' ? 2 : 1)}
          />
        </div>
        <div className="graph-controls__status">
          <p role="status" aria-live="polite">
            Showing <strong>{view.nodes.length}</strong> of {data.nodes.length} nodes and <strong>{view.edges.length}</strong> of {data.edges.length} relationships.
            {!focusId && !path && !filtersActive && layer === 'curated' && ' These are the reviewed relations; choose one to follow its neighbourhood.'}
            {!focusId && !path && !filtersActive && layer === 'all' && ' These are the most connected nodes; choose one to follow its neighbourhood.'}
          </p>
          {filtersActive && <Button variant="quiet" onClick={() => { setKind(null); setRelation(null); setHops(1); setCommunityFromControl(null); }}>Clear filters</Button>}
        </div>
      </div>

      <section className="graph-legend" aria-labelledby="graph-legend-title">
        <div>
          <span className="kicker">Curated layer</span>
          <h2 id="graph-legend-title">Communities</h2>
        </div>
        <div className="graph-legend__entries">
          {data.communities.map((entry) => {
            const color = COMMUNITY_COLORS[entry.id % COMMUNITY_COLORS.length];
            const selected = community === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                className={`graph-legend__entry ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => setCommunityFromControl(selected ? null : entry.id)}
              >
                <span className="graph-legend__swatch" style={{ backgroundColor: `var(${color})` }} aria-hidden="true" />
                <span>{entry.label}</span>
                <small>{entry.size} nodes</small>
              </button>
            );
          })}
        </div>
      </section>

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
            className={`graph-canvas ${prefersReducedMotion ? 'is-static' : ''} ${contextId ? 'has-hover' : ''}`}
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
            {view.edges.map((edge, index) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              const fromPoint = positionFor(from);
              const toPoint = positionFor(to);
              const active = contextId === edge.from || contextId === edge.to;
              return (
                <g key={index} className={`graph-edge graph-edge--${edge.type} ${active ? 'is-active' : ''} ${contextId && !active ? 'is-dimmed' : ''}`}>
                  <line x1={fromPoint.x} y1={fromPoint.y} x2={toPoint.x} y2={toPoint.y} strokeWidth={Math.min(3, 0.6 + edge.weight * 0.3)} />
                  {active && (
                    <text x={(fromPoint.x + toPoint.x) / 2} y={(fromPoint.y + toPoint.y) / 2 - 4} textAnchor="middle">{relationLabel(edge.type)}</text>
                  )}
                </g>
              );
            })}
            {view.nodes.map((node) => (
              <g
                key={node.id}
                className={`graph-node graph-node--${node.kind} ${node.id === focusId ? 'is-focused' : ''} ${pinned.includes(node.id) ? 'is-pinned' : ''} ${labelled.has(node.id) ? 'is-labelled' : ''} ${contextId && !contextNodeIds.has(node.id) ? 'is-dimmed' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, ${KIND_LABELS[node.kind]}, ${labelForCommunity(node)}, ${node.degree} connections, ${node.origin} origin, ${node.evidence} evidence`}
                aria-pressed={node.id === focusId}
                onPointerDown={(event) => beginNodeDrag(event, node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setKeyboardFocusId(node.id)}
                onBlur={() => setKeyboardFocusId(null)}
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
                      <circle
                        className="graph-node__dot"
                        cx={point.x}
                        cy={point.y}
                        r={radius}
                        style={layer === 'curated' && node.community >= 0 ? { fill: `var(${COMMUNITY_COLORS[node.community % COMMUNITY_COLORS.length]})` } : undefined}
                      />
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
              <span>{labelForCommunity(node)}</span>
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
