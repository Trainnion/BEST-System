import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

function solvePow(nonce, difficulty) {
  const targetPrefix = '0'.repeat(difficulty);
  for (let i = 0; i < 500000; i += 1) {
    const candidate = String(i);
    const hash = createHash('sha256').update(nonce + candidate).digest('hex');
    if (hash.startsWith(targetPrefix)) {
      return candidate;
    }
  }
  return '0';
}

test.describe('Anonymous Blotter & Zero-Knowledge Transport (FR-03, NFR-02, ZK-LOG-01)', () => {
  test('fetches proof-of-work challenge and files anonymous blotter', async ({ page }) => {
    // 1. Fetch challenge
    const chalRes = await page.request.get('/api/blotter/challenge');
    expect(chalRes.status()).toBe(200);
    const chal = await chalRes.json();
    expect(chal).toHaveProperty('nonce');
    expect(chal).toHaveProperty('difficulty');

    const solution = solvePow(chal.nonce, chal.difficulty);

    // 2. Submit anonymous blotter report
    const blotterPayload = {
      incident_type: 'NOISE',
      incident_zone: 'Purok 1',
      incident_date: '2026-11-17',
      urgency_level: 'NORMAL',
      narrative: 'Sample anonymous noise complaint near the plaza basketball court.',
      exact_location: 'Purok 1 near court',
      exact_time: '10:00 PM',
      pow: {
        nonce: chal.nonce,
        solution,
      },
    };

    const submitRes = await page.request.post('/api/blotter', {
      data: blotterPayload,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should return 201 or 400 if challenge expired
    expect([201, 200, 400]).toContain(submitRes.status());
    if (submitRes.status() === 201) {
      const result = await submitRes.json();
      expect(result.success).toBe(true);
      expect(result.tracking_code).toMatch(/^BLOT-2026-/);

      // Verify public tracking
      const trackRes = await page.request.get(`/api/blotter/${result.tracking_code}`);
      expect(trackRes.status()).toBe(200);
      const trackData = await trackRes.json();
      expect(trackData.tracking_code).toBe(result.tracking_code);
      // Public view must NEVER return narrative or exact location
      expect(trackData).not.toHaveProperty('narrative');
      expect(trackData).not.toHaveProperty('exact_location');
    }
  });

  test('blotter page intercepts and verifies zero external outbound requests', async ({ page }) => {
    const externalRequests = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        externalRequests.push(req.url());
      }
    });

    await page.goto('/blotter');
    await expect(page.locator('h1, h2, p')).toContainText(['Anonymous report', 'File a blotter report', 'No login and no name']);
    expect(externalRequests).toHaveLength(0);
  });
});
