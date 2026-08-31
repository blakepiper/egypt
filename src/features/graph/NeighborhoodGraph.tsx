// The small graph shown on every article. It renders the deterministic layout
// computed at build time, and the same relationships appear in an HTML list
// underneath so the diagram is never the only way to reach the information.

import { useMemo, useState } from 'react';
import type { GraphSlice } from '../../types/content';
import { Link, useApp } from '../../app/state';
import { relationLabel } from '../../design-system/components';
import { OriginBadge } from '../../design-system';

const NODE_KIND_LABELS: Record<string, string> = {
  article: 'Article', concept: 'Concept', deity: 'Deity', place: 'Place', period: 'Period',
  practice: 'Practice', text: 'Text', object: 'Object', role: 'Role', source: 'Source group', journey: 'Journey',
};

export function NeighborhoodGraph({ slice, originId }: { slice: GraphSlice; originId: string }) {
  const { prefersReducedMotion } = useApp();
  const [focused, setFocused] = useState<string | null>(null);

  const view = useMemo(() => {
    const origin = slice.nodes.find((node) => node.id === originId);
    if (!origin || slice.nodes.length < 2) return null;
    // Re-centre the build-time layout on the origin so each article's view is stable.
    const points = slice.nodes.map((node) => ({ node, x: node.x - origin.x, y: node.y - origin.y }));
    const extent = Math.max(80, ...points.map((point) => Math.max(Math.abs(point.x), Math.abs(point.y))));
    const scale = 150 / extent;
    const placed = new Map(points.map((point) => [point.node.id, { x: point.x * scale, y: point.y * scale }]));
    return { placed, nodes: slice.nodes };
  }, [slice, originId]);

  const relationships = useMemo(() => (
    slice.edges.map((edge) => {
      const otherId = edge.from === originId ? edge.to : edge.from;
      const other = slice.nodes.find((node) => node.id === otherId);
      const outgoing = edge.from === originId;
      return { edge, other, outgoing };
    }).filter((item) => item.other && item.other.id !== originId)
  ), [slice, originId]);

  return (
    <div className="neighborhood">
      {view && (
        <svg className="neighborhood__canvas" viewBox="-170 -170 340 340" role="group" aria-label={`Diagram of ${relationships.length} connections. The same connections are listed below.`}>
          {slice.edges.map((edge, index) => {
            const from = view.placed.get(edge.from);
            const to = view.placed.get(edge.to);
            if (!from || !to) return null;
            const active = focused === edge.from || focused === edge.to;
            return <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={`neighborhood__edge ${active ? 'is-active' : ''}`} />;
          })}
          {view.nodes.map((node) => {
            const point = view.placed.get(node.id);
            if (!point) return null;
            const isOrigin = node.id === originId;
            return (
              <g
                key={node.id}
                className={`neighborhood__node neighborhood__node--${node.kind} ${isOrigin ? 'is-origin' : ''} ${focused === node.id ? 'is-focused' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, ${NODE_KIND_LABELS[node.kind] ?? node.kind}, ${node.origin} origin, ${node.evidence} evidence`}
                aria-pressed={focused === node.id}
                onClick={() => setFocused(isOrigin || focused === node.id ? null : node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFocused(isOrigin || focused === node.id ? null : node.id); }
                }}
              >
                <title>{node.label}</title>
                <circle cx={point.x} cy={point.y} r={isOrigin ? 9 : 5.5} />
                {(isOrigin || focused === node.id) && (
                  <text x={point.x} y={point.y - 14} textAnchor="middle">{node.label}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      <ul className="neighborhood__list">
        {relationships.map(({ edge, other, outgoing }, index) => (
          <li
            key={index}
            onMouseEnter={() => !prefersReducedMotion && setFocused(other!.id)}
            onMouseLeave={() => setFocused(null)}
            onFocus={() => setFocused(other!.id)}
            onBlur={() => setFocused(null)}
          >
            <span className="neighborhood__relation">{outgoing ? relationLabel(edge.type) : `${relationLabel(edge.type)} (incoming)`}</span>
            {other!.route
              ? <Link to={other!.route}>{other!.label}</Link>
              : <span>{other!.label}</span>}
            <span className="neighborhood__kind">{NODE_KIND_LABELS[other!.kind] ?? other!.kind}</span>
            <OriginBadge origin={other!.origin} />
            {edge.note && <p className="neighborhood__note">{edge.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
