import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('explores concepts and switches major views', async ({ page }) => {
  await page.goto('specimen/');
  await expect(page.getByRole('heading', { name: /religion as a/i })).toBeVisible();

  await page.getByRole('button', { name: /lived religion/i }).click();
  await expect(page.getByRole('heading', { name: 'Lived religion' })).toBeVisible();
  await expect(page.getByText('festivals-oracles-and-personal-piety.md')).toBeVisible();

  await page.getByRole('button', { name: /journeys/i }).click();
  await expect(page.getByRole('heading', { name: /approaching the divine/i })).toBeVisible();

  await page.getByRole('button', { name: /system/i }).click();
  await expect(page.getByRole('heading', { name: /digital field instrument/i })).toBeVisible();
});

test('search and theme controls work', async ({ page }) => {
  await page.goto('specimen/');
  // The specimen is a lazy route: wait for it to mount before using its shortcut.
  await expect(page.getByRole('button', { name: /search the archive/i }).first()).toBeVisible();
  await page.keyboard.press('Control+k');
  const search = page.getByRole('textbox', { name: 'Search topics' });
  await expect(search).toBeFocused();
  await search.fill('creation');
  await page.getByRole('dialog').getByRole('button', { name: /creation/i }).click();
  await expect(page.getByRole('heading', { name: 'Creation' })).toBeVisible();

  await page.getByRole('button', { name: /enter duat/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'duat');
});

test('mobile layout has no document-level horizontal overflow', async ({ page }) => {
  await page.goto('specimen/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
});

test('primary view has no automated accessibility violations', async ({ page }) => {
  await page.goto('specimen/');
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations).toEqual([]);
});

test('managed desktop windows drag, minimize, maximize, close, and restore', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Dragging is intentionally disabled in the mobile document flow.');
  await page.goto('specimen/');
  const nileWindow = page.getByRole('region', { name: 'The Nile year' });
  await expect(nileWindow).toBeVisible();

  await nileWindow.getByRole('button', { name: 'Minimize window' }).click();
  await expect(nileWindow.getByText('Inundation')).toBeHidden();
  await nileWindow.getByRole('button', { name: 'Restore window' }).click();
  await expect(nileWindow.getByText('Inundation')).toBeVisible();

  await nileWindow.getByRole('button', { name: 'Maximize window' }).click();
  await expect(nileWindow).toHaveClass(/archive-window--maximized/);
  await nileWindow.getByRole('button', { name: 'Restore window size' }).click();

  const before = await nileWindow.boundingBox();
  const titlebar = nileWindow.locator('.archive-window__bar');
  const barBox = await titlebar.boundingBox();
  if (!before || !barBox) throw new Error('Window geometry unavailable');
  await page.mouse.move(barBox.x + barBox.width / 2, barBox.y + barBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(barBox.x + barBox.width / 2 - 80, barBox.y + barBox.height / 2 + 30, { steps: 5 });
  await page.mouse.up();
  const after = await nileWindow.boundingBox();
  expect(after?.x).toBeLessThan(before.x - 30);

  await nileWindow.getByRole('button', { name: 'Close window' }).click();
  await expect(nileWindow).toBeHidden();
  await page.getByRole('button', { name: /nile year/i }).click();
  await expect(page.getByRole('region', { name: 'The Nile year' })).toBeVisible();
});
