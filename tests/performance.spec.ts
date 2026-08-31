import { expect, test, type Page } from '@playwright/test';

type BrowserMetrics = {
  longestTask: number;
  layoutShift: number;
  routeLoad: number;
  heapBytes: number;
};

async function startObservers(page: Page) {
  await page.addInitScript(() => {
    const metrics = { longTasks: [] as number[], layoutShift: 0 };
    (window as typeof window & { __archiveMetrics?: typeof metrics }).__archiveMetrics = metrics;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.longTasks.push(entry.duration);
    }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) metrics.layoutShift += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

async function collectMetrics(page: Page): Promise<BrowserMetrics> {
  const observed = await page.evaluate(() => {
    const local = (window as typeof window & { __archiveMetrics: { longTasks: number[]; layoutShift: number } }).__archiveMetrics;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      longestTask: Math.max(0, ...local.longTasks),
      layoutShift: local.layoutShift,
      routeLoad: navigation.loadEventEnd - navigation.startTime,
    };
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const heapBytes = metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value ?? 0;
  return { ...observed, heapBytes };
}

test.describe('browser performance budgets', () => {
  test.skip(({ isMobile }) => isMobile, 'The desktop Chromium project supplies stable CDP metrics.');

  test('a common illustrated article stays responsive on a midrange CPU profile', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await startObservers(page);
    await page.goto('wiki/sobek/');
    await expect(page.getByRole('heading', { level: 1, name: 'Sobek' })).toBeVisible();
    const loadMetrics = await collectMetrics(page);
    expect(loadMetrics.longestTask).toBeLessThanOrEqual(200);
    expect(loadMetrics.routeLoad).toBeLessThanOrEqual(3_000);
    expect(loadMetrics.heapBytes).toBeLessThanOrEqual(64 * 1024 * 1024);
    await page.evaluate(() => {
      const local = (window as typeof window & { __archiveMetrics: { longTasks: number[]; layoutShift: number } }).__archiveMetrics;
      local.longTasks = [];
      local.layoutShift = 0;
    });
    await page.getByRole('button', { name: 'Bookmark' }).click();
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(250);

    const interactionMetrics = await collectMetrics(page);
    expect(interactionMetrics.longestTask).toBeLessThanOrEqual(200);
    expect(interactionMetrics.layoutShift).toBeLessThanOrEqual(0.1);
  });

  test('the graph responds to a node selection without a long task', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await startObservers(page);
    await page.goto('graph/');
    const search = page.getByPlaceholder('Find a node…');
    await search.fill('Maat');
    await page.getByRole('button', { name: /^Maat/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Why these are connected' })).toBeVisible();
    const longestTask = await page.evaluate(() => {
      const local = (window as typeof window & { __archiveMetrics: { longTasks: number[] } }).__archiveMetrics;
      return Math.max(0, ...local.longTasks);
    });
    expect(longestTask).toBeLessThanOrEqual(200);
  });
});
