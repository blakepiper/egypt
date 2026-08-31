import { expect, test } from '@playwright/test';

const routes = [
  { id: 'article', path: 'wiki/start-here/', ready: 'Start here' },
  { id: 'atlas', path: 'atlas/', ready: 'Upstream is south' },
  { id: 'graph', path: 'graph/', ready: 'Follow the relationships' },
  { id: 'journey', path: 'journeys/solar-cycle/', ready: 'Solar cycle' },
  { id: 'j01', path: 'journeys/esna-to-aswan-dahabiya/', ready: 'Sailing south: Esna to Aswan' },
  { id: 'object', path: 'objects/plate-30/', ready: 'Book of the Dead, Plate 30' },
];

test.describe('visual baselines', () => {
  test.skip(({ isMobile }) => isMobile, 'The release baselines use the fixed desktop viewport.');
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });

  for (const theme of ['daylight', 'duat'] as const) {
    for (const route of routes) {
      test(`${route.id} in ${theme}`, async ({ page }) => {
        await page.addInitScript((selectedTheme) => {
          localStorage.setItem('living-archive:v1', JSON.stringify({ version: 1, theme: selectedTheme }));
        }, theme);
        await page.goto(route.path);
        await expect(page.getByRole('heading', { level: 1, name: route.ready })).toBeVisible();
        if (theme === 'duat') await expect(page.locator('html')).toHaveAttribute('data-theme', 'duat');
        await expect(page).toHaveScreenshot(`${route.id}-${theme}.png`, {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixelRatio: 0.08,
          threshold: 0.2,
        });
      });
    }
  }
});

test.describe('mobile layout baselines', () => {
  test.skip(({ isMobile }) => !isMobile, 'These baselines use the iPhone viewport.');
  test.use({ colorScheme: 'light' });

  for (const route of [
    { id: 'article-mobile', path: 'wiki/ritual-uncertainty-and-continuity/', ready: 'Ritual, uncertainty, and continuity' },
    { id: 'j01-mobile', path: 'journeys/esna-to-aswan-dahabiya/', ready: 'Sailing south: Esna to Aswan' },
    { id: 'graph-mobile', path: 'graph/', ready: 'Follow the relationships' },
  ]) {
    test(route.id, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1, name: route.ready })).toBeVisible();
      await expect(page).toHaveScreenshot(`${route.id}.png`, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.08,
        threshold: 0.2,
      });
    });
  }
});
