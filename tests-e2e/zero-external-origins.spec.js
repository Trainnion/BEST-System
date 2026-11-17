import { test, expect } from '@playwright/test';

test.describe('Zero External Origins (OFFLINE-01 & Invariant 6)', () => {
  const routes = ['/', '/directory', '/broadcasts', '/track', '/blotter', '/services/request'];

  for (const route of routes) {
    test(`route ${route} initiates zero requests to external origins`, async ({ page }) => {
      const externalRequests = [];

      page.on('request', (req) => {
        try {
          const url = new URL(req.url());
          if (
            url.protocol.startsWith('http') &&
            url.hostname !== 'localhost' &&
            url.hostname !== '127.0.0.1' &&
            url.hostname !== 'best.lan'
          ) {
            externalRequests.push(req.url());
          }
        } catch {
          // ignore data: and blob:
        }
      });

      const response = await page.goto(route);
      expect(response.status()).toBe(200);

      // Verify zero external network requests
      expect(externalRequests).toHaveLength(0);
    });
  }
});
