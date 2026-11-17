'use client';

/**
 * Opt-in "Save to this device" storage (plan Sec. 17.2, Sec. 7.4).
 *
 * Only the small card view model returned by GET /api/resident/id-card is
 * written, and only after an explicit tap. IndexedDB is used on purpose:
 *   - no Web Storage (synchronous, string-only and easy to leak);
 *   - no Service Worker cache (authenticated data must never live there);
 *   - one record, key `self`, database `best-id-card`, store `card`.
 *
 * Nothing here runs at import time, so the module is safe during rendering.
 */

const DB_NAME = 'best-id-card';
const DB_VERSION = 1;
const STORE_NAME = 'card';
const RECORD_KEY = 'self';

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available on this device.'));
      return;
    }

    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB could not be opened.'));
  });
}

/**
 * Run one operation and close the connection afterwards.
 * @template T
 * @param {'readonly'|'readwrite'} mode
 * @param {(store: IDBObjectStore) => IDBRequest<T>} operation
 * @returns {Promise<T>}
 */
async function run(mode, operation) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      let result;
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () =>
        reject(request.error || new Error('The device storage request failed.'));
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () =>
        reject(transaction.error || new Error('The device storage transaction was aborted.'));
    });
  } finally {
    db.close();
  }
}

/**
 * Persist the minimal card view model. Explicit user action only.
 * @param {object} card
 * @returns {Promise<void>}
 */
export async function saveCardToDevice(card) {
  if (!card || typeof card !== 'object') throw new Error('There is no card to save.');
  await run('readwrite', (store) =>
    store.put({ card, saved_at: new Date().toISOString() }, RECORD_KEY),
  );
}

/**
 * Read the saved card. The viewer only calls this after the live API fails and
 * the resident chooses "View saved copy", never automatically over fresh data.
 * @returns {Promise<object|null>}
 */
export async function readSavedCard() {
  const entry = await run('readonly', (store) => store.get(RECORD_KEY));
  if (!entry || typeof entry !== 'object') return null;
  const card = entry.card;
  if (!card || typeof card !== 'object') return null;
  return card;
}

/**
 * @returns {Promise<boolean>} true when a saved record exists
 */
export async function hasSavedCard() {
  const count = await run('readonly', (store) => store.count());
  return count > 0;
}

/**
 * Delete the saved card. @returns {Promise<void>}
 */
export async function removeSavedCard() {
  await run('readwrite', (store) => store.delete(RECORD_KEY));
}
