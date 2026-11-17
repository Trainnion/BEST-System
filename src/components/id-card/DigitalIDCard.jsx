'use client';

/**
 * DigitalIDCard - the eGovPH-style digital barangay ID (plan Sec. 17.2).
 *
 * Front: photo or initials, name, Resident No., card No., purok, birth date,
 *        blood type and valid-until.
 * Back:  Code 128 barcode, emergency contact and the view-only notice.
 * Flip:  a CSS 3D flip in the Full tier and a tap-to-swap in the Lite tier,
 *        driven by the existing useMotionPreference hook.
 *
 * This is a viewer only. There is intentionally no print button, route,
 * permission or stylesheet in this module or package.
 */

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import useMotionPreference from '@/lib/hooks/useMotionPreference.js';

import BarcodeDisplay from './BarcodeDisplay.jsx';
import styles from './IdCard.module.css';

const EM_DASH = '\u2014';

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatDate(value) {
  if (typeof value !== 'string' || value.trim() === '') return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  try {
    return new Intl.DateTimeFormat('en-PH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return value;
  }
}

/**
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  const parts = typeof name === 'string' ? name.trim().split(/\s+/).filter(Boolean) : [];
  if (parts.length === 0) return 'ID';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/**
 * @param {string} status
 * @returns {{label: string, className: string, watermarked: boolean}}
 */
function statusMeta(status) {
  if (status === 'EXPIRED') {
    return { label: 'Expired', className: 'state-warning', watermarked: true };
  }
  if (status === 'REVOKED') {
    return { label: 'Revoked', className: 'state-danger', watermarked: true };
  }
  if (status === 'ACTIVE') {
    return { label: 'Active', className: 'state-success', watermarked: false };
  }
  return { label: status || 'Unknown', className: 'state-neutral', watermarked: false };
}

function Watermark({ label }) {
  return (
    <div className={styles.watermark} aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}

function CardHeader({ sub }) {
  return (
    <div className={styles.top}>
      <div className={styles.brand}>
        <span className={styles.seal} aria-hidden="true">
          BEST
        </span>
        <div className={styles.brandText}>
          <p className={styles.brandTitle}>Barangay Digital ID</p>
          <p className={styles.brandSub}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div className={styles.detail}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={styles.detailValue + (mono ? ' ' + styles.mono : '')}>{value}</p>
    </div>
  );
}

/**
 * @param {{card: object}} props
 */
export default function DigitalIDCard({ card }) {
  const { tier, reducedMotion } = useMotionPreference();
  const [flipped, setFlipped] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);

  const photoUrl = typeof card.photo_url === 'string' ? card.photo_url : '';
  const status = typeof card.status === 'string' ? card.status.toUpperCase() : 'UNKNOWN';
  const meta = statusMeta(status);
  const isFull = tier === 'full' && !reducedMotion;
  const stageClass =
    styles.stage +
    ' ' +
    (isFull ? styles.stageFull : styles.stageLite) +
    (flipped ? ' ' + styles.flipped : '');

  useEffect(() => {
    setPhotoBroken(false);
  }, [photoUrl]);

  useEffect(() => {
    setFlipped(false);
  }, [card.id]);

  return (
    <div>
      <div className={stageClass}>
        <div className={styles.inner}>
          <article className={styles.face + ' ' + styles.front} aria-labelledby="id-card-name">
            {meta.watermarked ? <Watermark label={meta.label} /> : null}

            <CardHeader sub="Barangay E-Services System Terminal" />

            <div className={styles.identity}>
              {photoUrl && !photoBroken ? (
                <img
                  className={styles.photo}
                  src={photoUrl}
                  alt=""
                  width="84"
                  height="84"
                  onError={() => setPhotoBroken(true)}
                />
              ) : (
                <span className={styles.avatar} aria-hidden="true">
                  {initials(card.full_name)}
                </span>
              )}

              <div className={styles.identityText}>
                <p className={styles.eyebrow}>Resident</p>
                <h2 className={styles.name} id="id-card-name">
                  {card.full_name || 'Resident'}
                </h2>
                <div className={styles.identityMeta}>
                  <span className={styles.statusChip + ' ' + meta.className}>{meta.label}</span>
                  <span className={styles.metaText}>Digital viewer</span>
                </div>
              </div>
            </div>

            <div className={styles.details}>
              <Detail label="Resident No." value={card.resident_no || EM_DASH} mono />
              <Detail label="Card No." value={card.card_number || EM_DASH} mono />
              <Detail label="Purok" value={card.purok || EM_DASH} />
              <Detail label="Birth date" value={formatDate(card.birth_date)} />
              <Detail label="Blood type" value={card.blood_type || 'Unknown'} />
              <Detail label="Valid until" value={formatDate(card.valid_until)} />
            </div>

            <div className={styles.footerRow}>
              <p className={styles.footerNote}>Show this screen at the barangay hall.</p>
              <div className={styles.validity}>
                <p className={styles.detailLabel}>Issued</p>
                <p className={styles.validityValue}>{formatDate(card.issued_date)}</p>
              </div>
            </div>
          </article>

          <article className={styles.face + ' ' + styles.back} aria-label="Back of the digital ID card">
            {meta.watermarked ? <Watermark label={meta.label} /> : null}

            <CardHeader sub={card.card_number || 'Barangay digital ID'} />

            <p className={styles.sectionTitle}>Code 128 barcode</p>
            <div className={styles.barcodeBox}>
              <BarcodeDisplay value={card.barcode_data} />
            </div>

            <p className={styles.sectionTitle}>Emergency contact</p>
            <div className={styles.emergency}>
              <div className={styles.emergencyRow}>
                <p className={styles.emergencyLabel}>Name</p>
                <p className={styles.emergencyValue}>
                  {card.emergency_contact_name || 'Not available'}
                </p>
              </div>
              <p className={styles.emergencyValue}>{card.emergency_contact_phone || 'Not available'}</p>
            </div>

            <p className={styles.notice}>
              This screen is a digital viewer only. There is no paper version of this card, and a
              screenshot does not replace the live card shown here.
            </p>

            <div className={styles.footerRow}>
              <p className={styles.footerNote}>If found, return to the barangay hall.</p>
              <div className={styles.validity}>
                <p className={styles.detailLabel}>Status</p>
                <p className={styles.validityValue}>{meta.label}</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          className={styles.flipButton}
          onClick={() => setFlipped((current) => !current)}
          aria-pressed={flipped}
          aria-label={
            flipped ? 'Show the front of the digital ID card' : 'Show the back of the digital ID card'
          }
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {flipped ? 'Show front' : 'Show back'}
        </button>
      </div>
    </div>
  );
}
