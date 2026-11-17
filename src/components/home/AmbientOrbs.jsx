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
      className="ambient pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Orb 1: Top-Left Cyan/Sky Blue drifting orb */}
      <div
        className="ambient-orb-1 absolute -left-[10%] -top-[15%] h-[52vmax] w-[52vmax] rounded-full opacity-60 dark:opacity-75 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-1), transparent)',
        }}
      />
      {/* Orb 2: Top-Right Sapphire / Royal Blue drifting orb */}
      <div
        className="ambient-orb-2 absolute -right-[15%] top-[5%] h-[48vmax] w-[48vmax] rounded-full opacity-50 dark:opacity-65 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-2), transparent)',
        }}
      />
      {/* Orb 3: Bottom-Center Deep Cobalt / Cerulean drifting orb */}
      <div
        className="ambient-orb-3 absolute -bottom-[20%] left-[22%] h-[50vmax] w-[50vmax] rounded-full opacity-45 dark:opacity-60 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-3), transparent)',
        }}
      />
      {/* Orb 4: Mid-Right Soft Azure Glow */}
      <div
        className="ambient-orb-4 absolute right-[10%] top-[45%] h-[40vmax] w-[40vmax] rounded-full opacity-40 dark:opacity-50 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(closest-side, var(--ambient-blue-4), transparent)',
        }}
      />
    </div>
  );
}
