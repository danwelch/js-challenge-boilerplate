import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright drives the real app in a browser, covering the end-to-end flow that
 * unit tests can't — notably the native file-picker and `File.text()` read path,
 * which jsdom does not implement.
 *
 * E2E specs are named `*.e2e.ts` so they never overlap with the Vitest unit specs
 * (`*.spec.ts`). The dev server is started on demand and reused if one is already
 * running locally.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
