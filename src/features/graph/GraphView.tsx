// The full knowledge-graph explorer. The graph data is a lazy chunk: it loads
// only on this route. Layout coordinates come from the build, so nothing moves
// on load, reduced motion changes nothing about correctness, and the same view
// can be reproduced from a URL.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GraphData, GraphEdge, GraphNode, EdgeType, NodeKind } from '../../types/content';
import { Link, useApp } from '../../app/state';
import { Button } from '../../design-system';
import { EmptyState, FilterBar, PageHeader, relationLabel } from '../../design-system/components';
import { allPaths } from '../../generated';

const KIND_LABELS: Record<NodeKind, string> = {
  article: 'Article', concept: 'Concept', deity: 'Deity', place: 'Place', period: 'Period',
  practice: 'Practice', text: 'Text', object: 'Object', role: 'Role', source: 'Source group', journey: 'Journey',
};

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
  const svgRef = useRef<SVGSVGElement>(null);

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
    for (let hop = 0; hop < hops; hop += 1) {
      for (const edge of data.edges) {
        if (!edgeAllowed(edge)) continue;
        if (ids.has(edge.from)) ids.add(edge.to);
        else if (ids.has(edge.to)) ids.add(edge.from);
      }
    }
    const nodes = data.nodes.filter((node) => ids.has(node.id) && (node.id === focusId || matchesFilters(node)));
    const visible = new Set(nodes.map((node) => node.id));
    return { nodes, edges: data.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to) && edgeAllowed(edge)) };
  }, [data, focusId, hops, kind, relation, pinned, path, preferences.lowPerformance]);

  const results = useMemo(() => {
    if (!data || query.trim().length < 2) return [];
    const needle = query.trim().toLowerCase();
    return data.nodes.filter((node) => node.label.toLowerCase().includes(needle)).slice(0, 12);
  }, [data, query]);

  const bounds = useMemo(() => {
    if (!view.nodes.length) return { minX: -400, minY: -400, width: 800, height: 800 };
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
              <Link to={`/wiki/${step.slug}/`}><strong>{step.slug.replace(/-/g, ' ')}</strong></Link>
              <p>{step.why}</p>
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
          <svg
            ref={svgRef}
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
            className={`graph-canvas ${prefersReducedMotion ? 'is-static' : ''}`}
            role="img"
            aria-label={`Graph showing ${view.nodes.length} nodes and ${view.edges.length} relationships. The same relationships are listed beside the diagram.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
          >
            {view.edges.map((edge, index) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              const active = focusId === edge.from || focusId === edge.to;
              return (
                <g key={index} className={`graph-edge graph-edge--${edge.type} ${active ? 'is-active' : ''}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={Math.min(3, 0.6 + edge.weight * 0.3)} />
                  {active && edge.type !== 'links_to' && (
                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 4} textAnchor="middle">{relationLabel(edge.type)}</text>
                  )}
                </g>
              );
            })}
            {view.nodes.map((node) => (
              <g
                key={node.id}
                className={`graph-node graph-node--${node.kind} ${node.id === focusId ? 'is-focused' : ''} ${pinned.includes(node.id) ? 'is-pinned' : ''}`}
                onClick={() => setFocus(node.id)}
              >
                <circle cx={node.x} cy={node.y} r={node.id === focusId ? 12 : 4 + Math.min(6, node.degree * 0.35)} />
                <text x={node.x} y={node.y - 12} textAnchor="middle">{node.label}</text>
              </g>
            ))}
          </svg>
        </div>

        <aside className="graph-detail">
          {focused ? (
            <>
              <span className="kicker">{KIND_LABELS[focused.kind]}</span>
              <h2>{focused.label}</h2>
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
              <span>{node.degree} connection{node.degree === 1 ? '' : 's'}</span>
              {node.route && <Link to={node.route}>Open</Link>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
