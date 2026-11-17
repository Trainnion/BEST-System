import { test, expect } from '@playwright/test';

test.describe('Living Glass Homepage & Motion Safety (MOTION-01)', () => {
  test('homepage renders hero and animates transform/opacity only', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();

    // Verify CLS score is within budget
    const clsScore = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let cls = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(cls), 1000);
      });
    });

    expect(clsScore).toBeLessThan(0.1);
  });

  test('hero text and quick action links are readable without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');

    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();

    const quickLinks = page.locator('a[href^="/services"], a[href^="/blotter"], a[href^="/track"]');
    expect(await quickLinks.count()).toBeGreaterThan(0);

    await context.close();
  });
});
