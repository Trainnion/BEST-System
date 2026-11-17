/*
 * BEST - Service Worker (WP-09, plan Sec. 7.3). Hand-written, zero
 * dependencies. Registered only in production over a secure context.
 *
 * Cache name carries the build id from /precache-manifest.json so each
 * deploy replaces the previous caches. Install precaches the shell routes
 * and static files with Promise.allSettled so one missing URL never aborts
 * the install.
 *
 * Fetch routing (Sec. 7.3, OFFLINE-02/03, R.A. 10173):
 *  - Shell routes ............ cache-first + background revalidate
 *  - /_next/static, .woff2, /icons/ ... cache-first (immutable)
 *  - GET /api/broadcasts, /api/directory, /api/public/stats ... stale-while-
 *    revalidate, 7-day max age, cached responses stamped X-BEST-Cached-At
 *  - GET /api/health ......... network-only, no-store
 *  - Everything else (/admin/*, /api/auth/*, /api/documents*, /api/blotter*,
 *    /api/business*, /api/treasury*, /api/ai/*, all non-GET) ... network-only,
 *    never cached. Responses carrying Set-Cookie are never cached either.
 *  - A failed navigation serves /offline.
 */

/* eslint-disable no-restricted-globals */
'use strict';

const MANIFEST_URL = '/precache-manifest.json';
const FALLBACK_URL = '/offline';
const PUBLIC_API_RE = /^\/api\/(?:broadcasts|directory|public\/stats)$/;
const IMMUTABLE_RE = /^(?:\/_next\/static\/|\/icons\/)|\.woff2$/;
const MAX_API_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7-day max age (Sec. 7.3)
const CACHED_AT_HEADER = 'X-BEST-Cached-At';

let CACHE_NAME = 'best-shell-v-dev';
/** Shell route paths from the precache manifest (navigations, cache-first). */
let SHELL_ROUTES = ['/offline'];

// ---------------------------------------------------------------------------
// Install: read the manifest, then precache everything it lists.
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
        if (response && response.ok) {
          const manifest = await response.json();
          if (manifest && manifest.build_id) {
            CACHE_NAME = `best-shell-v${manifest.build_id}`;
          }
          if (Array.isArray(manifest.routes) && manifest.routes.length > 0) {
            SHELL_ROUTES = manifest.routes.map((route) => String(route));
          }
          const urls = []
            .concat(SHELL_ROUTES)
            .concat(Array.isArray(manifest.files) ? manifest.files : [])
            .filter((url) => typeof url === 'string' && url.startsWith('/'));

          const cache = await caches.open(CACHE_NAME);
          // One missing URL must never abort the install (Sec. 7.3).
          await Promise.allSettled(
            urls.map((url) =>
              cache
                .add(new Request(url, { cache: 'reload', credentials: 'same-origin' }))
                .catch(() => false),
            ),
          );
        }
      } catch {
        // No manifest (fresh dev checkout): install with the offline fallback only.
      }
      // The offline fallback is precached even when the manifest is absent.
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.add(new Request(FALLBACK_URL, { cache: 'reload' })).catch(() => false);
      } catch {
        // Ignore; the network handler still tries the network first.
      }
      await self.skipWaiting();
    })(),
  );
});

// ---------------------------------------------------------------------------
// Activate: delete every older cache, then claim clients.
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.allSettled(
        keys
          .filter((key) => key.startsWith('best-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** May this response go into the cache? Never cache Set-Cookie answers. */
function cacheable(response) {
  return Boolean(
    response &&
      response.ok &&
      response.type === 'basic' &&
      !response.headers.has('Set-Cookie'),
  );
}

/** Store a response stamped with the time it entered the cache. */
async function putStamped(cache, request, response) {
  if (!cacheable(response)) return;
  try {
    const headers = new Headers(response.headers);
    headers.set(CACHED_AT_HEADER, String(Date.now()));
    const body = await response.clone().blob();
    const stamped = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    await cache.put(request, stamped);
  } catch {
    // Storage failures (quota, private mode) must not break the fetch.
  }
}

/** Plain network revalidation; caches the fresh answer when possible. */
async function revalidate(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    await putStamped(cache, request, response);
    return response;
  } catch {
    return null;
  }
}

/** Cache-first + background revalidate (shell navigations). */
function cacheFirstRevalidate(request) {
  return (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: false });
    const network = revalidate(request); // always refresh in the background
    if (cached) return cached;
    const fresh = await network;
    if (fresh) return fresh;
    return offlineFallback(cache);
  })();
}

/** Stale-while-revalidate with a 7-day max age (public, non-PII APIs). */
function staleWhileRevalidate(request) {
  return (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const cachedAt = cached ? Number(cached.headers.get(CACHED_AT_HEADER)) || 0 : 0;
    const fresh = Date.now() - cachedAt < MAX_API_AGE_MS;

    const network = revalidate(request);
    if (cached && fresh) return cached;

    const response = await network;
    if (response) return response;
    if (cached) return cached; // stale beats offline
    return new Response(
      JSON.stringify({ error: 'OFFLINE', message: 'No saved copy of this data yet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  })();
}

/** Cache-first for immutable static assets. */
async function cacheFirstImmutable(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await putStamped(cache, request, response);
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

/** The /offline navigation fallback (with a minimal inline last resort). */
async function offlineFallback(cache) {
  try {
    const page = await cache.match(FALLBACK_URL);
    if (page) return page;
  } catch {
    // Fall through to the inline response.
  }
  return new Response(
    '<!doctype html><html lang="en-PH"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Offline | BEST</title></head><body style="font-family:sans-serif;' +
      'background:#0a0f1d;color:#e2e8f0;padding:2rem;text-align:center">' +
      '<h1>You are offline</h1><p>Open the BEST app again once the barangay' +
      ' network is reachable. Saved requests are kept on this device.</p>' +
      '</body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

/** Network-only with the offline fallback for plain navigations. */
async function networkNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    return offlineFallback(cache);
  }
}

// ---------------------------------------------------------------------------
// Fetch routing (Sec. 7.3 table, in order)
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // All non-GET requests are network-only and never cached: do not
  // intercept, the browser performs the network request (Sec. 7.3).
  if (request.method !== 'GET') return;

  // Zero-external-origin (OFFLINE-01): never touch cross-origin requests.
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // GET /api/health: network-only, no-store (the OfflineBanner source of truth).
  if (path === '/api/health') {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
    return;
  }

  // Public, non-PII APIs: stale-while-revalidate with a 7-day max age.
  if (PUBLIC_API_RE.test(path)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Every other /api/* call (auth, documents, blotter, business, treasury,
  // ai, ...) is network-only and never cached (OFFLINE-02/03).
  if (path.startsWith('/api/')) return;

  // Admin and authenticated pages: network-only, never cached.
  if (path === '/admin' || path.startsWith('/admin/')) return;

  // Immutable static assets: cache-first.
  if (IMMUTABLE_RE.test(path)) {
    event.respondWith(cacheFirstImmutable(request));
    return;
  }

  // Navigations.
  if (request.mode === 'navigate') {
    const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    if (SHELL_ROUTES.includes(normalized)) {
      event.respondWith(cacheFirstRevalidate(request));
    } else {
      event.respondWith(networkNavigation(request));
    }
    return;
  }

  // Everything else (same-origin GET, non-navigation): network-only,
  // never cached.
});
