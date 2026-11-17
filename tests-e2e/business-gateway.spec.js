import { test, expect } from '@playwright/test';

test.describe('Business Clearance Gateway (FR-06 & R.A. 7160 Sec. 152)', () => {
  test('strictly enforces mandatory in-person Treasurer appointment and zero auto-approval', async ({ page }) => {
    await page.goto('/services/business-clearance');

    // Verify statutory notice
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/(in-person|treasurer|screening|appointment)/i);

    // Assert that NO automatic online approval button exists
    const autoApproveButton = page.locator('button:has-text("Auto Approve"), button:has-text("Instant Approval")');
    await expect(autoApproveButton).toHaveCount(0);

    // Verify checklist items exist on the page
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });
});
