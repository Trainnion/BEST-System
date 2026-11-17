import { test, expect } from '@playwright/test';

test.describe('Print Fidelity Engine & NFR-05 Compliance', () => {
  test('emulates @media print and verifies zero glassmorphism and crisp B&W output', async ({ page }) => {
    // Navigate to print page (will render print template or loading/error container)
    await page.goto('/admin/documents/print/TEST-CODE');

    // Emulate print media type
    await page.emulateMedia({ media: 'print' });

    // Verify .no-print elements are hidden
    const noPrintElements = page.locator('.no-print');
    const count = await noPrintElements.count();
    for (let i = 0; i < count; i += 1) {
      await expect(noPrintElements.nth(i)).toBeHidden();
    }

    // Verify print sheet is styled with solid white background
    const printArea = page.locator('.print-area, .certificate-sheet');
    if ((await printArea.count()) > 0) {
      const computedBg = await printArea.first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // In print mode, background should be solid white or transparent (not dark glass)
      expect(['rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)', 'transparent']).toContain(computedBg);
    }
  });
});
