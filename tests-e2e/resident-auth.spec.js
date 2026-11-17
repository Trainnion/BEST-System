import { test, expect } from '@playwright/test';

test.describe('Resident Authentication & Invariant AUTH-01', () => {
  test('rejects request bodies containing resident_id (AUTH-01 / Invariant 10)', async ({ page }) => {
    // Attempting to inject resident_id in document request must fail with 400
    const res = await page.request.post('/api/documents', {
      data: {
        resident_id: 'RES-2026-9999',
        document_type: 'CLEARANCE',
        purpose: 'Test clearance injection attack',
      },
    });

    // Invariant 10: Server rejects resident_id in body
    expect(res.status()).toBe(400);
  });

  test('resident me endpoint requires valid resident session', async ({ page }) => {
    const res = await page.request.get('/api/resident/me');
    expect([401, 403]).toContain(res.status());
  });

  test('resident login page renders cleanly', async ({ page }) => {
    await page.goto('/resident/login');
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('resident activation page renders with Crockford code input', async ({ page }) => {
    await page.goto('/resident/activate');
    const codeInput = page.locator('input[name*="code"], input[placeholder*="code" i], input[type="text"]').first();
    await expect(codeInput).toBeVisible();
  });
});
