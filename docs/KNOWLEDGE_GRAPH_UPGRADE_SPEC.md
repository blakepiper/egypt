# Knowledge graph upgrade — implementation spec

Status: ready to execute. **Phase 1.1 and Phase 6 are already done** (2026-08-31)
and are marked DONE below. Start at Phase 1.2.
Author: investigation session, 2026-08-31
Target files: `src/features/graph/`, `scripts/content/build-graph.ts`, `src/types/content.ts`, `src/application.css`, `tests/`

---

## 0. How to use this document

Work the phases **in order**. Each phase is independently shippable and ends with
acceptance criteria you can check by running a command. Do not start a later
phase before the earlier one's acceptance criteria pass.

Every phase must leave `npm run check` green. That command runs content checks,
media rights, the copy-review gate, typecheck, contrast, unit tests, the build,
and the Playwright suite. If it fails, the phase is not done.

Two recurring gotchas in this repository:

1. **The copy-review gate.** `scripts/content/check-copy-review.ts` hashes the
   bytes of every file under `src/app`, `src/design-system`, `src/features`,
   plus `content/*` and a few others. Any edit to those trips it, even one that
   changes no user-facing words. When you have finished a phase and are sure the
   new user-facing strings are correct, re-record it:
   ```
   HASH=$(npx tsx scripts/content/check-copy-review.ts --hash)
   # then write $HASH into the "hash" field of content/copy-review.json
   ```
   If you added or changed any user-facing **words**, run the `humanizer` skill
   over them before re-recording.

2. **Visual baselines are too lenient to protect you.** `tests/visual.spec.ts`
   uses `maxDiffPixelRatio: 0.08` with `threshold: 0.2`. Large layout changes to
   the graph page pass against a stale baseline. After any phase that changes
   graph rendering, delete and regenerate the graph baselines deliberately:
   ```
   rm tests/visual.spec.ts-snapshots/graph-daylight.png \
      tests/visual.spec.ts-snapshots/graph-duat.png \
      tests/visual.spec.ts-snapshots/graph-mobile.png
   npx playwright test tests/visual.spec.ts --update-snapshots
   ```
   Then **open the new PNGs and look at them**. Do not trust a passing test.

---

## 1. Current state, measured

All numbers below were measured against the built site on 2026-08-31, not
estimated. Re-measure after changes rather than assuming.

| Measurement | Value |
| --- | --- |
| Nodes / edges in `src/generated/graph.json` | 346 / 2295 |
| `graph.json` size | 483 KB (lazy chunk, loads only on `/graph/`) |
| Node kinds | article 70, source 139, deity 43, place 24, period 19, concept 18, text 9, practice 9, role 8, journey 7, object 0 |
| Edge types | `links_to` 861, `draws_from` 1074, **all 17 curated types combined: 360** |
| Nodes shown in the default overview | 90 (top by degree) |
| **Node labels visible in the default overview** | **0** |
| Kinds present in the default overview | article 68, source 21, journey 1. **No deity, place, period, concept, practice, text, or role.** |
| Edges drawn when "Two hops" is selected on Maat | 7, alongside **97 nodes** |
| Nodes drawn with no edge attached, two hops on Maat | **89** |
| Nodes touched by at least one curated edge | 170 of 346 |
| Connected components of the curated layer | **1** (all 170 nodes) |
| Deities with no curated edge | 19 (Isis, Amun-Re, Nephthys, Geb, Khepri, Min, Bes, Apep, …) |
| `object` kind nodes | 0, yet it had a filter chip until recently |

---

## 2. Diagnosis — why the graph teaches nothing

Six defects, in descending order of damage. Each one was reproduced; the root
cause is stated so you fix the cause and not the symptom.

### D1. Nodes cannot be clicked at all *(blocking, and the user's first complaint)*

Clicking any node in the diagram does nothing. The URL never changes and no node
is selected. Verified across four different nodes.

