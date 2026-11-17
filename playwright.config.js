import { defineConfig, devices } from '@playwright/test';

// BEST Playwright harness (plan Sec. 5.1 + work-distribution decision 3).
// HTTPS runs must work with Caddy's local/self-signed certificate, and offline
// tests depend on the real production Service Worker.
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30000,
  retries: 1,
  // Deterministic serial execution: suites touch the same database.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    serviceWorkers: 'allow',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Desktop Reduced Motion',
      testMatch: /homepage-animation\.spec\.js/,
      use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' },
    },
    {
      // Budget phone profile (Sec. 14.5). CPU throttling and network emulation are
      // applied per-spec via CDP so the project itself stays declarative.
      name: 'mobile-low-end',
      testMatch: /performance-budget\.spec\.js/,
      use: { ...devices['Moto G4'] },
    },
  ],
  webServer: {
    // Production build is mandatory: the Service Worker and precache manifest only
    // exist in a production build.
    command: 'npm run build && npm run start',
    port: 3000,
    timeout: 240000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
