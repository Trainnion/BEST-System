/**
 * BEST - Adaptive performance tier detection (WP-09, plan Sec. 14.2).
 *
 * Every device first gets the Lite tier. The Full tier (backdrop-filter,
 * looping motion) is confirmed only when detection and a short frame-time
 * probe say the device can afford it.
 *
 * `navigator.hardwareConcurrency` is deliberately NOT used: many cheap
 * phones report 8 cores. The frame probe is the real judge (Sec. 14.2).
 *
 * Server HTML always renders as Lite; `initTier()` upgrades the document
 * after first paint. Client-side helper (no-op on the server).
 */

const FX_STORAGE_KEY = 'best:fx';
const FRAME_BUDGET_MS = 24; // < 24 ms/frame is roughly under 42 fps (Sec. 14.2)

/** Read a value from localStorage without ever throwing. */
function readStored(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Blocked storage (private mode, permissions policy) must not break the page.
    return null;
  }
}

/** An explicit `?fx=lite|full` URL choice, if present. */
function readForcedFromUrl() {
  try {
    const value = new URLSearchParams(window.location.search).get('fx');
    return value === 'lite' || value === 'full' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Average ms per frame while a blurred layer animates (Sec. 14.2, verbatim).
 * @param {number} [ms] probe duration
 * @returns {Promise<number>} average frame duration in ms
 */
export function frameProbe(ms = 600) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;inset:auto 0 0 0;height:40vh;backdrop-filter:blur(12px);opacity:.01;pointer-events:none';
    document.body.appendChild(el);
    let frames = 0;
    const t0 = performance.now();
    (function tick(t) {
      el.style.transform = `translateX(${frames % 2}px)`;
      frames++;
      if (t - t0 < ms) return requestAnimationFrame(tick);
      el.remove();
      resolve((t - t0) / frames);
    })(t0);
  });
}

/**
 * Detect the tier for this device (Sec. 14.2, verbatim logic).
 *
 * Order: forced choice (?fx / localStorage `best:fx`) wins; then Save-Data,
 * 2g/3g, deviceMemory <= 2 or prefers-reduced-motion all mean Lite; finally
 * the frame probe upgrades to Full only under the 24 ms/frame budget.
 *
 * @returns {Promise<'full'|'lite'>}
 */
export async function detectTier() {
  const forced = readForcedFromUrl() || readStored(FX_STORAGE_KEY);
  if (forced === 'lite' || forced === 'full') return forced;

  const connection = navigator.connection || {};
  const weak =
    connection.saveData ||
    /(^|-)(2g|3g)$/.test(connection.effectiveType || '') ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2);
  if (weak || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'lite';
  }
  try {
    return (await frameProbe()) < FRAME_BUDGET_MS ? 'full' : 'lite';
  } catch {
    return 'lite';
  }
}

/**
 * Run `detectTier()` after first paint, inside requestIdleCallback when the
 * browser offers it, and set `html[data-fx="lite|full"]`.
 *
 * A forced `?fx=...` value is never downgraded: while one is present the
 * attribute is pinned to it. An existing non-forced value is left alone.
 *
 * @returns {void}
 */
export function initTier() {
  if (typeof window === 'undefined') return; // SSR safety
  const forced = readForcedFromUrl();

  const apply = (tier) => {
    const html = document.documentElement;
    if (!html || forced === null && html.hasAttribute('data-fx')) return;
    html.setAttribute('data-fx', forced !== null ? forced : tier);
  };

  const run = () => {
    detectTier()
      .then(apply)
      // Never leave the document without a tier.
      .catch(() => apply('lite'));
  };

  const whenIdle =
    typeof window.requestIdleCallback === 'function'
      ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => window.setTimeout(cb, 1);

  // After first paint: wait one frame so the first content is on screen.
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => whenIdle(run));
  } else {
    whenIdle(run);
  }
}
