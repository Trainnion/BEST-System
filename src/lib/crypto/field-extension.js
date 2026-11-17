/**
 * BEST System - WP-03 - Prisma client extension for V5 field encryption.
 *
 * Wraps every model operation and, for the columns in ENCRYPTED_COLUMNS
 * (Sec. 12.5):
 *
 * - encrypts on write: create / createMany / createManyAndReturn / update /
 *   updateMany / updateManyAndReturn / upsert (args.create and args.update),
 *   including the `{ set: value }` form of a scalar update;
 * - decrypts on read: findUnique(OrThrow) / findFirst(OrThrow) / findMany and
 *   on the rows returned by single-row writes (create/update/delete/upsert);
 * - only top-level rows: nested relation payloads are left untouched;
 * - null/undefined values are left alone, and a value that is already
 *   ciphertext-shaped is never encrypted twice;
 * - fail closed: on read, a non-null value that is not a
 *   `v1.<kid>.<iv>.<ct>.<tag>` ciphertext throws CryptoError instead of
 *   silently returning plaintext;
 * - never touches rows of models without encrypted columns, and never logs
 *   plaintext or key material.
 *
 * The query component also applies to operations issued on the interactive
 * transaction client inside `prisma.$transaction(async (tx) => ...)`.
 *
 * Raw SQL ($queryRaw/$executeRaw) is deliberately NOT covered: application
 * code must use the model API for these columns.
 */

import { CryptoError, CRYPTO_ERROR_CODES } from './errors.js';
import {
  ENCRYPTED_COLUMNS,
  decryptField,
  encryptField,
  isFieldCiphertext,
} from './field.js';

/** Operations whose args contain writable row data. */
const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
]);

/** Operations that resolve to one row object or null. */
const ROW_RESULT_OPERATIONS = new Set([
  'create',
  'update',
  'delete',
  'upsert',
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
]);

/** Operations that resolve to an array of row objects. */
const ROW_ARRAY_RESULT_OPERATIONS = new Set([
  'findMany',
  'createManyAndReturn',
  'updateManyAndReturn',
]);

/**
 * Encrypt one field value. null/undefined and non-string scalars pass
 * through untouched. A scalar update operation (`{ set: '...' }`) is
 * encrypted inside its `set` value. A value that is already ciphertext-shaped
 * is left as it is, so callers cannot double-encrypt by accident.
 * @param {unknown} value
 * @param {string} context
 * @returns {unknown}
 */
function encryptValue(value, context) {
  if (typeof value === 'string') {
    return isFieldCiphertext(value) ? value : encryptField(value, context);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (typeof value.set === 'string') {
      return {
        ...value,
        set: isFieldCiphertext(value.set) ? value.set : encryptField(value.set, context),
      };
    }
  }
  return value;
}

/**
 * Encrypt the encrypted columns of one row payload in place. A value that is
 * already ciphertext-shaped is left as it is (no double encryption).
 * @param {string} model Prisma model name, e.g. `Resident`
 * @param {object|undefined} data row payload (mutated in place)
 * @returns {object|undefined}
 */
function encryptRowData(model, data) {
  if (!data || typeof data !== 'object') return data;
  const columns = ENCRYPTED_COLUMNS[model];
  for (const column of columns) {
    if (!Object.prototype.hasOwnProperty.call(data, column)) continue;
    data[column] = encryptValue(data[column], model + '.' + column);
  }
  return data;
}

/**
 * Decrypt the encrypted columns of one result row in place. null/undefined
 * values are left alone; anything else that is not ciphertext-shaped fails
 * closed with CryptoError.
 * @param {string} model Prisma model name
 * @param {object} row result row (mutated in place)
 * @returns {object}
 */
function decryptRow(model, row) {
  if (!row || typeof row !== 'object') return row;
  const columns = ENCRYPTED_COLUMNS[model];
  for (const column of columns) {
    if (!Object.prototype.hasOwnProperty.call(row, column)) continue;
    const value = row[column];
    if (value === null || value === undefined) continue;
    if (typeof value !== 'string' || !isFieldCiphertext(value)) {
      throw new CryptoError(
        CRYPTO_ERROR_CODES.INVALID_FORMAT,
        'the stored value is not a v1 ciphertext',
      );
    }
    row[column] = decryptField(value, model + '.' + column);
  }
  return row;
}

/**
 * Build the `$extends(...)` argument. Usage:
 *
 *   const prisma = new PrismaClient().$extends(createFieldEncryptionExtension());
 *
 * @returns {{ query: object }}
 */
export function createFieldEncryptionExtension() {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const columns = ENCRYPTED_COLUMNS[model];
          // Models without encrypted columns pass through untouched.
          if (!columns) return query(args);

          if (WRITE_OPERATIONS.has(operation) && args && typeof args === 'object') {
            if (operation === 'upsert') {
              encryptRowData(model, args.create);
              encryptRowData(model, args.update);
            } else if (Array.isArray(args.data)) {
              args.data = args.data.map((row) => encryptRowData(model, row));
            } else {
              encryptRowData(model, args.data);
            }
          }

          const result = await query(args);

          if (ROW_RESULT_OPERATIONS.has(operation)) {
            return decryptRow(model, result);
          }
          if (ROW_ARRAY_RESULT_OPERATIONS.has(operation) && Array.isArray(result)) {
            for (const row of result) decryptRow(model, row);
            return result;
          }
          return result;
        },
      },
    },
  };
}

export default createFieldEncryptionExtension;
