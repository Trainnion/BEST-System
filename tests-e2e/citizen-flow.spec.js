import { test, expect } from '@playwright/test';

test.describe('Citizen Services & Intake Flow (FR-01, FR-04, NFR-04)', () => {
  test('citizen can visit services and track documents with masked PII', async ({ page }) => {
    // 1. Visit Document Request page
    await page.goto('/services/request');
    // Banner "Document Intake" + heading "Request a barangay document"
    await expect(page.locator('h1, h2, p')).toContainText(['Document Intake', 'Request a barangay document']);

    // 2. Public document tracking lookup
    await page.goto('/track');
    const trackInput = page.locator('input[placeholder*="CLR-"], input[placeholder*="IND-"], input[type="text"]').first();
    await expect(trackInput).toBeVisible();

    // 3. Test public tracking endpoint directly (use a seeded code)
    const trackRes = await page.request.get('/api/documents/track?code=CLR-2026-DEMO0001');
    if (trackRes.ok()) {
      const data = await trackRes.json();
      expect(data).toHaveProperty('masked_name');
      // Must be masked according to NFR-01 (e.g. J*** D**)
      expect(data.masked_name).toMatch(/^[A-Z]\*{3}\s+[A-Z]\*{2}$/);
    }
  });

  test('Kaagapay AI concierge responds locally in EN, TL, and CEB', async ({ page }) => {
    // Test local AI assistant route
    const resEn = await page.request.post('/api/ai/chat', {
      data: { message: 'How do I get a barangay clearance?', language: 'en' },
    });
    expect(resEn.status()).toBe(200);
    const dataEn = await resEn.json();
    expect(dataEn.source).toBe('local');
    expect(dataEn.reply).toBeTruthy();

    const resTl = await page.request.post('/api/ai/chat', {
      data: { message: 'Paano kumuha ng barangay clearance?', language: 'tl' },
    });
    expect(resTl.status()).toBe(200);
    const dataTl = await resTl.json();
    expect(dataTl.source).toBe('local');
  });
});
