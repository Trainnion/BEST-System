/**
 * Status badge (plan Sec. 3.1 semantic state matrix).
 *
 * Maps a document status to the existing `.state-*` surfaces so the homepage
 * sample card, and later staff views, share one colour language. Labels are
 * always spelled out: colour is never the only carrier of meaning.
 */

const STATUS_META = {
  SUBMITTED: { label: 'Submitted', tone: 'state-info' },
  UNDER_REVIEW: { label: 'Under review', tone: 'state-warning' },
  PAYMENT_PENDING: { label: 'Payment pending', tone: 'state-warning' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', tone: 'state-success' },
  RELEASED: { label: 'Released', tone: 'state-success' },
  REJECTED: { label: 'Rejected', tone: 'state-danger' },
};

export default function StatusBadge({ status, className = '', style }) {
  const meta = STATUS_META[status] ?? { label: String(status ?? 'Unknown'), tone: 'state-neutral' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone} ${className}`}
      style={style}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
