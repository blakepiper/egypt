// End-to-end coverage of the reading path, search, the graph, and the release
// conditions that only show up in a real browser: keyboard use, reduced motion,
// narrow viewports, print, and direct route reloads.

import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function noViolations(page: Page, disable: string[] = []) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(disable)
    .analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
}

test.describe('reading', () => {
  test('an article renders headings, tables, links, sources, and backlinks', async ({ page }) => {
    await page.goto('wiki/sacred-geography/');
    await expect(page.getByRole('heading', { level: 1, name: 'Sacred geography' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Cult centers to remember' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sources cited on this page' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What links here' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nearby in the graph' })).toBeVisible();
  });

  test('a wiki link navigates without a full page load and keeps a durable URL', async ({ page }) => {
    await page.goto('wiki/start-here/');
    await page.getByRole('link', { name: 'maat and isfet' }).first().click();
    await expect(page).toHaveURL(/\/wiki\/maat-isfet-and-kingship\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Maat');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Maat');
  });

  test('a section permalink scrolls and stays linkable', async ({ page }) => {
    await page.goto('wiki/creation-traditions/');
    const heading = page.locator('#memphis-ptahs-heart-and-tongue');
    await expect(heading).toBeVisible();
    await page.goto('wiki/creation-traditions/#memphis-ptahs-heart-and-tongue');
    await expect(heading).toBeInViewport();
  });

  test('opening articles creates tabs that can be closed and reset', async ({ page }) => {
    await page.goto('wiki/set/');
    const tabs = page.getByRole('region', { name: 'Open articles' });
    await expect(tabs.getByRole('link', { name: 'Set' })).toBeVisible();
    await page.goto('wiki/sobek/');
    await expect(tabs.getByRole('link', { name: 'Sobek' })).toBeVisible();
    await tabs.getByRole('button', { name: 'Close Set' }).click();
    await expect(tabs.getByRole('link', { name: 'Set' })).toHaveCount(0);
    await tabs.getByRole('button', { name: 'Reset desktop' }).click();
    await expect(tabs).toHaveCount(0);
  });

  test('a glossary term is defined the first time it is used', async ({ page }) => {
    await page.goto('wiki/personhood-and-the-afterlife/');
    const triggers = page.locator('.term-definition__trigger');
    await expect(triggers.first()).toBeVisible();
    const first = triggers.first();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.term-definition__body').first()).toBeVisible();
    // Only the first use is annotated, so a common term appears once as a control.
    const labels = await triggers.allInnerTexts();
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('references to the unpublished source archive are not broken links', async ({ page }) => {
    await page.goto('wiki/source-catalog/');
    const raw = page.locator('.article-link--raw').first();
    await expect(raw).toBeVisible();
    await expect(raw).not.toHaveAttribute('href', /.+/);
  });

  test('an unknown route shows a useful page rather than a hosting error', async ({ page }) => {
    await page.goto('wiki/not-a-real-page/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/not in the archive|no page at that address/i);
    await expect(page.getByRole('link', { name: /search the archive|browse the index/i }).first()).toBeVisible();
  });

  test('illustrated articles request only local responsive derivatives', async ({ page, baseURL }) => {
    const images: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'image') images.push(request.url());
    });
    await page.goto('wiki/sobek/');
    const image = page.getByRole('img', { name: /tiny mottled-stone crocodile/i });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('width', '1280');
    await expect(image).toHaveAttribute('height', '960');
    await expect.poll(() => images.some((url) => /falcon-headed-crocodile-(480|960|1280)\.(avif|webp|jpg)$/.test(url))).toBe(true);
    expect(images.every((url) => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);
  });
});

test.describe('search', () => {
  test('opens with a keyboard shortcut, ranks titles first, and navigates', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search the archive' });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('searchbox');
    await input.fill('sobek');
    const first = dialog.getByRole('option').first();
    await expect(first).toContainText('Sobek');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/wiki\/sobek\/$/);
  });

  test('closes on Escape and restores focus', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('the full search route finds a source ID and filters by section', async ({ page }) => {
    await page.goto('search/');
    await page.getByRole('searchbox').first().fill('C22');
    await expect(page.getByRole('option').first()).toContainText(/temple|priest/i);
    await page.getByRole('group', { name: 'Evidence' }).getByRole('button', { name: 'Scholarship' }).click();
    await expect(page.getByRole('option').first()).toBeVisible();
  });

  test('research provenance is searchable and can be filtered by origin', async ({ page }) => {
    await page.goto('search/');
    const input = page.getByRole('searchbox').first();
    await input.fill('R082');
    await expect(page.getByRole('option').first()).toContainText(/Living Nile|camel|community/i);
    await page.getByRole('group', { name: 'Origin' }).getByRole('button', { name: 'Supplemental research' }).click();
    await expect(page.getByRole('option').first()).toBeVisible();
    await page.getByRole('group', { name: 'Origin' }).getByRole('button', { name: 'Course archive' }).click();
    await expect(page.getByRole('option')).toHaveCount(0);
  });
});

