'use client';

/**
 * BEST - ServiceWorkerRegistrar (WP-09, plan Sec. 7.3 / Sec. 7.8).
 *
 * Registers /sw.js ONLY in a production build over a secure context, and
 * unregisters it in development so a stale worker can never serve dev
 * assets. Every failure is swallowed and nothing is ever logged. Renders
 * null, so it is safe to render on every page without touching the layout.
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;

    if (process.env.NODE_ENV !== 'production') {
      // Development: make sure no production worker lingers.
      try {
        navigator.serviceWorker
          .getRegistration('/sw.js')
          .then((registration) => {
            if (registration) return registration.unregister();
            return undefined;
          })
          .catch(() => undefined);
      } catch {
        // Silent: registration state never breaks the page.
      }
      return;
    }

    if (!window.isSecureContext) return; // Sec. 7.8: HTTPS is mandatory

    try {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    } catch {
      // Silent.
    }
  }, []);

  return null;
}
