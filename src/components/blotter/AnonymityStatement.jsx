/**
 * AnonymityStatement - the Sec. 15.2 plain-language statement.
 *
 * Rendered verbatim on /blotter (the plan quotes it in project documents).
 * Server component: no client JavaScript is needed to read it.
 */

export default function AnonymityStatement() {
  return (
    <section
      className="glass-lite max-w-prose p-rhythm-4"
      aria-labelledby="anonymity-statement-title"
    >
      <h2
        id="anonymity-statement-title"
        className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300"
      >
        What anonymous means here
      </h2>
      <blockquote className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        &ldquo;Anonymous means best-effort. BEST stores no name, IP address, device details or
        cookie with your report, and it stores your text encrypted, and only authorized
        barangay officers can read it in the system. It cannot hide what you write yourself,
        the fact that you live in a small purok, or logs kept by your own network (for
        example the hall Wi-Fi router). For stronger anonymity, use mobile data instead of
        the hall Wi-Fi.&rdquo;
      </blockquote>
    </section>
  );
}
