import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.mjs',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 30000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4175', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'), trace: 'retain-on-failure', screenshot: 'only-on-failure', headless: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
