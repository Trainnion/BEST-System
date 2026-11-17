'use client';

import useInView from '@/lib/hooks/useInView';

/**
 * L0 ambient background (plan Sec. 8.2, 14.3).
 *
 * Three radial-gradient orbs instead of `filter: blur()`, so the layer costs a
 * gradient fill and a transform - nothing more. The hook only tracks
 * visibility: it pauses the drift while the tab is hidden and leaves the
 * one-shot reveal machinery off, because this layer is pure decoration.
 *
 * Decorative by definition: aria-hidden, removed by motion-lite and print
 * through the existing `.ambient` / `.ambient-orb` rules.
 */
export default function AmbientOrbs() {
  const [ref] = useInView({
    threshold: 0,
    rootMargin: '0px',
    reveal: false,
    pauseOffscreen: true,
  });

  return (
    <div
      ref={ref}
      className="ambient pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Orb 1: Vibrant Electric Royal Blue (Top-Left) */}
      <div
        className="ambient-orb-1 absolute -left-[15%] -top-[15%] h-[60vmax] w-[60vmax] rounded-full opacity-65 dark:opacity-75 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-1) 0%, rgba(37,99,235,0.15) 45%, transparent 70%)',
        }}
      />
      {/* Orb 2: Vivid Purple / Violet (Top-Right) */}
      <div
        className="ambient-orb-2 absolute -right-[15%] top-[0%] h-[55vmax] w-[55vmax] rounded-full opacity-60 dark:opacity-70 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-2) 0%, rgba(147,51,234,0.15) 45%, transparent 70%)',
        }}
      />
      {/* Orb 3: Radiant Cyan / Turquoise (Bottom-Center) */}
      <div
        className="ambient-orb-3 absolute -bottom-[20%] left-[20%] h-[58vmax] w-[58vmax] rounded-full opacity-60 dark:opacity-70 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-3) 0%, rgba(6,182,212,0.15) 45%, transparent 70%)',
        }}
      />
      {/* Orb 4: Rich Indigo / Purple-Blue (Center-Right) */}
      <div
        className="ambient-orb-4 absolute right-[5%] top-[35%] h-[50vmax] w-[50vmax] rounded-full opacity-55 dark:opacity-65 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-4) 0%, rgba(99,102,241,0.15) 45%, transparent 70%)',
        }}
      />
    </div>
  );
}
