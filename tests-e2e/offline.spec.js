import { test, expect } from '@playwright/test';

test.describe('Offline-First Architecture & Service Worker (OFFLINE-01, OFFLINE-02)', () => {
  test('serves public precache manifest and sw.js with proper Cache-Control', async ({ page }) => {
    // 1. Service Worker file is served with no-cache header
    const swRes = await page.request.get('/sw.js');
    expect(swRes.status()).toBe(200);
    const swCacheControl = swRes.headers()['cache-control'] || '';
    expect(swCacheControl).toContain('no-cache');

    // 2. Precache manifest is reachable
    const manifestRes = await page.request.get('/precache-manifest.json');
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();
    expect(manifest).toHaveProperty('routes');
    expect(manifest).toHaveProperty('files');

    // Invariant OFFLINE-02: No admin routes or sensitive API routes in precache manifest
    for (const r of manifest.routes) {
      expect(r).not.toMatch(/^\/admin/);
      expect(r).not.toMatch(/^\/api\/admin/);
      expect(r).not.toMatch(/^\/api\/blotter/);
      expect(r).not.toMatch(/^\/api\/auth/);
    }
  });

  test('offline shell page renders with offline notice', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('h1, h2, p')).toContainText(['Offline fallback', 'without a connection', 'How the pending queue behaves']);
  });
});
