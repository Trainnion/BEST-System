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
      <div
        className="ambient-orb absolute -left-[14%] top-[-20%] h-[46vmax] w-[46vmax] rounded-full opacity-70"
        style={{
          background: 'radial-gradient(closest-side, rgba(34,211,238,0.30), transparent)',
          '--dx': '6vw',
          '--dy': '3vh',
        }}
      />
      <div
        className="ambient-orb absolute -right-[16%] top-[6%] h-[40vmax] w-[40vmax] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(closest-side, rgba(20,184,166,0.26), transparent)',
          '--dx': '-5vw',
          '--dy': '4vh',
          '--i': '1',
        }}
      />
      <div
        className="ambient-orb absolute bottom-[-24%] left-[28%] h-[38vmax] w-[38vmax] rounded-full opacity-40"
        style={{
          background: 'radial-gradient(closest-side, rgba(251,191,36,0.18), transparent)',
          '--dx': '4vw',
          '--dy': '-5vh',
          '--i': '2',
        }}
      />
    </div>
  );
}
