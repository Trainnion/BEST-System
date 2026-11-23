'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'GCASH_MOCK', label: 'GCash' },
];

function paymentMethodLabel(value) {
  if (value === 'LANDBANK_MOCK') return 'LandBank (legacy record)';
  return PAYMENT_METHODS.find((method) => method.value === value)?.label || value || 'Unknown';
}

function moneyText(value) {
  if (value == null || value === '') return '0.00';
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
}

function dateTimeText(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
  return item.owner_name || item.owner || 'Owner unavailable';
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
  const [gcashReferenceNo, setGcashReferenceNo] = useState('');
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
    setSelectedTarget({ kind, item });
    setGcashReferenceNo('');
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

      const gcashReference = gcashReferenceNo.trim();
      if (paymentMethod === 'GCASH_MOCK' && !/^[A-Za-z0-9-]{6,40}$/.test(gcashReference)) {
        setPayMessage({ type: 'error', text: 'Enter the GCash reference number (6–40 letters, numbers, or hyphens).' });
        return;
      }

      const payload = {
        amount: moneyText(selectedFee),
        payment_method: paymentMethod,
        remarks: remarks.trim() || undefined,
      };
      if (paymentMethod === 'GCASH_MOCK') payload.gcash_reference_no = gcashReference;
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
        const targetLabel = selectedTarget.kind === 'document' ? selectedTarget.item.document_type : 'business clearance';
        const nextStep = data.target_status === 'READY_FOR_PICKUP'
          ? 'The document is now ready for pickup.'
          : 'The business clearance remains approved.';
        setPayMessage({
          type: 'success',
          text: `Payment recorded for ${targetLabel}. BEST transaction number ${data.payment.transaction_no} created. ${nextStep}`,
          receipt: data.payment,
        });
        setSelectedTarget(null);
        setGcashReferenceNo('');
        setRemarks('');
        await loadQueue();
      } catch {
        setPayMessage({ type: 'error', text: 'Payment could not be recorded.' });
      } finally {
        setPaySubmitting(false);
      }
    },
    [selectedTarget, gcashReferenceNo, selectedFee, paymentMethod, remarks, loadQueue],
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
        <h1 style={styles.h1}>Treasury and Official Receipts</h1>
        <p style={styles.pMuted}>Review approved requests, record cash or GCash payments, and track each payment with a BEST-generated transaction number.</p>
      </header>

      <section style={styles.card} aria-labelledby="settlement-title">
        <div style={styles.sectionHeading}>
          <div>
            <h2 id="settlement-title" style={styles.h2}>Record a payment</h2>
            <p style={styles.pMuted}>Choose a request, confirm the payment method, then record the payment.</p>
          </div>
          <span style={styles.countBadge}>{queueLoading ? 'Loading' : `${payableDocuments.length + payableBusinesses.length} waiting`}</span>
        </div>
        <ol style={styles.steps} aria-label="Payment steps">
          <li style={styles.step}><strong style={styles.stepNumber}>1</strong><span>Choose a request</span></li>
          <li style={styles.step}><strong style={styles.stepNumber}>2</strong><span>Add a GCash reference when needed</span></li>
          <li style={styles.step}><strong style={styles.stepNumber}>3</strong><span>Record the payment</span></li>
        </ol>
        {queueLoading ? <p style={styles.p}>Loading payable items...</p> : null}
        {queueError ? <p style={styles.error} role="alert">{queueError}</p> : null}

        {!queueLoading ? (
          <div style={styles.columns}>
            <div style={styles.queueColumn}>
              <div style={styles.queueHeading}>
              <h3 style={styles.h3}>Requests awaiting payment</h3>
                <span style={styles.pMuted}>{payableDocuments.length + payableBusinesses.length} total</span>
              </div>
              <p style={styles.helper}>Only requests that have passed their required review appear here.</p>
              <h4 style={styles.subheading}>Barangay documents <span style={styles.inlineCount}>{payableDocuments.length}</span></h4>
              {payableDocuments.length === 0 ? <p style={styles.pMuted}>No payable documents.</p> : (
                <ul style={styles.list}>
                  {payableDocuments.map((doc) => (
                    <li key={doc.tracking_code} style={styles.listItem}>
                      <button
                        type="button"
                        style={selectedTarget?.kind === 'document' && selectedTarget.item.tracking_code === doc.tracking_code
                          ? { ...styles.selectButton, ...styles.selectButtonSelected }
                          : styles.selectButton}
                        onClick={() => selectTarget('document', doc)}
                        disabled={paySubmitting}
                        aria-pressed={selectedTarget?.kind === 'document' && selectedTarget.item.tracking_code === doc.tracking_code}
                        aria-label={`Select document ${doc.tracking_code} for payment`}
                      >
                        <span style={styles.itemTitle}>{doc.document_type}</span>
                        <span style={styles.itemMeta}>Request {doc.tracking_code} · {doc.resident_name || 'Name unavailable'}</span>
                        <span style={styles.itemFee}>₱{moneyText(doc.fee_amount)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <h4 style={styles.subheading}>Business clearances <span style={styles.inlineCount}>{payableBusinesses.length}</span></h4>
              {payableBusinesses.length === 0 ? <p style={styles.pMuted}>No payable businesses.</p> : (
                <ul style={styles.list}>
                  {payableBusinesses.map((biz) => (
                    <li key={biz.id} style={styles.listItem}>
                      <button
                        type="button"
                        style={selectedTarget?.kind === 'business' && selectedTarget.item.id === biz.id
                          ? { ...styles.selectButton, ...styles.selectButtonSelected }
                          : styles.selectButton}
                        onClick={() => selectTarget('business', biz)}
                        disabled={paySubmitting}
                        aria-pressed={selectedTarget?.kind === 'business' && selectedTarget.item.id === biz.id}
                        aria-label={`Select business ${biz.id} for payment`}
                      >
                        <span style={styles.itemTitle}>Business clearance</span>
                        <span style={styles.itemMeta}>Application {biz.id} · {ownerLabel(biz)}</span>
                        <span style={styles.itemFee}>₱{moneyText(biz.assessed_fee)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.paymentColumn}>
              <h3 style={styles.h3}>Payment details</h3>
              {!selectedTarget ? (
                <div style={styles.emptySelection}>
                  <span style={styles.emptySelectionNumber}>1</span>
                  <p style={styles.p}>Choose a request from the list to see its fee and continue.</p>
                </div>
              ) : (
                <form onSubmit={onSubmitPayment} style={styles.form}>
                  <div style={styles.selectedSummary}>
                    <p style={styles.summaryLabel}>Selected request</p>
                    <p style={styles.selectedTitle}>{selectedTarget.kind === 'document' ? selectedTarget.item.document_type : 'Business clearance'}</p>
                    <p style={styles.itemMeta}>
                      {selectedTarget.kind === 'document'
                        ? `Request ${selectedTarget.item.tracking_code} · ${selectedTarget.item.resident_name || 'Name unavailable'}`
                        : `Application ${selectedTarget.item.id} · ${ownerLabel(selectedTarget.item)}`}
                    </p>
                    <div style={styles.feeLine}>
                      <span>Amount due</span>
                      <strong>₱{moneyText(selectedFee)}</strong>
                    </div>
                  </div>
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
                  {paymentMethod === 'GCASH_MOCK' ? (
                    <label style={styles.label}>
                      GCash reference number
                      <input
                        style={styles.input}
                        value={gcashReferenceNo}
                        onChange={(e) => setGcashReferenceNo(e.target.value)}
                        required
                        minLength={6}
                        maxLength={40}
                        pattern="[A-Za-z0-9-]{6,40}"
                        autoComplete="off"
                        placeholder="Enter the reference from the GCash payment"
                        aria-describedby="gcash-reference-help"
                      />
                      <span id="gcash-reference-help" style={styles.helper}>Use the reference number shown in the GCash payment confirmation.</span>
                    </label>
                  ) : (
                    <p style={styles.helper}>Cash payments do not need a provider reference. BEST assigns the transaction number after you record the payment.</p>
                  )}
                  <label style={styles.label}>
                    Notes (optional)
                    <textarea
                      style={styles.textarea}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      maxLength={500}
                      aria-label="Remarks"
                    />
                  </label>
                  <div>
                    <button type="submit" style={styles.primaryButton} disabled={paySubmitting}>
                      {paySubmitting ? 'Recording payment...' : 'Record payment'}
                    </button>
                    <p style={styles.helper}>BEST creates the transaction number automatically when the payment is saved.</p>
                  </div>
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
                      <strong>Transaction number:</strong> {payMessage.receipt.transaction_no} · ₱{moneyText(payMessage.receipt.amount)} · {paymentMethodLabel(payMessage.receipt.payment_method)}
                    </p>
                  ) : null}
                  {payMessage.receipt?.gcash_reference_no ? (
                    <p style={styles.p}><strong>GCash reference:</strong> {payMessage.receipt.gcash_reference_no}</p>
                  ) : null}
                </div>
              ) : null}

            </div>
          </div>
        ) : null}
      </section>

      <section style={styles.card} aria-labelledby="recent-payments-title">
        <div style={styles.sectionHeading}>
          <div>
            <h2 id="recent-payments-title" style={styles.h2}>Recent payment transactions</h2>
            <p style={styles.pMuted}>Latest payments recorded at the counter.</p>
          </div>
          <span style={styles.countBadge}>{recentPayments.length} records</span>
        </div>
        {recentPayments.length === 0 ? <p style={styles.pMuted}>No payments have been recorded yet.</p> : (
          <ul style={styles.receiptList}>
            {recentPayments.map((payment) => (
              <li key={payment.id} style={styles.receiptItem}>
                <div style={styles.receiptMain}>
                  <strong style={styles.itemTitle}>Transaction {payment.transaction_no || payment.id}</strong>
                  <span style={styles.itemMeta}>{payment.target_type === 'DOCUMENT_REQUEST' ? 'Barangay document' : 'Business clearance'} · {payment.target_id}</span>
                  <span style={styles.itemMeta}>{dateTimeText(payment.collected_at)} · {paymentMethodLabel(payment.payment_method)}</span>
                  {payment.gcash_reference_no ? <span style={styles.itemMeta}>GCash reference: {payment.gcash_reference_no}</span> : null}
                  {payment.official_receipt_no ? <span style={styles.itemMeta}>Official receipt no.: {payment.official_receipt_no}</span> : null}
                </div>
                <strong style={styles.receiptAmount}>₱{moneyText(payment.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details style={styles.card}>
        <summary style={styles.detailsSummary}>
          <span>
            <strong style={styles.detailsTitle}>Business clearance screening</strong>
            <span style={styles.detailsCaption}>Review applications and assess fees before payment.</span>
          </span>
          <span style={styles.countBadge}>{bizLoading ? 'Loading' : bizError ? 'Could not load' : `${bizItems.length} applications`}</span>
          <span style={styles.disclosureHint}>View screening steps ↓</span>
        </summary>
        <div style={styles.detailsBody}>
        {bizLoading ? <p style={styles.p}>Loading business screening items...</p> : null}
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
        </div>
      </details>
      {bizError ? <p style={styles.error} role="alert">{bizError}</p> : null}
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    color: 'var(--text-body, #1e293b)',
    background: 'var(--admin-page-bg, #f8fafc)',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  header: { marginBottom: 16 },
  sectionHeading: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  countBadge: { display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: 'var(--admin-accent-soft, #eff6ff)', color: 'var(--admin-accent-text, #1e40af)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, listStyle: 'none', padding: 0, margin: '16px 0 20px' },
  step: { display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, padding: '8px 10px', border: '1px solid var(--card-border, #e5e7eb)', borderRadius: 9, background: 'var(--card-bg, #fff)', color: 'var(--text-body, #1e293b)', fontSize: 14 },
  stepNumber: { display: 'inline-flex', flex: '0 0 24px', alignItems: 'center', justifyContent: 'center', height: 24, borderRadius: 999, background: 'var(--admin-accent-soft, #dbeafe)', color: 'var(--admin-accent-text, #1d4ed8)', fontSize: 13 },
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
  queueColumn: { minWidth: 0 },
  paymentColumn: { minWidth: 0, border: '1px solid var(--card-border, #e5e7eb)', borderRadius: 12, padding: 16, background: 'var(--admin-surface-subtle, #f8fafc)', boxSizing: 'border-box' },
  queueHeading: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  subheading: { margin: '18px 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--text-heading, #0f172a)' },
  inlineCount: { display: 'inline-flex', minWidth: 22, justifyContent: 'center', marginLeft: 4, borderRadius: 999, padding: '1px 6px', background: 'var(--admin-neutral-soft, #f1f5f9)', color: 'var(--admin-neutral-text, #334155)', fontSize: 12 },
  helper: { display: 'block', margin: '4px 0 10px', fontSize: 13, lineHeight: 1.45, color: 'var(--text-muted, #4b5563)' },
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
  error: { margin: '0 0 8px', fontSize: 14, color: 'var(--admin-error-text, #b91c1c)', fontWeight: 600 },
  successText: { margin: '8px 0 0', fontSize: 14, color: 'var(--admin-success-text, #15803d)', fontWeight: 600 },
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
  selectButtonSelected: { borderColor: 'var(--admin-accent-border, #2563eb)', background: 'var(--admin-accent-soft, #eff6ff)', boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.12)' },
  itemTitle: { display: 'block', fontWeight: 700, fontSize: 15, marginBottom: 2, color: 'var(--text-heading, #0f172a)' },
  itemMeta: { display: 'block', fontSize: 14, color: 'var(--text-muted, #374151)', marginBottom: 4, overflowWrap: 'anywhere' },
  itemFee: { display: 'block', marginTop: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-heading, #0f172a)' },
  form: { display: 'grid', gap: 12 },
  selectedSummary: { padding: 14, border: '1px solid var(--admin-accent-border, #bfdbfe)', borderRadius: 10, background: 'var(--admin-accent-soft, #eff6ff)' },
  summaryLabel: { margin: '0 0 4px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--admin-accent-text, #1e40af)' },
  selectedTitle: { margin: '0 0 4px', fontSize: 17, fontWeight: 750, color: 'var(--text-heading, #0f172a)' },
  feeLine: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--admin-accent-border, #bfdbfe)', marginTop: 10, paddingTop: 10, fontSize: 15, color: 'var(--text-heading, #0f172a)' },
  emptySelection: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, border: '1px dashed var(--card-border, #cbd5e1)', borderRadius: 10, background: 'var(--card-bg, #fff)' },
  emptySelectionNumber: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 24px', height: 24, borderRadius: 999, background: '#e2e8f0', color: '#334155', fontWeight: 700 },
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
    border: '1px solid var(--admin-error-border, #fecaca)',
    background: 'var(--admin-error-bg, #fef2f2)',
  },
  successBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 6,
    border: '1px solid var(--admin-success-border, #bbf7d0)',
    background: 'var(--admin-success-bg, #f0fdf4)',
  },
  receiptList: { listStyle: 'none', padding: 0, margin: 0 },
  receiptItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid var(--card-border, #e5e7eb)' },
  receiptMain: { minWidth: 0 },
  receiptAmount: { flex: '0 0 auto', fontSize: 17, color: 'var(--text-heading, #0f172a)' },
  detailsSummary: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', cursor: 'pointer', listStyle: 'none' },
  detailsTitle: { display: 'block', fontSize: 20, lineHeight: 1.3, color: 'var(--text-heading, #0f172a)' },
  detailsCaption: { display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted, #4b5563)' },
  disclosureHint: { fontSize: 13, fontWeight: 600, color: 'var(--admin-accent-text, #1e40af)', whiteSpace: 'nowrap' },
  detailsBody: { marginTop: 16 },
  checklistBox: { margin: '8px 0' },
  checklistList: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 },
  checkItem: { margin: 0 },
  checkLabel: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14 },
};
