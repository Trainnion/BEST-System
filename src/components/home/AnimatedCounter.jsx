'use client';

import { useEffect, useState } from 'react';

import useInView from '@/lib/hooks/useInView';
import { MOTION_EVENT } from '@/lib/hooks/useMotionPreference';

/**
 * Count-up statistic (plan Sec. 8.2 S2, 8.3 "on scroll").
 *
 * The final value is passed in from the server render, so it is already in the
 * HTML: with JS disabled, reduced motion or Lite tier the number never moves.
 * Only Full motion rewinds it to zero and counts up once, on first view, using
 * requestAnimationFrame that is cancelled on unmount.
 *
 * The wrapper carries an aria-label with the final value, so screen readers
 * hear one stable number instead of every animation frame.
 */

function formatValue(value, decimals) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const rounded = decimals > 0 ? Number(value).toFixed(decimals) : String(Math.round(Number(value)));
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function AnimatedCounter({
  label,
  value = null,
  suffix = '',
  hint = '',
  decimals = 0,
}) {
  const [ref, inView] = useInView({
    threshold: 0.35,
    once: true,
    pauseOffscreen: false,
    reveal: false,
  });

  const finalText = formatValue(value, decimals);
  const [display, setDisplay] = useState(finalText);
  const [allowMotion, setAllowMotion] = useState(false);

  // The tier is applied by useMotionPreference elsewhere on the page, so this
  // effect reads the html attributes and follows later changes.
  useEffect(() => {
    const sync = () => {
      const root = document.documentElement;
      const reduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lite =
        root.getAttribute('data-motion') === 'lite' || root.getAttribute('data-fx') === 'lite';
      setAllowMotion(!reduced && !lite);
    };

    sync();
    window.addEventListener(MOTION_EVENT, sync);

    const query =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    query?.addEventListener?.('change', sync);

    return () => {
      window.removeEventListener(MOTION_EVENT, sync);
      query?.removeEventListener?.('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!allowMotion || !inView) return undefined;
    if (value === null || value === undefined || Number.isNaN(Number(value))) return undefined;

    const target = Number(value);
    const duration = 1200;
    let frame = 0;
    let start = 0;

    const tick = (now) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(formatValue(target * eased, decimals));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(finalText);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [allowMotion, inView, value, decimals, finalText]);

  const ariaLabel =
    value === null || value === undefined
      ? `${label}: unavailable`
      : `${label}: ${finalText}${suffix ? ` ${suffix}` : ''}`;

  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
        {label}
      </dt>
      <dd className="m-0 flex items-baseline gap-1 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-slate-50" aria-label={ariaLabel}>
        <span aria-hidden="true" className="text-gradient-runtime">{display}</span>
        {suffix ? (
          <span className="text-base font-semibold text-slate-600 dark:text-slate-400" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </dd>
      {hint ? <p className="text-xs leading-snug text-slate-600 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