test.describe('graph, atlas, and chronology', () => {
  test('the graph loads, focuses a node, and lists it accessibly', async ({ page }) => {
    await page.goto('graph/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Follow the relationships');
    await page.getByPlaceholder('Find a node…').fill('Maat');
    await page.getByRole('button', { name: /^Maat/ }).first().click();
    await expect(page).toHaveURL(/node=/);
    await expect(page.getByRole('heading', { name: 'Why these are connected' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Every visible node as a list' })).toBeVisible();
    const relationships = page.locator('details.graph-list--edges');
    await expect(relationships).toContainText('Every visible relationship as a list');
    await relationships.locator('summary').click();
    await expect(relationships.locator('ul')).toBeVisible();
    await expect(relationships.locator('li')).not.toHaveCount(0);
  });

  // The drag gesture captures the pointer on the svg, which retargets the click
  // away from the node. Selection has to survive that, and only a real mouse
  // click proves it: the keyboard and the search box take other routes in.
  test('a node in the diagram can be selected with the mouse', async ({ page }) => {
    await page.goto('graph/');
    const dot = page.locator('.graph-node__dot').first();
    await expect(dot).toBeVisible();
    await dot.scrollIntoViewIfNeeded();
    const box = await dot.boundingBox();
    if (!box) throw new Error('The first graph node has no hit area');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/node=/);
    await expect(page.getByRole('heading', { name: 'Why these are connected' })).toBeVisible();
  });

  test('dragging a node moves it without selecting it', async ({ page }) => {
    await page.goto('graph/');
    const dot = page.locator('.graph-node__dot').first();
    await expect(dot).toBeVisible();
    await dot.scrollIntoViewIfNeeded();
    const box = await dot.boundingBox();
    if (!box) throw new Error('The first graph node has no hit area');
    const before = await dot.getAttribute('cx');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 44, box.y + 28, { steps: 5 });
    await page.mouse.up();
    await expect(dot).not.toHaveAttribute('cx', before ?? '');
    await expect(page).not.toHaveURL(/node=/);
  });

  test('expanding to two hops leaves no node without a relationship', async ({ page }) => {
    await page.goto('graph/?node=entity%3Amaat');
    await page.getByRole('button', { name: 'Two hops' }).click();
    const isolated = await page.evaluate(() => {
      const ends = new Set<string>();
      document.querySelectorAll('.graph-edge line').forEach((line) => {
        ends.add(`${line.getAttribute('x1')},${line.getAttribute('y1')}`);
        ends.add(`${line.getAttribute('x2')},${line.getAttribute('y2')}`);
      });
      let count = 0;
      document.querySelectorAll('.graph-node__dot').forEach((dot) => {
        if (!ends.has(`${dot.getAttribute('cx')},${dot.getAttribute('cy')}`)) count += 1;
      });
      return count;
    });
    expect(isolated).toBe(0);
  });

  test('the default overview names important nodes', async ({ page }) => {
    await page.goto('graph/');
    await expect(page.locator('.graph-node').first()).toBeVisible();
    const visibleLabels = await page.locator('.graph-node text').evaluateAll((labels) => labels.filter((label) => getComputedStyle(label).opacity !== '0').length);
    expect(visibleLabels).toBeGreaterThanOrEqual(30);
  });

  test('the default graph opens on curated scholarship', async ({ page }) => {
    await page.goto('graph/');
    await expect(page.locator('.graph-node').first()).toBeVisible();
    await expect(page.getByRole('group', { name: 'Layer' })).toBeVisible();
    const kinds = await page.locator('.graph-node').evaluateAll((nodes) => Array.from(new Set(
      nodes.flatMap((node) => Array.from(node.classList).filter((name) => name.startsWith('graph-node--')).map((name) => name.slice('graph-node--'.length))),
    )));
    expect(kinds.filter((kind) => !['article', 'source'].includes(kind)).length).toBeGreaterThanOrEqual(4);
    await expect(page.getByRole('button', { name: 'Coverage map', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Source catalog', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Supplemental research catalog', exact: true })).toHaveCount(0);
    await expect(page.locator('.graph-controls__status p')).toContainText('Showing 170 of 346 nodes and 360 of 2295 relationships');
  });

  test('the document layer is optional and shareable', async ({ page }) => {
    await page.goto('graph/');
    await expect(page.locator('.graph-node').first()).toBeVisible();
    const curatedEdges = await page.locator('.graph-edge').count();
    await page.getByRole('group', { name: 'Layer' }).getByRole('button', { name: 'Everything, including wiki links' }).click();
    await expect(page).toHaveURL(/layer=all/);
    await expect(page.locator('.graph-controls__status p')).toContainText('Showing 90 of 346 nodes and');
    const allEdges = await page.locator('.graph-edge').count();
    expect(allEdges).toBeGreaterThan(curatedEdges);
  });

  test('communities are named and filterable beyond their colours', async ({ page }) => {
    await page.goto('graph/');
    const legend = page.locator('.graph-legend');
    await expect(legend).toBeVisible();
    const entries = legend.getByRole('button');
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(12);
    await entries.first().click();
    await expect(page).toHaveURL(/community=\d+/);
    await expect(entries.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('section.graph-list')).toContainText('Around:');
  });

  test('hovering a node dims distant context without changing the URL', async ({ page }) => {
    await page.goto('graph/?node=entity%3Amaat');
    await expect(page.locator('.graph-node').first()).toBeVisible();
    const before = page.url();
    await page.locator('.graph-node').first().hover();
    await expect(page).toHaveURL(before);
    await expect(page.locator('.graph-node.is-dimmed')).not.toHaveCount(0);
    await expect(page.locator('.graph-edge.is-dimmed')).not.toHaveCount(0);
  });

  test('keyboard focus keeps the context treatment usable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('graph/');
    const node = page.locator('.graph-node').first();
    await expect(node).toBeVisible();
    await node.focus();
    await expect(page.locator('.graph-canvas.has-hover')).toBeVisible();
    await expect(page.locator('.graph-node.is-dimmed')).not.toHaveCount(0);
    await expect(node).toHaveCSS('transition-property', 'none');
  });

  test('the graph canvas supports zooming, panning, and node dragging', async ({ page }) => {
    await page.goto('graph/');
    await expect(page.locator('.graph-node').first()).toBeVisible();
    const canvas = page.locator('.graph-canvas');
    const camera = canvas.locator(':scope > g');
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(camera).toHaveAttribute('transform', /scale\(1\.25\)/);

    const node = page.locator('.graph-node').first();
    const dot = node.locator('.graph-node__dot');
    await dot.scrollIntoViewIfNeeded();
    const dotBox = await dot.boundingBox();
    if (!dotBox) throw new Error('The first graph node has no hit area');
    const beforeNode = await dot.getAttribute('cx');
    await page.mouse.move(dotBox.x + dotBox.width / 2, dotBox.y + dotBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dotBox.x + dotBox.width / 2 + 32, dotBox.y + dotBox.height / 2 + 18, { steps: 4 });
    await page.mouse.up();
    await expect(dot).not.toHaveAttribute('cx', beforeNode ?? '');

    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('The graph canvas has no hit area');
    const beforePan = await camera.getAttribute('transform');
    await page.mouse.move(canvasBox.x + 12, canvasBox.y + 12);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 30, canvasBox.y + 26, { steps: 3 });
    await page.mouse.up();
    await expect(camera).not.toHaveAttribute('transform', beforePan ?? '');
  });

  test('the atlas selects a place from the list and the map stays in sync', async ({ page }) => {
    await page.goto('atlas/');
    await page.getByRole('button', { name: 'Thebes' }).first().click();
    await expect(page).toHaveURL(/place=thebes/);
    await expect(page.getByRole('heading', { level: 2, name: 'Thebes' })).toBeVisible();
  });

  test('the chronology marks approximate dates in the table', async ({ page }) => {
    await page.goto('chronology/');
    const row = page.getByRole('row', { name: /Old Kingdom/ }).first();
    await expect(row).toContainText('Yes');
    await page.getByRole('button', { name: /Ptolemaic Period/ }).first().click();
    await expect(page.getByRole('complementary').first()).toContainText('332 BCE');
  });
});

