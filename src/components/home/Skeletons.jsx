/**
 * Loading placeholders for client-fetched homepage data (plan Sec. 8.5).
 *
 * The `.glass-skeleton` surface already owns the tier contract: a shimmer
 * sweep in Full, an opacity pulse in Lite, and nothing at all under reduced
 * motion or in print. These helpers only supply the shapes.
 */

export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`glass-skeleton block ${className}`} />;
}

/** One row of announcement-sized pills while /api/broadcasts is in flight. */
export function TickerSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3" aria-hidden="true">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="hidden h-5 w-28 sm:block" />
    </div>
  );
}

export default Skeleton;
