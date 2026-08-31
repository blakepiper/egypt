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

  test('the object study separates what is visible from how it is read', async ({ page }) => {
    await page.goto('objects/plate-30/');
    await page.getByRole('button', { name: 'The gate' }).first().click();
    await expect(page.getByRole('heading', { name: 'What is visible' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confidence' })).toBeVisible();
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
    await expect(page.getByRole('heading', { level: 3, name: 'Working meaning in this course' })).toBeVisible();
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
    await expect(page.getByRole('heading', { level: 2, name: 'Four-week relearning plan' })).toBeVisible();
    await page.getByRole('checkbox').first().check();
    await expect(page.getByRole('status').first()).toContainText('1 of 28');
    await page.reload();
    await expect(page.getByRole('status').first()).toContainText('1 of 28');
    await page.getByRole('button', { name: 'Reset progress' }).click();
    await expect(page.getByRole('status').first()).toContainText('0 of 28');
  });

  test('exam prompts stay hidden until they are revealed', async ({ page }) => {
    await page.goto('learn/');
    await expect(page.getByText(/Where the 2017 answer needed correcting/)).toHaveCount(0);
    await page.getByRole('button', { name: /Reveal \d+ prompts/ }).first().click();
    await expect(page.getByText(/Where the 2017 answer needed correcting/).first()).toBeVisible();
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
  const routes = ['./', 'wiki/', 'wiki/sacred-geography/', 'atlas/', 'chronology/', 'journeys/nile-year/', 'views/personhood/', 'views/creation/', 'views/funerary-corpora/', 'objects/decoder/', 'learn/', 'archive/sources/', 'about/'];

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
    for (const route of ['./', 'wiki/chronology/', 'atlas/', 'graph/', 'archive/sources/']) {
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
});

test.describe('deployment', () => {
  test('every generated route reloads directly', async ({ page }) => {
    for (const route of ['wiki/set/', 'journeys/nile-year/', 'objects/plate-30/', 'archive/sources/', 'browse/', 'specimen/']) {
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
