'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Motion preference + adaptive tier contract (plan Sec. 3.3, 8.4, 14.1-14.3).
 *
 * Server HTML always renders as Lite (no attributes). After hydration this hook:
 *   - respects prefers-reduced-motion, Save-Data / 2g-3g and low device memory,
 *   - applies html[data-motion] and html[data-fx] ("lite" | "full"),
 *   - honours a manual choice stored in localStorage or `?fx=lite|full`.
 *
 * Full tier is only a CSS enhancement (blur + loops). The frame-time probe in
 * src/lib/perf/tier.js (later wave) may downgrade Full -> Lite; the hook accepts
 * that by simply re-applying the attribute value it is given.
 */

export const MOTION_PREF_KEY = 'best:fx';
export const MOTION_EVENT = 'best:motion';

const LITE = 'lite';
const FULL = 'full';

function readForcedTier() {
  if (typeof window === 'undefined') return null;
  try {
    const query = new URLSearchParams(window.location.search).get('fx');
    if (query === LITE || query === FULL) return query;
    const stored = window.localStorage.getItem(MOTION_PREF_KEY);
    if (stored === LITE || stored === FULL) return stored;
  } catch {
    // Private mode / blocked storage: fall through to detection.
  }
  return null;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Save-Data header preference or a 2g/3g connection. */
function isDataSaver() {
  if (typeof navigator === 'undefined') return false;
  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  if (!connection) return false;
  return Boolean(connection.saveData) || /(^|-)(2g|3g)$/.test(connection.effectiveType || '');
}

/** Cheap phones report <= 2 GB deviceMemory. Unknown values never force Lite. */
function isLowMemoryDevice() {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2;
}

function resolveTier() {
  const forced = readForcedTier();
  if (forced) return forced;
  // Only an explicit "no preference" is treated as Full-capable. Reduced motion
  // always wins over a weak device signal.
  if (prefersReducedMotion() || isDataSaver() || isLowMemoryDevice()) return LITE;
  return FULL;
}

/** Apply a tier to <html> and notify listeners. Browser-only. */
export function applyTier(tier) {
  if (typeof document === 'undefined') return tier;
  const value = tier === LITE ? LITE : FULL;
  const root = document.documentElement;
  root.setAttribute('data-fx', value);
  root.setAttribute('data-motion', value);
  try {
    window.dispatchEvent(new CustomEvent(MOTION_EVENT, { detail: { tier: value } }));
  } catch {
    // CustomEvent unavailable: attributes are still applied.
  }
  return value;
}

/**
 * @returns {{
 *   tier: 'lite' | 'full',
 *   motion: 'lite' | 'full',
 *   reducedMotion: boolean,
 *   saveData: boolean,
 *   lowMemory: boolean,
 *   setTier: (tier: 'lite' | 'full') => void,
 *   toggle: () => void,
 * }}
 */
export function useMotionPreference() {
  // null until hydration: server and first client render stay on the Lite baseline.
  const [tier, setTierState] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [lowMemory, setLowMemory] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = resolveTier();
      const applied = applyTier(next);
      setTierState(applied);
      setReducedMotion(prefersReducedMotion());
      setSaveData(isDataSaver());
      setLowMemory(isLowMemoryDevice());
    };

    sync();

    const motionQuery = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    const onMotionChange = () => {
      // A stored manual choice outranks the OS preference.
      if (!readForcedTier()) sync();
      else setReducedMotion(prefersReducedMotion());
    };
    motionQuery?.addEventListener?.('change', onMotionChange);

    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    const onConnectionChange = () => {
      if (!readForcedTier()) sync();
    };
    connection?.addEventListener?.('change', onConnectionChange);

    const onStorage = (event) => {
      if (event.key === MOTION_PREF_KEY) sync();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      motionQuery?.removeEventListener?.('change', onMotionChange);
      connection?.removeEventListener?.('change', onConnectionChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /** Manual override. Storing a UI preference only, never personal data. */
  const setTier = useCallback((next) => {
    if (next !== LITE && next !== FULL) return;
    try {
      window.localStorage.setItem(MOTION_PREF_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this page view.
    }
    setTierState(applyTier(next));
  }, []);

  const toggle = useCallback(() => {
    setTier(tier === FULL ? LITE : FULL);
  }, [tier, setTier]);

  const resolved = tier === FULL ? FULL : LITE;

  return {
    tier: resolved,
    motion: resolved,
    reducedMotion,
    saveData,
    lowMemory,
    setTier,
    toggle,
  };
}

export default useMotionPreference;
