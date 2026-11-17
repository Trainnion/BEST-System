'use client';

/**
 * IDCardViewer - client fetch + opt-in local copy for /id-card (plan Sec. 17.2).
 *
 * The page itself renders no personal data: this component calls
 * GET /api/resident/id-card, shows a skeleton while the request is in flight,
 * and redirects to the resident sign-in page on 401.
 *
 * "Save to this device" is an explicit tap. The saved copy is never loaded over
 * fresh API data; it is only offered as a fallback when the live request fails.
 * Kiosk mode disables both save and remove and explains why.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import DigitalIDCard from './DigitalIDCard.jsx';
import {
  hasSavedCard,
  readSavedCard,
  removeSavedCard,
  saveCardToDevice,
} from './storage.js';

const LOGIN_TARGET = '/resident/login?next=/id-card';
const KIOSK = process.env.NEXT_PUBLIC_KIOSK === '1';

function CardSkeleton() {
  return (
    <div
      className="glass mx-auto w-full max-w-[26rem] p-5"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading your digital ID card.</span>
      <div className="glass-skeleton h-6 w-44 rounded-full" />
      <div className="mt-5 flex items-center gap-4">
        <div className="glass-skeleton h-[5.25rem] w-[5.25rem] flex-none rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="glass-skeleton h-3 w-20 rounded-full" />
          <div className="glass-skeleton mt-2 h-5 w-3/4" />
          <div className="glass-skeleton mt-2 h-4 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index}>
            <div className="glass-skeleton h-2.5 w-16 rounded-full" />
            <div className="glass-skeleton mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="glass-skeleton mt-5 h-10 w-full rounded-xl" />
    </div>
  );
}

function Feedback({ feedback }) {
  if (!feedback) return null;
  return (
    <p
      className={
        'mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed ' +
        (feedback.tone === 'error'
          ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
          : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200')
      }
      role={feedback.tone === 'error' ? 'alert' : 'status'}
    >
      {feedback.text}
    </p>
  );
}

export default function IDCardViewer() {
  const router = useRouter();
  const [mode, setMode] = useState('loading');
  const [card, setCard] = useState(null);
  const [savedAvailable, setSavedAvailable] = useState(false);
  const [offerSaved, setOfferSaved] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setMode('loading');
      setOfferSaved(false);
      let mayOfferSaved = true;
      try {
        const response = await fetch('/api/resident/id-card', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (active) router.replace(LOGIN_TARGET);
          return;
        }
        if (!response.ok) {
          // A definite "no card" answer must never be replaced by a stale copy.
          mayOfferSaved = response.status >= 500;
          throw new Error('The card could not be loaded.');
        }

        const data = await response.json();
        if (!data || typeof data !== 'object' || typeof data.id !== 'string') {
          throw new Error('The card answer was incomplete.');
        }

        if (!active) return;
        setCard(data);
        setMode('ready');

        // Only update the device panel; a storage failure never hides the live card.
        if (!KIOSK) {
          try {
            const savedExists = await hasSavedCard();
            if (active) setSavedAvailable(savedExists);
          } catch {
            // Device storage is unavailable; the live card still works.
          }
        }
      } catch {
        if (!active || controller.signal.aborted) return;
        let savedExists = false;
        try {
          savedExists = await hasSavedCard();
        } catch {
          savedExists = false;
        }
        if (!active) return;
        setSavedAvailable(savedExists);
        setOfferSaved(savedExists && mayOfferSaved);
        setMode('error');
      }
    }

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [router, reloadToken]);

  async function handleViewSaved() {
    setBusy(true);
    setFeedback(null);
    try {
      const saved = await readSavedCard();
      if (!saved || typeof saved.id !== 'string') {
        setSavedAvailable(false);
        setFeedback({
          tone: 'error',
          text: 'The saved copy could not be found on this device. Save the card again when the server is reachable.',
        });
        return;
      }
      setCard(saved);
      setMode('saved');
    } catch {
      setFeedback({
        tone: 'error',
        text: 'The saved copy could not be opened on this device.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!card || KIOSK) return;
    setBusy(true);
    setFeedback(null);
    try {
      await saveCardToDevice(card);
      setSavedAvailable(true);
      setFeedback({
        tone: 'success',
        text: 'Saved on this device. Your ID details now stay in this browser so you can open the card when the barangay server is unreachable. Remove them when you finish using a shared device.',
      });
    } catch {
      setFeedback({
        tone: 'error',
        text: 'This device could not save the card. The card still works while this page is open.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (KIOSK) return;
    setBusy(true);
    setFeedback(null);
    try {
      await removeSavedCard();
      setSavedAvailable(false);
      setFeedback({ tone: 'success', text: 'Removed from this device.' });
      if (mode === 'saved') {
        setCard(null);
        setOfferSaved(false);
        setMode('removed');
      }
    } catch {
      setFeedback({
        tone: 'error',
        text: 'This device could not remove the saved copy. Try again, or clear this site\u2019s data in the browser settings.',
      });
    } finally {
      setBusy(false);
    }
  }

  function handleRetry() {
    setFeedback(null);
    setReloadToken((value) => value + 1);
  }

  return (
    <section aria-label="Digital Barangay ID viewer">
      {mode === 'loading' ? <CardSkeleton /> : null}

      {mode === 'error' ? (
        <div className="glass mx-auto w-full max-w-[26rem] p-5" role="alert">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            The digital ID could not be loaded
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            The barangay server may be unreachable, or no card has been issued for this account yet.
            Ask the barangay hall if you believe your card is missing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            {savedAvailable && offerSaved && !KIOSK ? (
              <button
                type="button"
                onClick={handleViewSaved}
                disabled={busy}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                View saved copy
              </button>
            ) : null}
          </div>
          <Feedback feedback={feedback} />
        </div>
      ) : null}

      {mode === 'removed' ? (
        <div className="glass mx-auto w-full max-w-[26rem] p-5" role="status">
          <p className="text-sm font-semibold text-slate-100">Saved copy removed</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            The copy kept in this browser has been deleted. Load the live card again whenever you
            are connected.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleRetry}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Load live card
            </button>
          </div>
          <Feedback feedback={feedback} />
        </div>
      ) : null}

      {mode === 'ready' || mode === 'saved' ? (
        <>
          {mode === 'saved' ? (
            <div className="mx-auto mb-3 flex w-full max-w-[26rem] flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              <span>Showing the copy saved on this device. It may be out of date.</span>
              <button
                type="button"
                onClick={handleRetry}
                className="font-semibold underline underline-offset-2"
              >
                Use live card
              </button>
            </div>
          ) : null}

          {card ? <DigitalIDCard card={card} /> : null}
        </>
      ) : null}

      {mode === 'ready' || mode === 'saved' ? (
        <div className="glass-lite mx-auto mt-4 w-full max-w-[26rem] p-4">
          <h2 className="text-sm font-semibold text-slate-100">This device</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Saving keeps your name, card number and emergency contact in this browser. It is never
            stored in the Service Worker cache or in local storage. Only save on a device you
            control, and remove the copy when you are finished.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={KIOSK || busy || savedAvailable}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {savedAvailable ? 'Saved on this device' : 'Save to this device'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={KIOSK || busy || !savedAvailable}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove from this device
            </button>
          </div>

          {KIOSK ? (
            <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-slate-300">
              Saving is turned off on this kiosk. Open your card on your own phone to keep a copy.
            </p>
          ) : null}

          <Feedback feedback={feedback} />
        </div>
      ) : null}
    </section>
  );
}
