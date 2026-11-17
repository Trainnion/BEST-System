'use client';

/**
 * Ambient Dynamic Background Orbs (Atlas / Modern Glass Spec).
 *
 * Lightweight, hardware-accelerated ambient glowing mesh:
 * - 3 balanced radial gradient anchors (Royal Blue, Violet, Cyan-Turquoise).
 * - Multi-stop radial gradients without CSS Gaussian blur filters for high FPS.
 * - Hardware compositor layer promotion (translate3d, backface-visibility).
 * - Fully paused / hidden in Lite Mode and under prefers-reduced-motion.
 */

export default function AmbientOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ contain: 'layout paint' }}
    >
      {/* Orb 1: Royal Blue (Top-Left) */}
      <div
        className="ambient-orb-1 absolute -left-[10%] -top-[10%] h-[48vmax] w-[48vmax] rounded-full opacity-60 dark:opacity-75 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(closest-side, var(--ambient-blue-1) 0%, rgba(37,99,235,0.12) 45%, transparent 70%)',
          contain: 'layout paint',
        }}
      />
      {/* Orb 2: Vivid Violet / Purple (Top-Right) */}
      <div
        className="ambient-orb-2 absolute -right-[10%] top-[0%] h-[44vmax] w-[44vmax] rounded-full opacity-55 dark:opacity-70 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(closest-side, var(--ambient-blue-2) 0%, rgba(147,51,234,0.12) 45%, transparent 70%)',
          contain: 'layout paint',
        }}
      />
      {/* Orb 3: Radiant Cyan / Turquoise (Bottom-Center) */}
      <div
        className="ambient-orb-3 absolute -bottom-[15%] left-[20%] h-[46vmax] w-[46vmax] rounded-full opacity-55 dark:opacity-70 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(closest-side, var(--ambient-blue-3) 0%, rgba(6,182,212,0.12) 45%, transparent 70%)',
          contain: 'layout paint',
        }}
      />
    </div>
  );
}
