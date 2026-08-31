// Renders the preprocessed content AST. The build step has already resolved
// links, heading IDs, callouts, and source citations, so this file only decides
// how each reviewed node type looks.

import { Fragment, type ReactNode } from 'react';
import type { BlockNode, InlineNode, TableCell } from '../../types/content';
import { Link } from '../../app/state';
import { EvidenceCallout, MediaFigure, TermDefinition } from '../../design-system/components';

export function Blocks({ blocks }: { blocks: BlockNode[] }) {
  return <>{blocks.map((block, index) => <Block key={index} block={block} />)}</>;
}

function Block({ block }: { block: BlockNode }): ReactNode {
  switch (block.t) {
    case 'heading': {
      const Tag = `h${Math.min(block.level, 6)}` as 'h2';
      return (
        <Tag id={block.id} className="article-heading" tabIndex={-1}>
          <Inline nodes={block.c} />
          <a className="article-heading__anchor" href={`#${block.id}`} aria-label={`Link to section: ${block.text}`}>#</a>
        </Tag>
      );
    }
    case 'paragraph':
      return <p><Inline nodes={block.c} /></p>;
    case 'list':
      return block.ordered
        ? <ol start={block.start}>{block.items.map((item, index) => <li key={index}><Blocks blocks={item} /></li>)}</ol>
        : <ul>{block.items.map((item, index) => <li key={index}><Blocks blocks={item} /></li>)}</ul>;
    case 'table':
      return (
        <div className="article-table" role="region" tabIndex={0} aria-label="Table, scrollable">
          <table>
            <thead>
              <tr>{block.head.map((cell, index) => <th key={index} style={alignment(cell)} scope="col"><Inline nodes={cell.c} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    index === 0
                      ? <th key={index} scope="row" style={alignment(cell)}><Inline nodes={cell.c} /></th>
                      : <td key={index} style={alignment(cell)}><Inline nodes={cell.c} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'quote':
      return <blockquote><Blocks blocks={block.c} /></blockquote>;
    case 'callout':
      return (
        <EvidenceCallout kind={block.kind} label={block.label}>
          <Blocks blocks={block.c} />
        </EvidenceCallout>
      );
    case 'code':
      return <pre className="article-code"><code>{block.v}</code></pre>;
    case 'hr':
      return <hr />;
    case 'media':
      return <MediaFigure id={block.id} />;
    default:
      return null;
  }
}

function alignment(cell: TableCell) {
  return cell.align ? { textAlign: cell.align } : undefined;
}

export function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.t) {
          case 'text': return <Fragment key={index}>{node.v}</Fragment>;
          case 'term': return <TermDefinition key={index} term={node.v} definition={node.definition} />;
          case 'strong': return <strong key={index}><Inline nodes={node.c} /></strong>;
          case 'em': return <em key={index}><Inline nodes={node.c} /></em>;
          case 'code': return <code key={index}>{node.v}</code>;
          case 'br': return <br key={index} />;
          case 'link': return <InlineLink key={index} node={node} />;
          default: return null;
        }
      })}
    </>
  );
}

function InlineLink({ node }: { node: Extract<InlineNode, { t: 'link' }> }) {
  const children = <Inline nodes={node.c} />;
  if (node.kind === 'external') {
    return <a className="article-link article-link--external" href={node.href} target="_blank" rel="noreferrer noopener">{children}<span className="sr-only"> (opens in a new tab)</span></a>;
  }
  if (node.kind === 'raw') {
    // `raw/` holds the immutable source files. They are deliberately not published,
    // so the reference is shown as a filename rather than as a dead link.
    return <span className="article-link article-link--raw" title="Held in the private source archive; not published">{children}</span>;
  }
  if (node.kind === 'source') {
    return <Link to={node.href} className="article-link article-link--source">{children}</Link>;
  }
  if (node.kind === 'heading') {
    return <a className="article-link" href={node.href}>{children}</a>;
  }
  if (node.missing) {
    return <span className="article-link article-link--missing" title="This page does not exist yet">{children}</span>;
  }
  return <Link to={node.href} className="article-link">{children}</Link>;
}