**Root cause.** `GraphView.tsx` `beginNodeDrag` calls
`svgRef.current?.setPointerCapture(event.pointerId)` — it captures the pointer on
the **`<svg>`**, not on the node's `<g>`. Per the Pointer Events spec, while an
element holds pointer capture the subsequent `click` event is retargeted to the
capturing element. A capture-phase listener confirms the click arrives with
`target = .graph-canvas`, so the `onClick` React put on the `<g>` never fires.

Selection by keyboard (`Enter` on a focused node) works, because that is a
different code path. Selection from the search box works. Only the mouse is
broken — which is how essentially every user will try first.

No test caught this: the e2e test named "the graph loads, focuses a node" clicks
the **search result button**, never a node in the diagram.

### D2. The overview is 90 anonymous dots

`src/application.css` sets `.graph-node text { opacity: 0 }` and reveals labels
only on `.is-focused`, `.is-pinned`, or `:hover`. The landing state of the page
is therefore 90 unlabelled circles. Nothing can be read, so nothing can be
learned, so there is no reason to click anything — which compounds D1.

### D3. The default view is archive plumbing, not scholarship

The overview picks the top 90 nodes by raw degree. Degree is dominated by index
pages that link to everything. The actual top of the list is:

> Supplemental research catalog · Coverage map · Source catalog · Sailing south:
> Esna to Aswan · Contested interpretations · Temples, priests, and offerings ·
> Reading route · Chronology · Religion of Ancient Egypt · Sacred geography ·
> Egyptology, museums, and colonial power · Glossary

Five of the top twelve are catalogues and indexes. `build-graph.ts` already
knows these are noise — it keeps a `CONTROL` set (`index`, `log`,
`coverage-map`, `reading-audit`, `source-catalog`, …) and excludes them from
"related reading" at line ~217 — but the graph view does not use that knowledge.

Meanwhile 21 of the 90 are `source:` bibliography groups, and **every deity,
place, period, concept, practice, text, and role is absent.**

### D4. "Two hops" actively makes the picture worse

`diagramEdges` returns only `focusedEdges` (edges incident on the focused node)
whenever a node is focused, while `view.nodes` contains the full one- or two-hop
set. Selecting Maat and switching to two hops draws **97 nodes and 7 edges**: 89
dots float with no visible connection to anything. The control that should
reveal structure destroys it.

### D5. The curated semantic layer — the actual scholarship — is invisible

The archive contains 360 hand-written relations across 17 types
(`maintains`, `threatens`, `restores`, `contested_by`, `reinterpreted_by`, …),
329 of which carry a written `note` explaining *why* the two things are related.
This is the most valuable data in the repository and the most distinctive thing
about the project.

In the default view it is 167 edges buried under 1224 `links_to` / `draws_from`
edges, drawn identically, with the nodes unlabelled.

Critically: **the curated layer is a single connected component of 170 nodes.**
It is not fragmentary. It is a coherent, legible graph that is simply never
shown.

### D6. Data gaps the build does not report

- `entity:sobek` has degree 0 and **no edge to `page:sobek`**, even though the
  article has degree 38. The entity and its article are separate islands.
- 19 of 43 deities have no curated edge at all — Isis, Amun-Re, Nephthys, Geb,
  Khepri, Min, Bes, Apep and others are unreachable by relationship.
- 8 entity nodes duplicate an article node by label; 7 are linked to their
  article, 1 (`entity:sobek`) is not.

The build passes silently. It should not.

---

## 3. State of the art, and what to actually use

### 3.1 What good knowledge-graph explorers do

Surveying current practice (Neo4j Bloom, Kumu, Obsidian's graph view, Linkurious
Ogma, the yFiles knowledge-graph guidance):

1. **Start small and curated, expand on demand.** The recommendation is a
   focused 20–50 node opening view, not everything ranked by degree.
