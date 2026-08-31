import { defineConfig, devices } from '@playwright/test';

// Tests run against the same base path the build used, so a project-site
// deployment (`BASE_PATH=/repository/`) is exercised exactly as it ships.
const base = (process.env.BASE_PATH ?? '/').replace(/^\/?/, '/').replace(/\/?$/, '/');

export default defineConfig({
  testDir: './tests',
  // Unit tests are `*.test.ts` and run under Vitest.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  // Visual baselines are intentionally cross-platform; the comparison allows
  // small system-font rasterization differences between local environments.
  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}{ext}',
  use: { baseURL: `http://127.0.0.1:4173${base}`, trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --host 127.0.0.1', port: 4173, reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
});
