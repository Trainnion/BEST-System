/**
 * BEST System - browser proof-of-work solver (WP-10, plan Sec. 15.1).
 *
 * Uses WebCrypto only. The work is local: no network request is made while
 * searching, and the solution is just a decimal counter. The expected work
 * for difficulty 4 is 16^4 = 65,536 hashes (about 1-2 s on an entry-level
 * phone). Progress is reported in coarse batches so React can repaint.
 */

/**
 * Count leading zero hexadecimal nibbles in a digest.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function leadingZeroNibbles(bytes) {
  let nibbles = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    if (byte === 0) {
      nibbles += 2;
      continue;
    }
    if (byte < 16) nibbles += 1;
    break;
  }
  return nibbles;
}

/**
 * @typedef {(progress: {attempts: number, percent: number}) => void} ProgressFn
 */

/**
 * Find a solution such that sha256(nonce + ':' + solution) has the required
 * number of leading hexadecimal zeroes.
 *
 * @param {string} nonce the server nonce, exactly as issued
 * @param {number} difficulty leading hex zeroes required
 * @param {ProgressFn} [onProgress]
 * @returns {Promise<string>} the decimal solution
 */
export async function solveProofOfWork(nonce, difficulty, onProgress) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('WebCrypto is not available on this device.');
  }
  const target = Number.isInteger(difficulty) && difficulty >= 0 ? difficulty : 4;
  const expected = Math.pow(16, target);
  const encoder = new TextEncoder();
  const prefix = nonce + ':';
  let attempt = 0;

  for (;;) {
    const solution = String(attempt);
    const digest = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(prefix + solution),
    );
    if (leadingZeroNibbles(new Uint8Array(digest)) >= target) {
      if (typeof onProgress === 'function') onProgress({ attempts: attempt + 1, percent: 100 });
      return solution;
    }

    attempt += 1;

    if (attempt % 512 === 0) {
      if (typeof onProgress === 'function') {
        const percent = Math.min(95, Math.round((attempt / expected) * 100));
        onProgress({ attempts: attempt, percent });
      }
      // Let the browser paint the progress bar between batches.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

export default solveProofOfWork;
