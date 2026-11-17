import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control & Session Security (NFR-06, Sec. 6.5, Sec. 17)', () => {
  test('unauthenticated access to admin portal redirects to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('digital ID card is strictly view-only with no print routes or buttons', async ({ page }) => {
    // Check that no ID print route exists
    const printIdRes = await page.request.get('/id-card/print');
    expect([404, 401, 403]).toContain(printIdRes.status());

    await page.goto('/id-card');
    // Verify no print button exists on ID card viewer
    const printButtons = page.locator('button:has-text("Print ID"), a:has-text("Print ID")');
    await expect(printButtons).toHaveCount(0);
  });

  test('staff endpoints reject requests without authorized sessions', async ({ page }) => {
    const res = await page.request.get('/api/admin/blotter');
    expect([401, 403]).toContain(res.status());

    const deepHealth = await page.request.get('/api/health/deep');
    expect([401, 403]).toContain(deepHealth.status());
  });
});