test.describe('journeys and objects', () => {
  test('a journey steps forward and states its evidence boundary', async ({ page }) => {
    await page.goto('journeys/temple-morning/');
    await expect(page.getByRole('heading', { level: 2, name: 'The pylon' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'The open court' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How this was reconstructed' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The whole journey as text' })).toBeVisible();
  });

  test('J01 exposes all twelve stages, public route stops, and scene reading', async ({ page }) => {
    await page.goto('journeys/esna-to-aswan-dahabiya/');
    await expect(page.getByRole('heading', { level: 1, name: 'Sailing south: Esna to Aswan' })).toBeVisible();
    await expect(page.locator('.journey__steps button')).toHaveCount(12);
    await expect(page.getByText(/private promotional itinerary/i).first()).toBeVisible();
    await expect(page.getByText('Read alongside this stage', { exact: true })).toBeVisible();
    await expect(page.locator('.journey-route__list li')).toHaveCount(8);
    await expect(page.locator('.journey-route')).not.toContainText('El Hegz');
    await expect(page.locator('.journey__transcript')).toContainText('El Hegz');
    await page.locator('.journey__steps button').nth(11).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Aswan checkout' })).toBeVisible();
    await expect(page.getByText(/not included in this journey/i)).toBeVisible();
  });

  test('J01 stages expose tab semantics and keyboard progression', async ({ page }) => {
    await page.goto('journeys/esna-to-aswan-dahabiya/');
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(12);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await tabs.nth(0).press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[role="tabpanel"]')).toHaveAttribute('aria-labelledby', 'journey-tab-esna');
    await expect(page.getByRole('status')).toContainText('Stage 2 of 12');
  });

  test('the object study separates what is visible from how it is read', async ({ page }) => {
    await page.goto('objects/plate-30/');
    await page.getByRole('button', { name: 'The gate' }).first().click();
    await expect(page.getByRole('heading', { name: 'What is visible' })).toBeVisible();
    await expect(page.getByText('No gate appears in frame 30.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confidence' })).toBeVisible();
  });

  test('the Plate 30 viewer zooms, resets by keyboard, and loads local tiles', async ({ page }) => {
    const tileRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/media/ani-plate-30/tiles/')) tileRequests.push(request.url());
    });
    await page.goto('objects/plate-30/');
    const viewer = page.getByRole('group', { name: /Framed papyrus.*arrow keys/i });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole('button', { name: 'Osiris under the canopy' })).toBeVisible();
    await expect(viewer.getByRole('button', { name: 'The gate', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'The gate', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(page.getByRole('status').filter({ hasText: '150%' })).toBeVisible();
    await viewer.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Home');
    await expect(page.getByRole('status').filter({ hasText: '100%' })).toBeVisible();
    await expect(page.getByText(/Trustees of the British Museum/).first()).toBeVisible();
    expect(tileRequests.length).toBeGreaterThan(0);
  });

  test('the decoder filters its groups', async ({ page }) => {
    await page.goto('objects/decoder/');
    await page.getByPlaceholder('Filter signs and cues…').fill('djed');
    await expect(page.getByRole('definition').first()).toContainText(/stability/i);
  });
});

