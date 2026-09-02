// One-off maintenance helper: writes reviewed structured frontmatter fields onto
// wiki pages. It is idempotent — it replaces any block it previously wrote — so
// it can be re-run after the reviewed field list changes.
//
// Usage: node scripts/content/tools/apply-frontmatter.mjs content/frontmatter-review.json

import { readFileSync, writeFileSync } from 'node:fs';

const VALID_EDGES = new Set(['links_to', 'draws_from', 'part_of', 'appears_in', 'associated_with',
  'practiced_at', 'changes_during', 'precedes', 'maintains', 'threatens', 'restores',
  'contrasts_with', 'contested_by', 'depicted_in']);

const spec = JSON.parse(readFileSync(process.argv[2] ?? 'content/frontmatter-review.json', 'utf8'));

for (const [slug, fields] of Object.entries(spec)) {
  const path = `llm-wiki/${slug}.md`;
  const text = readFileSync(path, 'utf8');
  if (!text.startsWith('---\n')) throw new Error(`${path} has no frontmatter`);
  const end = text.indexOf('\n---', 4);
  const body = text.slice(end + 4).replace(/^\n+/, '');

  const lines = [];
  let skipping = false;
  const managed = new Set(Object.keys(fields));
  for (const line of text.slice(4, end).split('\n')) {
    if (!line.trim()) continue;
    const topLevel = line.match(/^([a-z_]+):/);
    if (topLevel && managed.has(topLevel[1])) { skipping = true; continue; }
    if (skipping && (line.startsWith('  ') || line.startsWith('- '))) continue;
    skipping = false;
    lines.push(line);
  }

  for (const key of ['aliases', 'periods', 'places', 'entities']) {
    const values = fields[key];
    if (values?.length) lines.push(`${key}: [${values.join(', ')}]`);
  }
  if (fields.relations?.length) {
    lines.push('relations:');
    for (const relation of fields.relations) {
      if (!VALID_EDGES.has(relation.type)) throw new Error(`${slug}: unknown relation type ${relation.type}`);
      lines.push(`  - target: ${relation.target}`);
      lines.push(`    type: ${relation.type}`);
      if (relation.note) lines.push(`    note: "${relation.note.replace(/"/g, '\\"')}"`);
    }
  }
  if (fields.review) {
    lines.push('review:');
    for (const key of ['factual', 'humanizer', 'media_rights', 'editorial']) {
      if (fields.review[key]) lines.push(`  ${key}: ${fields.review[key]}`);
    }
  }
  writeFileSync(path, `---\n${lines.join('\n')}\n---\n\n${body}`);
  console.log(`updated ${slug}`);
}
