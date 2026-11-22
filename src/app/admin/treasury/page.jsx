'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'GCASH_MOCK', label: 'GCash (Mock)' },
  { value: 'LANDBANK_MOCK', label: 'LandBank (Mock)' },
];

function moneyText(value) {
  if (value == null || value === '') return '0.00';
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
}

function sameAmount(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.round(x * 100) === Math.round(y * 100);
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickList(data, keys) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function ownerLabel(item) {
  return item.owner_masked || item.masked_name || item.owner_name_masked || item.owner || 'Owner withheld';
}

function checklistItems(item) {
  const list = item.checklist || item.checklist_items || item.items || item.requirements || [];
  return Array.isArray(list) ? list : [];
}

function itemKey(item, index) {
  return item.id || item.item_code || item.code || String(index);
}

function itemTitle(item) {
  return item.title || item.label || item.name || item.item_code || item.code || 'Checklist item';
}

function itemComplied(item) {
  if (typeof item.is_complied === 'boolean') return item.is_complied;
  if (typeof item.complied === 'boolean') return item.complied;
  if (typeof item.checked === 'boolean') return item.checked;
  return false;
}

function normalizeChecklist(item) {
  const list = checklistItems(item).map((entry, index) => ({
    key: itemKey(entry, index),
    id: entry.id || null,
    item_code: entry.item_code || entry.code || null,
    title: itemTitle(entry),
    is_complied: itemComplied(entry),
    remarks: entry.remarks || '',
  }));
  return list;
}

export default function TreasuryPage() {
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [payableDocuments, setPayableDocuments] = useState([]);
  const [payableBusinesses, setPayableBusinesses] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [receiptOrNo, setReceiptOrNo] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payMessage, setPayMessage] = useState(null);

  const [bizLoading, setBizLoading] = useState(true);
  const [bizError, setBizError] = useState('');
  const [bizItems, setBizItems] = useState([]);
  const [bizDrafts, setBizDrafts] = useState({});
  const [bizSubmitting, setBizSubmitting] = useState({});

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError('');
    try {
      const res = await fetch('/api/treasury', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const data = await readJson(res);
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (res.status === 403) {
        setUnauthorized(true);
        setQueueError('Treasurer or administrator access is required.');
        return;
      }
      if (!res.ok) {
        setQueueError(data && data.message ? data.message : 'Unable to load treasury queue.');
        return;
      }
      setUnauthorized(false);
      setPayableDocuments(Array.isArray(data.payable_documents) ? data.payable_documents : []);
      setPayableBusinesses(Array.isArray(data.payable_businesses) ? data.payable_businesses : []);
      setRecentPayments(Array.isArray(data.recent_payments) ? data.recent_payments : []);
    } catch {
      setQueueError('Unable to load treasury queue.');
    } finally {
      setQueueLoading(false);
    }
  }, []);

  const loadBusiness = useCallback(async () => {
    setBizLoading(true);
    setBizError('');
    try {
      const res = await fetch('/api/business', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const data = await readJson(res);
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (res.status === 403) {
        setBizError('Access to business screening data is not available for this account.');
        setBizItems([]);
        return;
      }
      if (!res.ok) {
        setBizError(data && data.message ? data.message : 'Unable to load business screening list.');
        setBizItems([]);
        return;
      }
      const items = pickList(data, ['items', 'businesses', 'data', 'entries', 'results']);
      setBizItems(items);
      setBizDrafts((prev) => {
        const next = { ...prev };
        for (const item of items) {
          const id = item.id;
          if (!id || next[id]) continue;
          const checklist = normalizeChecklist(item);
          next[id] = {
            checklist,
            declared_gross_income:
              item.declared_gross_income != null ? String(item.declared_gross_income) : '',
            assessed_fee: item.assessed_fee != null ? String(item.assessed_fee) : '',
            assessment_notes: item.assessment_notes || '',
            status: item.status || 'IN_PERSON_SCREENING',
          };
        }
        return next;
      });
    } catch {
      setBizError('Unable to load business screening list.');
      setBizItems([]);
    } finally {
      setBizLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadBusiness();
  }, [loadQueue, loadBusiness]);

  const selectTarget = useCallback((kind, item) => {
    const fee = kind === 'document' ? item.fee_amount : item.assessed_fee;
    setSelectedTarget({ kind, item });
    setAmount(moneyText(fee));
    setReceiptOrNo('');
    setRemarks('');
    setPaymentMethod('CASH');
    setPayMessage(null);
  }, []);

  const selectedFee = useMemo(() => {
    if (!selectedTarget) return '';
    return selectedTarget.kind === 'document'
      ? selectedTarget.item.fee_amount
      : selectedTarget.item.assessed_fee;
  }, [selectedTarget]);

  const onSubmitPayment = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedTarget) return;
      setPayMessage(null);

      const receipt = receiptOrNo.trim();
      if (!/^[A-Za-z0-9-]{3,40}$/.test(receipt)) {
        setPayMessage({ type: 'error', text: 'OR number must be 3-40 characters (letters, numbers, hyphen).' });
        return;
      }
      if (!sameAmount(amount, selectedFee)) {
        setPayMessage({ type: 'error', text: 'Amount must exactly equal the target fee.' });
        return;
      }

      const payload = {
        amount: moneyText(selectedFee),
        receipt_or_no: receipt,
        payment_method: paymentMethod,
        remarks: remarks.trim() || undefined,
      };
      if (selectedTarget.kind === 'document') {
        payload.document_request_id = selectedTarget.item.tracking_code;
      } else {
        payload.business_clearance_id = selectedTarget.item.id;
      }

      setPaySubmitting(true);
      try {
        const res = await fetch('/api/treasury/pay', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await readJson(res);
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok || !data || !data.success) {
          setPayMessage({
            type: 'error',
            text: data && data.message ? data.message : 'Payment could not be recorded.',
          });
          return;
        }
        setPayMessage({
          type: 'success',
          text: `OR ${data.payment.receipt_or_no} recorded for ${data.payment.target_id}. Target status: ${data.target_status}.`,
          receipt: data.payment,
        });
        setSelectedTarget(null);
        setReceiptOrNo('');
        setAmount('');
        setRemarks('');
        await loadQueue();
      } catch {
        setPayMessage({ type: 'error', text: 'Payment could not be recorded.' });
      } finally {
        setPaySubmitting(false);
      }
    },
    [selectedTarget, receiptOrNo, amount, selectedFee, paymentMethod, remarks, loadQueue],
  );

  const updateBizDraft = useCallback((id, patch) => {
    setBizDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  }, []);

  const toggleChecklist = useCallback((id, key) => {
    setBizDrafts((prev) => {
      const draft = prev[id];
      if (!draft) return prev;
      const checklist = (draft.checklist || []).map((entry) =>
        entry.key === key ? { ...entry, is_complied: !entry.is_complied } : entry,
      );
      return { ...prev, [id]: { ...draft, checklist } };
    });
  }, []);

  const submitBiz = useCallback(
    async (item, nextStatus) => {
      const id = item.id;
      const draft = bizDrafts[id];
      if (!id || !draft) return;
      const currentStatus = item.status || draft.status;
      const allowed =
        (currentStatus === 'INTAKE_SCHEDULED' && nextStatus === 'IN_PERSON_SCREENING') ||
        (currentStatus === 'IN_PERSON_SCREENING' && nextStatus === 'TREASURER_ASSESSED') ||
        (currentStatus === 'TREASURER_ASSESSED' && (nextStatus === 'APPROVED' || nextStatus === 'REJECTED'));
      if (!allowed) return;

      const declared = Number(draft.declared_gross_income);
      const assessed = Number(draft.assessed_fee);
      if (nextStatus !== 'REJECTED' && nextStatus !== 'IN_PERSON_SCREENING') {
        if (!Number.isFinite(declared) || declared < 0) return;
        if (!Number.isFinite(assessed) || assessed < 0) return;
      }

      const checklistPayload = (draft.checklist || []).map((entry) => {
        const base = { is_complied: !!entry.is_complied };
        if (entry.id) base.id = entry.id;
        if (entry.item_code) base.item_code = entry.item_code;
        if (entry.title) base.title = entry.title;
        if (entry.remarks) base.remarks = entry.remarks;
        return base;
      });

      // Starting the screening only moves the state; it must not overwrite the
      // checklist verification that happens during the face-to-face meeting.
      const payload =
        nextStatus === 'IN_PERSON_SCREENING'
          ? { status: nextStatus }
          : {
              status: nextStatus,
              checklist_items: checklistPayload,
              assessment_notes: (draft.assessment_notes || '').trim() || undefined,
            };
      if (nextStatus !== 'IN_PERSON_SCREENING') {
        if (draft.declared_gross_income !== '') payload.declared_gross_income = Number(draft.declared_gross_income);
        if (draft.assessed_fee !== '') payload.assessed_fee = Number(draft.assessed_fee);
      }

      setBizSubmitting((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await fetch(`/api/business/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await readJson(res);
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok) {
          updateBizDraft(id, { submitError: data && data.message ? data.message : 'Update failed.' });
          return;
        }
        updateBizDraft(id, { submitError: '', submitOk: `Updated to ${nextStatus}.` });
        await loadBusiness();
      } catch {
        updateBizDraft(id, { submitError: 'Update failed.' });
      } finally {
        setBizSubmitting((prev) => ({ ...prev, [id]: false }));
      }
    },
    [bizDrafts, loadBusiness, updateBizDraft],
  );

  if (unauthorized) {
    return (
      <main style={styles.page}>
        <section style={styles.card} aria-labelledby="signin-required-title">
          <h1 id="signin-required-title" style={styles.h1}>Treasurer sign-in required</h1>
          <p style={styles.p}>
            Sign in with a Treasurer or Administrator account to use the counter fee settlement and business screening tools.
          </p>
          <p style={styles.pMuted}>
            This screen does not provide a login form. Use the staff sign-in page when it is available.
          </p>
          {queueError ? <p style={styles.error}>{queueError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Treasury Counter</h1>
        <p style={styles.pMuted}>Fee settlement and business screening. Works on the local network without internet access.</p>
      </header>

      <section style={styles.card} aria-labelledby="settlement-title">
        <h2 id="settlement-title" style={styles.h2}>Fee settlement</h2>
        {queueLoading ? <p style={styles.p}>Loading payable items...</p> : null}
        {queueError ? <p style={styles.error} role="alert">{queueError}</p> : null}

        {!queueLoading ? (
          <div style={styles.columns}>
            <div>
              <h3 style={styles.h3}>Payable documents</h3>
              {payableDocuments.length === 0 ? <p style={styles.pMuted}>No payable documents.</p> : (
                <ul style={styles.list}>
                  {payableDocuments.map((doc) => (
                    <li key={doc.tracking_code} style={styles.listItem}>
                      <button
                        type="button"
                        style={styles.selectButton}
                        onClick={() => selectTarget('document', doc)}
                        aria-label={`Select document ${doc.tracking_code} for payment`}
                      >
                        <span style={styles.itemTitle}>{doc.tracking_code}</span>
                        <span style={styles.itemMeta}>{doc.document_type} · {doc.masked_name} · Fee {moneyText(doc.fee_amount)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <h3 style={styles.h3}>Payable businesses</h3>
              {payableBusinesses.length === 0 ? <p style={styles.pMuted}>No payable businesses.</p> : (
                <ul style={styles.list}>
                  {payableBusinesses.map((biz) => (
                    <li key={biz.id} style={styles.listItem}>
                      <button
                        type="button"
                        style={styles.selectButton}
                        onClick={() => selectTarget('business', biz)}
                        aria-label={`Select business ${biz.id} for payment`}
                      >
                        <span style={styles.itemTitle}>{biz.id}</span>
                        <span style={styles.itemMeta}>{ownerLabel(biz)} · Assessed fee {moneyText(biz.assessed_fee)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 style={styles.h3}>Record payment</h3>
              {!selectedTarget ? (
                <p style={styles.pMuted}>Select a payable document or business to record an official receipt.</p>
              ) : (
                <form onSubmit={onSubmitPayment} style={styles.form}>
                  <p style={styles.p}><strong>Target:</strong> {selectedTarget.kind === 'document' ? selectedTarget.item.tracking_code : selectedTarget.item.id}</p>
                  <label style={styles.label}>
                    OR number
                    <input
                      style={styles.input}
                      value={receiptOrNo}
                      onChange={(e) => setReceiptOrNo(e.target.value)}
                      required
                      minLength={3}
                      maxLength={40}
                      pattern="[A-Za-z0-9-]{3,40}"
                      autoComplete="off"
                      aria-label="Official receipt number"
                    />
                  </label>
                  <label style={styles.label}>
                    Amount
                    <input
                      style={styles.input}
                      value={amount}
                      readOnly
                      aria-readonly="true"
                      aria-label="Amount"
                    />
                  </label>
                  <label style={styles.label}>
                    Payment method
                    <select
                      style={styles.input}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      aria-label="Payment method"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={styles.label}>
                    Remarks
                    <textarea
                      style={styles.textarea}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      maxLength={500}
                      aria-label="Remarks"
                    />
                  </label>
                  <button type="submit" style={styles.primaryButton} disabled={paySubmitting}>
                    {paySubmitting ? 'Recording...' : 'Record payment'}
                  </button>
                </form>
              )}

              {payMessage ? (
                <div
                  style={payMessage.type === 'error' ? styles.errorBox : styles.successBox}
                  role={payMessage.type === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  <p style={styles.p}>{payMessage.text}</p>
                  {payMessage.receipt ? (
                    <p style={styles.p}>
                      <strong>OR confirmation:</strong> {payMessage.receipt.receipt_or_no} · {moneyText(payMessage.receipt.amount)} · {payMessage.receipt.payment_method}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <h3 style={styles.h3}>Recent payments</h3>
              {recentPayments.length === 0 ? <p style={styles.pMuted}>No recent payments.</p> : (
                <ul style={styles.list}>
                  {recentPayments.map((p) => (
                    <li key={p.id} style={styles.recentItem}>
                      <div style={styles.itemTitle}>{p.receipt_or_no} · {moneyText(p.amount)}</div>
                      <div style={styles.itemMeta}>{p.payment_method} · {p.target_type} {p.target_id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section style={styles.card} aria-labelledby="screening-title">
        <h2 id="screening-title" style={styles.h2}>Business screening</h2>
        {bizLoading ? <p style={styles.p}>Loading business screening items...</p> : null}
        {bizError ? <p style={styles.error} role="alert">{bizError}</p> : null}
        {!bizLoading && !bizError && bizItems.length === 0 ? (
          <p style={styles.pMuted}>No business entries available.</p>
        ) : null}

        <div style={styles.bizGrid}>
          {bizItems.map((item) => {
            const draft = bizDrafts[item.id] || { checklist: normalizeChecklist(item), declared_gross_income: '', assessed_fee: '', assessment_notes: '', status: item.status };
            const busy = !!bizSubmitting[item.id];
            const status = item.status || draft.status;
            const canScreen = status === 'INTAKE_SCHEDULED';
            const canAssess = status === 'IN_PERSON_SCREENING';
            const canDecide = status === 'TREASURER_ASSESSED';
            return (
              <article key={item.id} style={styles.bizCard} aria-label={`Business ${item.id}`}>
                <h3 style={styles.h3}>{item.id}</h3>
                <p style={styles.itemMeta}>Owner: {ownerLabel(item)}</p>
                <p style={styles.itemMeta}>Status: {status || 'Unknown'}</p>

                <div style={styles.checklistBox}>
                  <p style={styles.labelText}>Checklist</p>
                  {(draft.checklist || []).length === 0 ? (
                    <p style={styles.pMuted}>No checklist items provided.</p>
                  ) : (
                    <ul style={styles.checklistList}>
                      {(draft.checklist || []).map((entry) => (
                        <li key={entry.key} style={styles.checkItem}>
                          <label style={styles.checkLabel}>
                            <input
                              type="checkbox"
                              checked={!!entry.is_complied}
                              onChange={() => toggleChecklist(item.id, entry.key)}
                              aria-label={`Mark ${entry.title} as ${entry.is_complied ? 'not complied' : 'complied'}`}
                            />
                            <span>{entry.title}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label style={styles.label}>
                  Declared gross income
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={draft.declared_gross_income}
                    onChange={(e) => updateBizDraft(item.id, { declared_gross_income: e.target.value })}
                    aria-label={`Declared gross income for ${item.id}`}
                  />
                </label>
                <label style={styles.label}>
                  Assessed fee
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={draft.assessed_fee}
                    onChange={(e) => updateBizDraft(item.id, { assessed_fee: e.target.value })}
                    aria-label={`Assessed fee for ${item.id}`}
                  />
                </label>
                <label style={styles.label}>
                  Notes
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    value={draft.assessment_notes}
                    onChange={(e) => updateBizDraft(item.id, { assessment_notes: e.target.value })}
                    aria-label={`Assessment notes for ${item.id}`}
                  />
                </label>

                <div style={styles.actions}>
                  {canScreen ? (
                    <button type="button" style={styles.primaryButton} disabled={busy} onClick={() => submitBiz(item, 'IN_PERSON_SCREENING')}>
                      {busy ? 'Saving...' : 'Start In-Person Screening'}
                    </button>
                  ) : null}
                  {canAssess ? (
                    <button type="button" style={styles.primaryButton} disabled={busy} onClick={() => submitBiz(item, 'TREASURER_ASSESSED')}>
                      {busy ? 'Saving...' : 'Mark Treasurer Assessed'}
                    </button>
                  ) : null}
                  {canDecide ? (
                    <>
                      <button type="button" style={styles.primaryButton} disabled={busy} onClick={() => submitBiz(item, 'APPROVED')}>
                        {busy ? 'Saving...' : 'Approve'}
                      </button>
                      <button type="button" style={styles.secondaryButton} disabled={busy} onClick={() => submitBiz(item, 'REJECTED')}>
                        {busy ? 'Saving...' : 'Reject'}
                      </button>
                    </>
                  ) : null}
                  {!canScreen && !canAssess && !canDecide ? (
                    <p style={styles.pMuted}>No screening transition available for this status.</p>
                  ) : null}
                </div>
                {draft.submitError ? <p style={styles.error} role="alert">{draft.submitError}</p> : null}
                {draft.submitOk ? <p style={styles.successText} role="status">{draft.submitOk}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    color: '#111827',
    background: '#f8fafc',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  header: { marginBottom: 16 },
  card: {
    background: 'var(--card-bg, #ffffff)',
    border: '1px solid var(--card-border, #e5e7eb)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },
  bizGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },
  bizCard: {
    border: '1px solid var(--card-border, #e5e7eb)',
    borderRadius: 12,
    padding: 16,
    background: 'var(--card-bg, #fff)',
    boxSizing: 'border-box',
  },
  h1: { fontSize: 26, fontWeight: 800, lineHeight: 1.2, margin: '0 0 8px', color: 'var(--text-heading, #0f172a)' },
  h2: { fontSize: 20, fontWeight: 700, lineHeight: 1.3, margin: '0 0 12px', color: 'var(--text-heading, #0f172a)' },
  h3: { fontSize: 17, fontWeight: 600, lineHeight: 1.3, margin: '14px 0 8px', color: 'var(--text-heading, #0f172a)' },
  p: { margin: '0 0 8px', fontSize: 15, lineHeight: 1.5, color: 'var(--text-body, #1e293b)' },
  pMuted: { margin: '0 0 8px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted, #4b5563)' },
  error: { margin: '0 0 8px', fontSize: 14, color: '#dc2626', fontWeight: 600 },
  successText: { margin: '8px 0 0', fontSize: 14, color: '#16a34a', fontWeight: 600 },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { marginBottom: 8 },
  recentItem: { padding: '8px 0', borderBottom: '1px solid var(--card-border, #f1f5f9)' },
  selectButton: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid var(--card-border, #cbd5e1)',
    background: 'var(--btn-bg, #f8fafc)',
    color: 'var(--text-body, #1e293b)',
    borderRadius: 8,
    padding: '12px 14px',
    cursor: 'pointer',
  },
  itemTitle: { display: 'block', fontWeight: 700, fontSize: 15, marginBottom: 2, color: 'var(--text-heading, #0f172a)' },
  itemMeta: { display: 'block', fontSize: 14, color: 'var(--text-muted, #374151)', marginBottom: 4, overflowWrap: 'anywhere' },
  form: { display: 'grid', gap: 12 },
  label: { display: 'grid', gap: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-heading, #0f172a)' },
  labelText: { fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-heading, #0f172a)' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--input-border, #cbd5e1)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 15,
    background: 'var(--input-bg, #fff)',
    color: 'var(--text-body, #0f172a)',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--input-border, #cbd5e1)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 15,
    background: 'var(--input-bg, #fff)',
    color: 'var(--text-body, #0f172a)',
    resize: 'vertical',
  },
  primaryButton: {
    border: '1px solid #1d4ed8',
    background: '#2563eb',
    color: '#fff',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid var(--card-border, #9ca3af)',
    background: 'var(--btn-bg, #fff)',
    color: 'var(--text-heading, #111827)',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 6,
    border: '1px solid #fecaca',
    background: '#fef2f2',
  },
  successBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 6,
    border: '1px solid #bbf7d0',
    background: '#f0fdf4',
  },
  checklistBox: { margin: '8px 0' },
  checklistList: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 },
  checkItem: { margin: 0 },
  checkLabel: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14 },
};