test.describe('interactive views', () => {
  test('the personhood constellation selects an aspect and duplicates it as a table', async ({ page }) => {
    await page.goto('views/personhood/');
    await page.getByRole('button', { name: 'ka', exact: true }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Working meaning' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: /ka/ }).first()).toBeVisible();
  });

  test('creation traditions can be compared and share a stated grammar', async ({ page }) => {
    await page.goto('views/creation/');
    await expect(page.getByRole('heading', { level: 2, name: 'Heliopolis' })).toBeVisible();
    await page.getByRole('button', { name: 'Lotus/water-lily creation' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Lotus/water-lily creation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What they share' })).toBeVisible();
  });

  test('the corpus river rejects the replacement model in text as well as in the diagram', async ({ page }) => {
    await page.goto('views/funerary-corpora/');
    await page.getByRole('button', { name: /Coffin Texts/ }).first().click();
    await expect(page.getByRole('heading', { level: 2, name: 'Coffin Texts' })).toBeVisible();
    await expect(page.getByText(/democratization/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How this was reconstructed' })).toBeVisible();
  });
});

test.describe('learn', () => {
  test('the four-week plan keeps progress and can reset it', async ({ page }) => {
    await page.goto('learn/');
    await expect(page.getByRole('heading', { level: 2, name: 'Four-week learning plan' })).toBeVisible();
    await page.getByRole('checkbox').first().check();
    await expect(page.getByRole('status').first()).toContainText('1 of 28');
    await page.reload();
    await expect(page.getByRole('status').first()).toContainText('1 of 28');
    await page.getByRole('button', { name: 'Reset progress' }).click();
    await expect(page.getByRole('status').first()).toContainText('0 of 28');
  });

  test('concept prompts stay hidden until they are revealed', async ({ page }) => {
    await page.goto('learn/');
    await expect(page.getByText(/Interpretive caution/)).toHaveCount(0);
    await page.getByRole('button', { name: /Reveal \d+ prompts/ }).first().click();
    await expect(page.getByText(/Interpretive caution/).first()).toBeVisible();
  });

  test('the expanded learning paths are discoverable with their deliberate sequence', async ({ page }) => {
    await page.goto('learn/');
    for (const title of [
      'What religion does', 'How an early state formed', 'Ritual, continuity, and uncertainty',
      'Permanence, suffering, and impermanence', 'The afterlives of Egypt', 'Vulnerable bodies and practical care',
      'Material and more-than-human religion', 'Prepare for the Esna-to-Aswan journey',
    ]) await expect(page.getByRole('heading', { level: 3, name: title })).toBeVisible();
  });
});

test.describe('preferences', () => {
  test('the theme toggle switches to the Duat palette and persists', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Use the Duat theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'duat');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'duat');
  });

  test('stored data can be cleared from the about page', async ({ page }) => {
    await page.goto('wiki/set/');
    await page.getByRole('button', { name: 'Bookmark' }).click();
    await page.goto('about/');
    await expect(page.getByRole('heading', { name: /Bookmarks \(1\)/ })).toBeVisible();
    await page.getByRole('button', { name: 'Clear everything stored in this browser' }).click();
    await expect(page.getByRole('heading', { name: /Bookmarks \(0\)/ })).toBeVisible();
  });
});

test.describe('accessibility and layout', () => {
  const routes = ['./', 'wiki/', 'wiki/sacred-geography/', 'atlas/', 'chronology/', 'journeys/nile-year/', 'journeys/esna-to-aswan-dahabiya/', 'views/personhood/', 'views/creation/', 'views/funerary-corpora/', 'objects/plate-30/', 'objects/decoder/', 'learn/', 'archive/sources/', 'archive/sources/?catalog=research', 'about/'];

  for (const route of routes) {
    test(`${route} has no automated accessibility violations`, async ({ page }) => {
      await page.goto(route);
      await noViolations(page);
    });
  }

  test('the graph route passes an accessibility scan once loaded', async ({ page }) => {
    await page.goto('graph/');
    await expect(page.getByRole('heading', { name: 'Every visible node as a list' })).toBeVisible();
    await noViolations(page);
  });

  test('the Duat theme passes the same scans', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Use the Duat theme' }).click();
    for (const route of ['wiki/solar-cycle/', 'chronology/', 'journeys/twelve-guarded-hours/']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'duat');
      await noViolations(page);
    }
  });

  test('no route overflows the document horizontally', async ({ page }) => {
    for (const route of ['./', 'wiki/chronology/', 'atlas/', 'graph/', 'journeys/esna-to-aswan-dahabiya/', 'archive/sources/']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflows`).toBeLessThanOrEqual(1);
    }
  });

  test('the skip link reaches the main landmark', async ({ page }) => {
    await page.goto('wiki/set/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to the archive' })).toBeFocused();
  });

  test('reduced motion is honoured', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('journeys/solar-cycle/');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await expect(page.locator('.journey__scene')).toHaveClass(/is-static/);
  });

  test('the research source route keeps the private itinerary non-disclosive', async ({ page }) => {
    await page.goto('archive/sources/?catalog=research#r069');
    const itinerary = page.locator('#r069');
    await expect(itinerary).toBeVisible();
    await expect(itinerary.locator('a[href*="raw"], a[href*="\.pdf"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('/Users/');
  });
});

test.describe('deployment', () => {
  test('every generated route reloads directly', async ({ page }) => {
    for (const route of ['wiki/set/', 'journeys/nile-year/', 'journeys/esna-to-aswan-dahabiya/', 'objects/plate-30/', 'archive/sources/', 'browse/', 'specimen/']) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('#main-content')).not.toBeEmpty();
    }
  });

  test('an ordinary article route loads neither the graph nor the search index', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));
    await page.goto('wiki/sobek/');
    await expect(page.getByRole('heading', { name: 'What links here' })).toBeVisible();
    expect(requested.filter((url) => /search-index|\/graph-/.test(url))).toEqual([]);
    // Opening search pulls the index in on demand.
    await page.keyboard.press('Control+k');
    await page.getByRole('dialog').getByRole('searchbox').fill('maat');
    await expect(page.getByRole('option').first()).toBeVisible();
    expect(requested.some((url) => url.includes('search-index'))).toBe(true);
  });

  test('each route carries its own title and description', async ({ page }) => {
    await page.goto('wiki/sobek/');
    await expect(page).toHaveTitle(/Sobek — The Living Archive/);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toMatch(/Sobek|crocodile/i);
  });
});

test.describe('base path', () => {
  test('assets and internal links use the configured base', async ({ page, baseURL }) => {
    const base = new URL(baseURL!).pathname;
    await page.goto('wiki/set/');
    const script = await page.locator('script[type="module"]').first().getAttribute('src');
    expect(script?.startsWith(base)).toBe(true);
    const link = await page.getByRole('link', { name: 'Home' }).first().getAttribute('href');
    expect(link).toBe(base);
    const failures: string[] = [];
    page.on('response', (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto('graph/');
    await expect(page.getByRole('heading', { name: 'Every visible node as a list' })).toBeVisible();
    expect(failures).toEqual([]);
  });
});
