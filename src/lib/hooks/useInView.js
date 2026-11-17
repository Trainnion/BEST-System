'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useInView - the only motion hook the homepage needs (plan Sec. 8.1, 8.4 rule 5).
 *
 * Adds `.is-visible` when the element scrolls into view (drives `rise-in`,
 * `draw-path` and `node-glow`) and toggles `data-paused` so off-screen or
 * hidden-tab sections stop their looping animations.
 *
 * Browser-only: all DOM access happens inside useEffect, so it is safe to import
 * from server components as long as the consumer is a client component.
 *
 * @param {object} [options]
 * @param {number} [options.threshold=0.2] IntersectionObserver threshold.
 * @param {string} [options.rootMargin='0px 0px -10% 0px'] Root margin.
 * @param {boolean} [options.once=false] Stop observing after the first reveal.
 * @param {boolean} [options.pauseOffscreen=true] Set data-paused when out of view.
 * @param {boolean} [options.reveal=true] Add `.is-visible` on first intersection.
 * @returns {[import('react').RefObject<HTMLElement>, boolean]} [ref, inView]
 */
export function useInView(options = {}) {
  const {
    threshold = 0.2,
    rootMargin = '0px 0px -10% 0px',
    once = false,
    pauseOffscreen = true,
    reveal = true,
  } = options;

  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let visible = false;
    let observer = null;

    const enter = () => {
      visible = true;
      if (reveal) el.classList.add('is-visible');
      el.setAttribute('data-paused', 'false');
      setInView(true);
    };

    const pause = () => {
      if (pauseOffscreen) el.setAttribute('data-paused', 'true');
    };

    // Old browsers and some test environments have no IntersectionObserver:
    // show the final state immediately instead of hiding content forever.
    if (typeof IntersectionObserver === 'undefined') {
      enter();
      return undefined;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            enter();
            if (once) {
              observer.disconnect();
              observer = null;
            }
          } else if (!once) {
            pause();
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);

    // Pause looping animation while the tab is hidden, resume only if on screen.
    const onVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else if (visible) {
        el.setAttribute('data-paused', 'false');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (observer) observer.disconnect();
    };
  }, [threshold, rootMargin, once, pauseOffscreen, reveal]);

  return [ref, inView];
}

export default useInView;
