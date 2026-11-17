/**
 * StatusPill - the plan Sec. 3.1 semantic state matrix for document status.
 * Uses the shared .state-* classes from src/styles/globals.css, so the colour
 * always matches the design system (success / warning / danger / info).
 */

const STATUS_META = Object.freeze({
  SUBMITTED: { label: 'Submitted', className: 'state-info' },
  UNDER_REVIEW: { label: 'Under review', className: 'state-warning' },
  PAYMENT_PENDING: { label: 'Payment pending', className: 'state-warning' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', className: 'state-success' },
  RELEASED: { label: 'Released', className: 'state-success' },
  REJECTED: { label: 'Not approved', className: 'state-danger' },
});

/**
 * @param {{status?: string, className?: string}} props
 * @returns {JSX.Element}
 */
export default function StatusPill({ status, className = '' }) {
  const key = typeof status === 'string' ? status.trim().toUpperCase() : '';
  const meta = STATUS_META[key] || { label: key || 'Unknown', className: 'state-neutral' };

  return (
    <span
      className={
        'inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ' +
        meta.className +
        (className ? ' ' + className : '')
      }
    >
      {meta.label}
    </span>
  );
}
