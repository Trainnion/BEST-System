/**
 * Rotating greeting (plan Sec. 8.2, L1).
 *
 * Cross-fades Maayong adlaw -> Magandang araw -> Good day on the existing
 * `.cycle-3` keyframes (9.6 s loop, CSS only, no JS timers). Lite and reduced
 * motion collapse the stack to the first phrase through the motion contract,
 * and the sr-only copy gives assistive tech all three once, never on repeat.
 */
export default function RotatingGreeting() {
  return (
    <p className="text-xl font-bold text-sky-800 sm:text-2xl dark:text-cyan-300">
      <span className="sr-only">
        Greetings in three languages: Maayong adlaw, Magandang araw, Good day.
      </span>
      <span className="cycle-3 inline-block min-w-[15ch] align-baseline" aria-hidden="true">
        <span className="whitespace-nowrap" style={{ '--i': 0 }}>
          Maayong adlaw
        </span>
        <span className="whitespace-nowrap" style={{ '--i': 1 }}>
          Magandang araw
        </span>
        <span className="whitespace-nowrap" style={{ '--i': 2 }}>
          Good day
        </span>
      </span>
    </p>
  );
}
