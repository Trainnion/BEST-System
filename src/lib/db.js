// Prisma Client singleton with the V5 field-encryption extension
// (plan Sec. 10.1 / Sec. 6.3 / Sec. 12.4). Pure JavaScript ESM. The
// globalThis pattern keeps Next.js hot reload from creating a new client
// (and a new connection pool) on every reload.
//
// Importing this module validates FIELD_ENC_KEY at module load and throws
// (CryptoError) when it is missing or malformed, so a badly configured
// server refuses to start. The extension transparently encrypts the columns
// in ENCRYPTED_COLUMNS on write and decrypts them on read.
//
// No PII logging and no query logging of bound values: at most error-level
// logging in development, nothing otherwise. No connection is made at module
// import time - Prisma connects lazily on the first query.

import { PrismaClient } from '@prisma/client';
import { assertFieldCryptoConfig } from './crypto/field.js';
import { createFieldEncryptionExtension } from './crypto/field-extension.js';

assertFieldCryptoConfig();

const globalForPrisma = globalThis;

function createPrismaClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            {
              emit: 'stdout',
              level: 'error',
            },
          ]
        : [],
  });
  return client.$extends(createFieldEncryptionExtension());
}

export const prisma = globalForPrisma.__bestPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__bestPrisma = prisma;
}

export default prisma;