2. **Focus + context.** Hovering or selecting dims everything that is not a
   neighbour rather than hiding it, so local structure reads without losing the
   whole.
3. **Adaptive labelling.** Labels appear by importance and zoom level, never
   all-or-nothing.
4. **Explain the edge.** Show *why* two things are connected, not just that they
   are.
5. **Path finding between two nodes** — "how are these two connected?" is the
   single most requested feature in knowledge-graph tools and the one this
   archive is best equipped to answer, because its edges carry written notes.
6. **Communities / clustering** to give the layout meaning beyond proximity.
7. **Degree-of-interest** ranking so expansion adds the most relevant neighbour
   first rather than an arbitrary one.

This archive currently implements **none** of 1–7, and has a broken version of
the most basic interaction beneath them (D1).

### 3.2 Rendering libraries — evaluation and verdict

| Library | Built for | Verdict here |
| --- | --- | --- |
| [Cosmograph](https://cosmograph.app/library/) `@cosmograph/react` 2.5.1 | GPU force layout, millions of nodes, in-browser DuckDB cross-filtering | **No.** Three orders of magnitude past this problem. |
| [Sigma.js](https://v4.sigmajs.org/) 3.0.3 (+ graphology) | WebGL rendering of large graphs | **No** as a renderer. See below for the graphology half. |
| Cytoscape.js | Graph analysis with built-in algorithms | No. Heavy runtime for algorithms better run at build. |
| react-force-graph / vis-network | Canvas/WebGL force graphs | No. Same objections, fewer benefits. |

**Verdict: do not add a runtime graph rendering library.** This is not
conservatism, it is a fit judgement, and the reasons are specific:

- **Scale does not justify it.** The published guidance is that canvas holds to
  ~5k nodes and WebGL to ~10k. This graph is **346 nodes**. SVG is entirely
  appropriate and gives you real DOM nodes for free, which the accessibility
  story depends on.
- **It would break the determinism invariant.** `build-graph.ts` computes layout
  coordinates at build time specifically so "nothing moves on load … and the
  same view can be reproduced from a URL." A GPU force simulation is animated
  and non-deterministic. Adopting one discards a property the project chose on
  purpose and encodes in its own comments.
- **It would break reduced motion.** The same comment promises "reduced motion
  changes nothing about correctness." A live simulation cannot honour that.
- **It would break the accessible parallel structure.** Every node is currently
  a real focusable `<g role="button">` with an `aria-label`, backed by "Every
  visible node as a list". A WebGL canvas is one opaque element. `npm run check`
  runs axe over `/graph/` in both themes and would need that whole layer rebuilt
  by hand.
- **Budget.** The graph chunk is already 483 KB and the perf test enforces a
  ≤200 ms longest task under 4× CPU throttling with a 64 MB heap ceiling. This
  site ships exactly two runtime dependencies (`react`, `react-dom`) by design.

The bottleneck is **not the renderer**. Swapping in WebGL would leave all six
defects above exactly as they are, at the cost of the project's invariants.

### 3.3 What to adopt instead — graphology at build time

The graphology ecosystem is pure JavaScript with tiny dependency trees. Add it
as **devDependencies** and run it inside `scripts/content/build-graph.ts`. The
results are baked into `graph.json`. **Runtime cost: zero bytes.**

| Package | Version | Buys us |
| --- | --- | --- |
| `graphology` | 0.26.0 | Graph model the others consume |
| `graphology-communities-louvain` | 2.0.2 | Community assignment per node → thematic clusters, colour, and a legend |
| `graphology-metrics` | 2.4.1 | Betweenness centrality → identifies *bridge* ideas that connect otherwise separate parts of the archive |
| `graphology-shortest-path` | 2.1.0 | Path finding between any two nodes |

Louvain on a graph 3× this size runs in ~50 ms, so build time is unaffected.

**Path finding is the feature to build.** It works today — verified by running
BFS over the curated layer by hand:

```
Maat  →  Kom Ombo   (3 hops)
  Maat            --[maintains]-->      Temples, priests, and offerings
      // "Offering ritual is presented as sustaining maat, not only as gift-giving."
  Temples…        --[encountered_at]--> Sailing south: Esna to Aswan
  Sailing south…  --[encountered_at]--> Kom Ombo

Heka  →  Roman Period   (4 hops)
  Heka            --[maintains]-->      Ren (name)
  Ren (name)      --[threatens]-->      Amarna and late transformations
      // "The attack on Amun's name shows what erasure was believed to do."
  Amarna…         --[changes_during]--> Chronology
  Chronology      --[changes_during]--> Roman Period
```

Every hop explains itself from data already in the repository. No other feature
in this spec turns existing content into insight this directly.

---

## 4. Target experience

After all phases:

- The graph opens on the **curated semantic layer** — about 170 labelled nodes
  in one connected component, coloured by community — not a hairball of index
  pages.
- Clicking a node selects it. Dragging still moves it. Both work with a mouse.
- Hovering or selecting dims non-neighbours instead of hiding them.
- Labels appear for important nodes at rest and for everything when the view is
  small.
- Expansion draws every edge among visible nodes, so more hops means more
  structure.
- A "document layer" toggle brings back wiki links and citations for anyone who
  wants them.
- Picking two nodes shows the shortest curated path between them, with each
  hop's written note.
- The build reports orphan entities instead of shipping them silently.

---

## 5. Implementation phases

### Phase 1 — Make the diagram work *(no new dependencies)*

Fixes D1, D2, D4. This is the highest value-per-line work in the spec; do it
first and ship it.

**File: `src/features/graph/GraphView.tsx`**

1.1 **Fix node clicking. — DONE.** Shipped, with two regression tests in
`tests/application.spec.ts` ("a node in the diagram can be selected with the
mouse" and "dragging a node moves it without selecting it"). Both were confirmed
to fail against the old code before the fix landed. Note for anyone writing
similar tests: the desktop project runs at 1280x720 and the first node sits
below the fold, so call `scrollIntoViewIfNeeded()` before `boundingBox()` or the
click lands outside the window. What was done:

Remove the `onClick` handler from the node `<g>`
entirely — it cannot fire while the SVG holds pointer capture. Instead, select
inside `endGesture`, which runs on the element that holds capture:

```tsx
const endGesture = (event: React.PointerEvent<SVGSVGElement>) => {
  const gesture = gestureRef.current;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  // A node gesture that never moved is a click, and the click event itself is
  // retargeted to this element by pointer capture, so selection happens here.
  if (gesture.type === 'node' && !gesture.moved && gesture.nodeId) {
    setFocus(gesture.nodeId);
  }
  gestureRef.current = null;
};
```

Keep the `onKeyDown` Enter/Space handler on the `<g>`. `suppressClickRef` becomes
unused — delete it and its two remaining references.

1.2 **Draw every edge among visible nodes.** Delete the `diagramEdges` memo and
render `view.edges` directly. Keep the `is-active` class on edges incident to the
focused node so focus still reads. This alone fixes the 89 floating dots.

1.3 **Adaptive labels.** Add a memo that decides which labels are legible at
rest:

```tsx
// A label the reader cannot see is a node they cannot learn anything from, so
// the view always names what it can: everything when the slice is small, the
// best-connected nodes when it is not.
const labelled = useMemo(() => {
  if (view.nodes.length <= 45) return new Set(view.nodes.map((n) => n.id));
  return new Set(
    [...view.nodes].sort((a, b) => b.degree - a.degree).slice(0, 30).map((n) => n.id),
  );
}, [view.nodes]);
```

Add `is-labelled` to the node `<g>` class list when `labelled.has(node.id)`.

**File: `src/application.css`**

```css
.graph-node.is-labelled text,
.graph-node.is-focused text,
.graph-node.is-pinned text,
.graph-node:hover text { opacity: 1; }
```

Give the label a halo so it stays readable over edges:

```css
.graph-node text {
  paint-order: stroke;
  stroke: var(--archive-color-surface);
  stroke-width: 2.5px;
}
```

**Acceptance criteria**

- Clicking any node in the diagram changes the URL to `?node=…` and renders the
  "Why these are connected" panel.
- Dragging a node still moves it and does **not** select it.
- With a node focused and "Two hops" selected, the count of nodes with no
  attached edge is **0**.
- The default overview shows at least 30 legible labels.

**Tests to add — `tests/application.spec.ts`, in the `graph` describe block**

```ts
test('a node in the diagram can be selected with the mouse', async ({ page }) => {
  await page.goto('graph/');
  const dot = page.locator('.graph-node__dot').first();
  await expect(dot).toBeVisible();
  const box = await dot.boundingBox();
  if (!box) throw new Error('The first graph node has no hit area');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/node=/);
  await expect(page.getByRole('heading', { name: 'Why these are connected' })).toBeVisible();
});

test('expanding to two hops leaves no node without a relationship', async ({ page }) => {
  await page.goto('graph/?node=entity%3Amaat');
  await page.getByRole('button', { name: 'Two hops' }).click();
  const isolated = await page.evaluate(() => {
    const ends = new Set<string>();
    document.querySelectorAll('.graph-edge line').forEach((l) => {
      ends.add(`${l.getAttribute('x1')},${l.getAttribute('y1')}`);
      ends.add(`${l.getAttribute('x2')},${l.getAttribute('y2')}`);
    });
    let count = 0;
    document.querySelectorAll('.graph-node__dot').forEach((d) => {
      if (!ends.has(`${d.getAttribute('cx')},${d.getAttribute('cy')}`)) count += 1;
    });
    return count;
  });
  expect(isolated).toBe(0);
});
```

---

### Phase 2 — Open on the scholarship *(no new dependencies)*

Fixes D3 and D5.

**File: `scripts/content/build-graph.ts`**

2.1 Hoist the `CONTROL` slug set to a module-level `export const CONTROL_SLUGS`
(it is currently declared inside the related-pages loop). Set `control: true` on
any `page:` node whose slug is in it.

2.2 Add a `semanticDegree` field to every node: the count of incident edges whose
type is **not** `links_to` or `draws_from`.

**File: `src/types/content.ts`** — extend `GraphNode`:

```ts
export interface GraphNode {
  // …existing fields unchanged…
  /** True for archive index and catalogue pages, which link to everything and carry no argument. */
  control?: boolean;
  /** Incident edges that were written by hand rather than derived from links. */
  semanticDegree: number;
}
```

**File: `src/features/graph/GraphView.tsx`**

2.3 Add a layer control. Default **"Curated relations"**; the alternative is
"Everything, including wiki links". Use the existing `Segmented` component from
`src/design-system/components.tsx`:

```tsx
const [layer, setLayer] = useState<'curated' | 'all'>('curated');
```

2.4 In the `view` memo:

- When `layer === 'curated'`, keep only edges whose type is not `links_to` or
  `draws_from`, and keep only nodes with `semanticDegree > 0`.
- Drop nodes with `control === true` unless one is the focused node.
- Replace the "top 90 by degree" overview with: when `layer === 'curated'`, show
  **all** curated nodes (170 — small enough to render and it is one connected
  component). When `layer === 'all'`, keep the existing top-N ranking but rank by
  `semanticDegree` first, then `degree`.

2.5 Reflect `layer` in the URL as `?layer=all` so a view stays reproducible, in
keeping with the existing `?node=` and `?path=` handling.

**Acceptance criteria**

- `/graph/` opens showing deities, places, periods and concepts — assert that at
  least four distinct `kind` values other than `article` and `source` are
  present in the DOM.
- No node labelled "Coverage map", "Source catalog", or "Supplemental research
  catalog" appears in the default view.
- Switching to "Everything, including wiki links" restores a denser graph and
  sets `?layer=all`.
- The status line ("Showing N of 346 nodes…") reports the new counts correctly.

---

### Phase 3 — Build-time analytics *(adds devDependencies)*

```
npm install --save-dev graphology@0.26.0 graphology-communities-louvain@2.0.2 \
  graphology-metrics@2.4.1 graphology-shortest-path@2.1.0
```

These must land in `devDependencies`. They are imported **only** by
`scripts/content/build-graph.ts`. If any of them ever appears in a file under
`src/`, the phase has been done wrong.

**File: `scripts/content/build-graph.ts`**

3.1 After edges are built and before `layout(...)`, construct a graphology
`UndirectedGraph` from the **curated** edges only, and compute:

- `communitiesLouvain.assign(graph)` → read `graph.getNodeAttribute(id, 'community')`
- `betweennessCentrality(graph)` → a normalised 0–1 score per node

3.2 Write both onto the nodes. Extend `GraphNode` again:

```ts
  /** Louvain community over the curated layer. Nodes outside that layer get -1. */
  community: number;
  /** Normalised betweenness over the curated layer, 0–1. Bridges score high. */
  betweenness: number;
```

3.3 Add `communities: { id: number; label: string; size: number }[]` to
`GraphData`. Derive each community's `label` from its highest-betweenness member
(e.g. community 3 → "Around: Temples, priests, and offerings"). Do **not**
invent thematic names; the label must be derived from data.

3.4 Determinism guard. Louvain uses randomness. Pass a fixed seed
(`communitiesLouvain.assign(graph, { rng: seededRng })`) or sort node insertion
order before running, then assert stability: build twice and confirm
`graph.json` is byte-identical. **The existing determinism invariant is not
negotiable.** Add a unit test in `tests/unit/` that builds the graph twice from
the same input and compares the serialised result.

**File: `src/features/graph/GraphView.tsx` / `src/application.css`**

3.5 Colour nodes by community in the curated layer, replacing colour-by-kind
there (keep kind as the node's shape or border so kind is still readable). Add a
legend listing each community with its derived label and size, and make legend
entries clickable to filter to that community.

**Accessibility requirement:** colour must not be the only channel. Keep the
kind in every node's `aria-label` and in the "Every visible node as a list"
section, and add the community label there too.

**Acceptance criteria**

- `npm run build` twice produces byte-identical `src/generated/graph.json`.
- `npm run check` still passes, including the axe scans and the contrast script.
- Bundle: `dist/assets/graph-*.js` grows by less than 5 KB (the analytics are
  data, not code).
- The legend lists between 4 and 12 communities.

---

### Phase 4 — Focus and context *(no new dependencies)*

4.1 On hover or focus of a node, add `is-dimmed` to every node and edge that is
not the node itself or a direct neighbour. Dim with opacity, do not remove
elements — removal breaks the "reproduce from a URL" property and causes layout
thrash.

```css
.graph-canvas.has-hover .graph-node.is-dimmed { opacity: 0.22; }
.graph-canvas.has-hover .graph-edge.is-dimmed { opacity: 0.12; }
```

4.2 Hovering must not change the URL or the selection. It is a transient
highlight only.

4.3 Respect reduced motion: the dim is an opacity change with no transition when
`html[data-motion='reduce']` is set. Add that rule explicitly.

4.4 Show the relation label on every edge of the hovered or focused node, not
only on curated edges (the current code special-cases `edge.type !== 'links_to'`).

**Acceptance criteria**

- Hovering a node dims non-neighbours and leaves the URL unchanged.
- With reduced motion forced, the dim still applies and no transition runs.
- axe passes on `/graph/` in both themes.

---

### Phase 5 — "How are these two connected?" *(the headline feature)*

5.1 **Build side.** In `build-graph.ts`, nothing new is required at build time
beyond Phase 3 — path finding runs at runtime over the already-loaded
`graph.json`. Implement BFS in the view; the curated layer is 170 nodes and 360
edges, so this is microseconds. Do **not** ship `graphology-shortest-path` to the
browser; use it at build time only if you precompute anything.

5.2 **UI.** Add a second node picker beside the existing "Find a node…" field,
labelled "…and". When both are set:

- Compute the shortest path over the **curated** edges.
- Render the path as an ordered list, each step showing
  `source --[relation]--> target` plus the edge's `note` when present.
- Highlight exactly that path in the diagram and dim everything else.
- Encode it in the URL as `?from=<id>&to=<id>` so a path is shareable.

5.3 **When there is no path** (e.g. `deity:sobek` → `entity:akh`, because
`entity:sobek` is an orphan), say so plainly and name the reason: one of the two
nodes has no curated relations yet. Do not render an empty list.

5.4 Reuse the existing `.graph-path` list styles rather than inventing new ones.

**Acceptance criteria**

- `?from=entity:maat&to=place:kom-ombo` renders a 3-step path, each step naming
  its relation, and at least one step showing a note.
- A pair with no curated path renders an explanation, not an empty list.
- The path is keyboard reachable and appears in the DOM as a real ordered list.

**Test to add**

```ts
test('the graph explains how two nodes are connected', async ({ page }) => {
  await page.goto('graph/?from=entity%3Amaat&to=place%3Akom-ombo');
  const steps = page.locator('.graph-path li');
  await expect(steps).not.toHaveCount(0);
  await expect(steps.first()).toContainText('maintains');
});
```

---

### Phase 6 — Report the data gaps *(build-time only)* — DONE

Shipped as `reportGaps()` in `scripts/content/build-graph.ts`, covered by the
unit test "reports entities no relation reaches, without failing the build".
`npm run content:check` now prints 25 warnings and still exits 0. Warnings are
attributed to the file where the relation would be written (`content/entities`,
`content/journeys`, `content/places.json`, `content/periods.json`), not to a
single hardcoded path. Four journeys turned up alongside the 19 deities: they
carry only `draws_from` edges, which the build derives rather than curates.

Original specification follows.

The archive's stated principle is that the build refuses to ship broken content.
Extend that to the graph.

**File: `scripts/content/build-graph.ts`** — push to the existing `problems`
array (it already threads through `BuildGraphInput`):

- **warning** for any entity node with `semanticDegree === 0`. Currently 19
  deities plus `entity:sobek`.
- **warning** for any entity node whose label matches an article title but which
  has no edge to that article. Currently exactly one: `entity:sobek` ↔
  `page:sobek`.
- **warning** for any declared `NodeKind` with zero nodes. Currently `object`.

Warnings, not errors — this is a content backlog, not a build break. They will
surface through `npm run content:check`, which already prints
`N errors, M warnings`.

**Acceptance criteria**

- `npm run content:check` reports roughly 21 new warnings and still exits 0.
- The message for each names the node id and what is missing.

---

## 6. Invariants that must not break

Check every one of these before calling any phase done.

1. **Deterministic layout.** Coordinates come from the build. Two consecutive
   builds must produce byte-identical `src/generated/graph.json`.
2. **Reduced motion changes nothing about correctness.** No feature may depend
   on animation to be understood.
3. **The URL reproduces the view.** Every new piece of state (`layer`, `from`,
   `to`, community filter) goes in the query string.
4. **A parallel accessible structure exists.** "Every visible node as a list" and
   "Every visible relationship as a list" must stay in sync with the diagram.
   Anything the diagram can express, those lists must also express.
5. **axe passes on `/graph/` in both themes.** Enforced by `npm run check`.
6. **Colour is never the only channel.** Community colour must be accompanied by
   text.
7. **Runtime dependencies stay at `react` + `react-dom`.** Everything else is a
   devDependency used at build time.
8. **Performance budgets hold** — longest task ≤ 200 ms at 4× CPU throttle, heap
   ≤ 64 MB.
9. **Print styles still work.** `.graph-controls` and `.graph-viewport` are
   hidden in print; the lists carry the content.
10. **The copy-review gate is re-recorded**, after the humanizer pass if any
    user-facing words changed.

---

## 7. Explicitly out of scope

Do not do these, even though they may seem related:

- Adding Cosmograph, Sigma.js, Cytoscape, react-force-graph, D3, or any runtime
  graph library. See §3.2 — the reasoning is not "keep it simple", it is that
  they solve a problem this graph does not have while breaking properties it
  depends on.
- Live force simulation in the browser.
- 3D rendering.
- Changing the wiki content in `llm-wiki/` to add missing relations. Phase 6
  *reports* the gaps; filling them is editorial work for the author, not a code
  change.
- Rewriting `layout()` in `build-graph.ts`. It is deterministic and adequate.
  Revisit only if Phase 2's smaller default view looks poor, and then keep it
  deterministic.
- Tightening the visual-baseline tolerance. It genuinely should be tightened
  (see §0), but that touches every route's baseline and belongs in its own
  change.

---

## 8. Final verification checklist

```
npm run check                  # must be green
npm run build && shasum src/generated/graph.json
npm run build && shasum src/generated/graph.json   # identical to the line above
ls -la dist/assets/graph-*.js  # compare against the 483 KB baseline
```

Manual checks, in a browser, at 1440px and 390px, in both themes:

- [ ] Click a node — it selects.
- [ ] Drag a node — it moves and does not select.
- [ ] The opening view shows named deities, places and periods.
- [ ] Two hops adds structure, not floating dots.
- [ ] Hover dims non-neighbours.
- [ ] Two picked nodes produce an explained path.
- [ ] Every one of the above is reachable by keyboard alone.
- [ ] The node and relationship lists below the diagram match what is drawn.

---

## Appendix A — Reproducing the measurements

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173 &

# Composition of the default overview
node -e "
const g=require('./src/generated/graph.json');
const r=[...g.nodes].sort((a,b)=>b.degree-a.degree).slice(0,90);
const k={}; r.forEach(n=>k[n.kind]=(k[n.kind]||0)+1); console.log(k);
console.log(r.slice(0,12).map(n=>n.kind+':'+n.label));
"

# Size and shape of the curated layer
node -e "
const g=require('./src/generated/graph.json');
const DOC=new Set(['links_to','draws_from']);
const sem=g.edges.filter(e=>!DOC.has(e.type));
const ids=new Set(); sem.forEach(e=>{ids.add(e.from);ids.add(e.to);});
console.log('curated edges',sem.length,'nodes',ids.size);
"
```

For the click and two-hop defects, drive Playwright directly — see the tests in
Phases 1 and 5, which encode the same probes used to find them.

## Appendix B — Sources consulted

- [Cosmograph library](https://cosmograph.app/library/) and [library comparison](https://cosmograph.app/library/compare/)
- [Sigma.js v4](https://v4.sigmajs.org/)
- [Cytoscape vs vis-network vs Sigma, 2026 decision guide](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)
- [Top JavaScript graph visualization libraries — Linkurious](https://linkurious.com/blog/top-javascript-graph-libraries/)
- [Memgraph: fast, easy-to-use, popular — pick two](https://memgraph.com/blog/you-want-a-fast-easy-to-use-and-popular-graph-visualization-tool)
- [yFiles: guide to visualizing knowledge graphs](https://www.yfiles.com/resources/how-to/guide-to-visualizing-knowledge-graphs)
- [graphology-communities-louvain](https://www.npmjs.com/package/graphology-communities-louvain)
- [Neo4j: graph algorithms for community detection](https://neo4j.com/blog/graph-data-science/graph-algorithms-community-detection-recommendations/)
