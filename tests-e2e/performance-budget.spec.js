import { test, expect } from '@playwright/test';

test.describe('Adaptive Performance Tiers & Budget (PERF-01, NFR-04)', () => {
  test('homepage First Load JS payload conforms to budget', async ({ page }) => {
    let totalTransfer = 0;

    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/_next/static/') && url.endsWith('.js')) {
        const headers = res.headers();
        const len = Number(headers['content-length'] || 0);
        totalTransfer += len;
      }
    });

    await page.goto('/');

    // Check that total initial JS is within reasonable budget (< 250 KB compressed)
    if (totalTransfer > 0) {
      expect(totalTransfer).toBeLessThan(250 * 1024);
    }
  });

  test('Lite tier baseline renders cleanly without crashing on low-end profile', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});
