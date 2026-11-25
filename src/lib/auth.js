/**
 * BEST System - authentication, session and RBAC core (WP-06).
 *
 * Plan references:
 *   Sec. 12.1  sessions are an encrypted JWE (A256GCM through `jose`);
 *               passwords are bcrypt with cost 12.
 *   Sec. 13.x  resident identity: activation slips, lockout, resident session.
 *   Sec. 16.3  the session timeout is enforced on the SERVER.
 *   Sec. 6.5   the 6-role RBAC matrix.
 *   Sec. 6.4   the REST endpoints served by the route handlers.
 *
 * HARD RULES ENFORCED BY THIS MODULE
 *   - SERVER ONLY. It reads the server environment and the private session
 *     key, so it must never be imported by a client component.
 *   - The session cookie is an encrypted JWE that carries { sub, role, iat, last }.
 *     `iat` (issued at) and `last` (last activity) are both timestamps in
 *     MILLISECONDS, because that is the unit the plan's own arithmetic needs:
 *     `now - last > SESSION_IDLE_MS` and `now > iat + 8 h` compare `now` with
 *     `SESSION_IDLE_MS` (milliseconds) and with 8 hours (milliseconds), so
 *     `now`, `iat` and `last` must share the same unit. `iat < user.
 *     session_valid_after` is then a plain millisecond comparison.
 *   - The environment is read LAZILY, at call time, so `next build` works on a
 *     machine that has no .env file (the key is never baked into the bundle).
 *   - No IP address is ever read, stored or logged (Sec. 13.3 step 4 and
 *     invariant 11). The lockout counters live on the account row only.
 *   - No PII is logged and no unmasked resident name leaves this module
 *     (NFR-01 / invariant 3): names are masked to `J*** D**`.
 *   - `resident_id` is never accepted in a request body (invariant 10 / AUTH-01).
 *   - `ADMIN` is NOT a blanket superuser. The RBAC matrix is applied exactly as
 *     the Sec. 6.5 columns say, including the cells that say no.
 */

import { createHash, randomInt } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { EncryptJWT, jwtDecrypt } from 'jose';

import { prisma } from './db.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Staff session cookie name. */
export const STAFF_COOKIE_NAME = 'best_session';
/** Resident session cookie name. */
export const RESIDENT_COOKIE_NAME = 'best_res';

/** Session kinds. */
export const SESSION_KIND_STAFF = 'staff';
export const SESSION_KIND_RESIDENT = 'resident';

/** 15 minutes of inactivity end the session (NFR-06, Sec. 16.3). */
export const DEFAULT_SESSION_IDLE_MS = 15 * 60 * 1000;
/** A session never lives longer than 8 hours, whatever the activity (Sec. 16.3). */
export const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
/** bcrypt cost (Sec. 12.1). */
export const BCRYPT_COST = 12;
/** SESSION_SECRET must be at least this long. */
export const SESSION_SECRET_MIN_LENGTH = 32;

/** Staff password policy (Sec. 10.3 / Sec. 16.1). */
export const STAFF_PASSWORD_MIN_LENGTH = 12;
/** Resident password policy (Sec. 13.3 step 3). */
export const RESIDENT_PASSWORD_MIN_LENGTH = 10;

/** Activation slip: 10 Crockford base32 characters, 7 day life (Sec. 13.3). */
export const ACTIVATION_CODE_LENGTH = 10;
export const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Resident lockout (Sec. 13.3 step 4). */
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_BASE_MS = 15 * 60 * 1000;
export const LOCKOUT_MAX_MS = 24 * 60 * 60 * 1000;

/** Roles of the Sec. 6.5 matrix. */
export const RESIDENT_ROLE = 'RESIDENT';
export const BUSINESS_APPLICANT_ROLE = 'BUSINESS_APPLICANT';
export const STAFF_ROLES = Object.freeze(['ADMIN', 'STAFF', 'TREASURER', 'OFFICIAL']);

/**
 * A bcrypt (cost 12) hash of a random throw-away string. It is used only for
 * the "dummy compare" that keeps the response time of a login attempt the
 * same for an unknown, inactive or not-yet-activated account. The plaintext
 * does not exist anywhere and it is not a credential for any account.
 */
const DUMMY_PASSWORD_HASH = '$2a$12$v72v0LiHb1L7Cb79j1feUeHkZn6FfE20TLcNitKOvqRRmC6zkvKA.';

/** Crockford base32 alphabet (no I, L, O or U, so a code cannot be misread). */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Generic activation failure message: it never says which check failed. */
const GENERIC_ACTIVATION_ERROR =
  'Activation failed. Check the resident number, the activation code and the birth date, then try again.';

/** Generic credential failure message for staff and residents. */
const INVALID_CREDENTIALS_MESSAGE = 'Invalid username or password.';
const INVALID_RESIDENT_CREDENTIALS_MESSAGE = 'Invalid resident number or password.';
const LOCKED_MESSAGE = 'Too many failed attempts. This account is temporarily locked.';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * An error that carries the HTTP status the API must answer with.
 * 401 = no / invalid session, 403 = the role may not do this, 400 = a bad
 * request (for example a `resident_id` in the body).
 */
export class AuthError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} message safe, non PII message
   * @param {string} [code] stable machine readable code
   * @param {object|null} [details] extra safe details (for example retry_after_s)
   */
  constructor(status, message, code, details) {
    super(message);
    this.name = 'AuthError';
    this.status = Number.isInteger(status) ? status : 401;
    this.code = typeof code === 'string' && code !== '' ? code : 'AUTH_ERROR';
    this.details = details && typeof details === 'object' ? details : null;
  }
}

// ---------------------------------------------------------------------------
// Environment (read lazily, at call time)
// ---------------------------------------------------------------------------

/**
 * Read an environment variable as a trimmed string.
 * @param {string} name
 * @returns {string} '' when the variable is missing
 */
function envValue(name) {
  const env = typeof process !== 'undefined' && process && process.env ? process.env : {};
  const value = env[name];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * The idle timeout in milliseconds. Read on every call so a deployment can
 * change it without a rebuild.
 * @returns {number}
 */
export function sessionIdleMs() {
  const raw = envValue('SESSION_IDLE_MS');
  if (!raw) return DEFAULT_SESSION_IDLE_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SESSION_IDLE_MS;
  return parsed;
}

/**
 * The configured session secret. Required at call time, never at import time.
 * @returns {string}
 */
export function sessionSecret() {
  const secret = envValue('SESSION_SECRET');
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  if (secret.length < SESSION_SECRET_MIN_LENGTH) {
    throw new Error('SESSION_SECRET must be at least ' + SESSION_SECRET_MIN_LENGTH + ' characters');
  }
  return secret;
}

/**
 * Derive the 32 byte A256GCM key from SESSION_SECRET (SHA-256).
 * Server side only; the key never leaves the process.
 * @returns {Uint8Array} 32 bytes
 */
export function deriveSessionKey() {
  return createHash('sha256').update(sessionSecret(), 'utf8').digest();
}

/** Guard: this module must never run in a browser. */
function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new AuthError(500, 'This module is server side only.', 'SERVER_ONLY');
  }
}

/**
 * The current time in whole milliseconds. Every timestamp that is written to
 * the database is truncated the same way, so a session that is issued in the
 * same millisecond as the write is never older than it.
 * @returns {number}
 */
export function nowMs() {
  return Math.floor(Date.now());
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

/**
 * Serialize one cookie.
 * @param {string} name
 * @param {string} value
 * @param {{maxAge?:number, expires?:Date, path?:string, httpOnly?:boolean, secure?:boolean, sameSite?:string}} [options]
 * @returns {string} a Set-Cookie header value
 */
export function serializeCookie(name, value, options = {}) {
  const parts = [name + '=' + value];
  if (Number.isFinite(options.maxAge)) {
    parts.push('Max-Age=' + Math.max(0, Math.floor(options.maxAge)));
  }
  parts.push('Path=' + (options.path || '/'));
  if (options.expires instanceof Date) parts.push('Expires=' + options.expires.toUTCString());
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  parts.push('SameSite=' + (options.sameSite || 'Strict'));
  return parts.join('; ');
}

/** The cookie name of a session kind. */
export function sessionCookieName(kind) {
  return kind === SESSION_KIND_RESIDENT ? RESIDENT_COOKIE_NAME : STAFF_COOKIE_NAME;
}

/**
 * Build the Set-Cookie header for a session token.
 * @param {string} kind 'staff' | 'resident'
 * @param {string} token the encrypted JWE
 * @returns {string}
 */
export function sessionCookieHeader(kind, token) {
  const expires = new Date(Date.now() + SESSION_ABSOLUTE_MS);
  return serializeCookie(sessionCookieName(kind), token, {
    maxAge: Math.floor(SESSION_ABSOLUTE_MS / 1000),
    expires,
  });
}

/**
 * Build the Set-Cookie header that clears a session cookie.
 * @param {string} kind 'staff' | 'resident'
 * @returns {string}
 */
export function clearSessionCookie(kind) {
  return serializeCookie(sessionCookieName(kind), '', { maxAge: 0, expires: new Date(0) });
}

/**
 * Read one cookie from a request (NextRequest or a plain Request).
 * @param {Request} request
 * @param {string} name
 * @returns {string|null} the raw cookie value or null
 */
export function readCookie(request, name) {
  if (!request) return null;
  const jar = request.cookies;
  if (jar && typeof jar.get === 'function') {
    const entry = jar.get(name);
    if (!entry) return null;
    return typeof entry === 'string' ? entry : entry.value;
  }
  const header =
    request.headers && typeof request.headers.get === 'function' ? request.headers.get('cookie') : null;
  if (!header) return null;
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/**
 * Encrypt a session payload into a JWE (A256GCM, dir key agreement).
 * @param {{sub: string, role: string, iat?: number, last?: number}} payload
 * @returns {Promise<{token: string, iat: number, last: number}>}
 */
export async function createSessionToken(payload) {
  assertServerOnly();
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const role = typeof payload.role === 'string' ? payload.role : '';
  if (!sub || !role) throw new AuthError(500, 'The session payload is incomplete.', 'SESSION_BUILD_FAILED');

  const issuedAt = nowMs();
  // `iat` and `last` are milliseconds (see the header). A token that is issued
  // in the same millisecond as a session_valid_after write is NOT older than
  // that write, so it stays valid: `iat < session_valid_after` is the rule.
  const iat = Number.isFinite(payload.iat) ? Math.floor(payload.iat) : issuedAt;
  const last = Number.isFinite(payload.last) ? Math.floor(payload.last) : issuedAt;

  const token = await new EncryptJWT({ role, last })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setSubject(sub)
    .setIssuedAt(iat)
    .encrypt(deriveSessionKey());

  return { token, iat, last };
}

/**
 * Issue a fresh session and the cookie that carries it.
 * @param {string} kind 'staff' | 'resident'
 * @param {string} sub the user id or the resident id
 * @param {string} role the role stored in the cookie
 * @returns {Promise<{token: string, iat: number, last: number, cookie: string, expires_in_s: number}>}
 */
export async function issueSessionFor(kind, sub, role) {
  const issued = await createSessionToken({ sub, role });
  return {
    ...issued,
    cookie: sessionCookieHeader(kind, issued.token),
    expires_in_s: computeExpiresIn(issued.iat, sessionIdleMs(), issued.last),
  };
}

/**
 * The seconds a session still has: the smaller of the idle window measured
 * from the LAST ACTIVITY and the absolute 8 hour limit measured from iat.
 * @param {number} iat issued at, in milliseconds
 * @param {number} idleMs the idle window
 * @param {number} [last] last activity, in milliseconds (defaults to now)
 * @returns {number} seconds
 */
export function computeExpiresIn(iat, idleMs, last = Date.now()) {
  const now = Date.now();
  const lastActivity = Number.isFinite(last) ? last : now;
  const deadline = Math.min(lastActivity + idleMs, iat + SESSION_ABSOLUTE_MS);
  return Math.max(0, Math.floor((deadline - now) / 1000));
}

/**
 * Decide which cookie a request may use.
 * @param {string[]|null} allowed the roles the caller accepts
 * @returns {string[]} the session kinds to try
 */
function candidateKinds(allowed) {
  const wantsResident = allowed ? allowed.includes(RESIDENT_ROLE) : false;
  const wantsStaff = allowed ? allowed.some((role) => STAFF_ROLES.includes(role)) : false;
  if (wantsResident && !wantsStaff) return [SESSION_KIND_RESIDENT];
  if (wantsStaff && !wantsResident) return [SESSION_KIND_STAFF];
  return [SESSION_KIND_STAFF, SESSION_KIND_RESIDENT];
}

/**
 * Validate one session cookie and re-issue it with last = now.
 * @param {string} kind 'staff' | 'resident'
 * @param {string} rawToken the encrypted JWE
 * @param {string[]|null} allowed the roles the caller accepts
 * @returns {Promise<{user: object, session: object, cookie: string}>}
 */
async function validateSession(kind, rawToken, allowed, options = {}) {
  let payload;
  try {
    const result = await jwtDecrypt(rawToken, deriveSessionKey(), {
      algorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
    });
    payload = result.payload;
  } catch {
    throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_INVALID');
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const role = typeof payload.role === 'string' ? payload.role : '';
  const iat = Number.isFinite(payload.iat) ? Number(payload.iat) : null;
  const last = Number.isFinite(payload.last) ? Number(payload.last) : null;
  if (!sub || !role || iat === null || last === null) {
    throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_INVALID');
  }

  const now = Date.now();
  const idleMs = sessionIdleMs();
  if (now - last > idleMs) {
    throw new AuthError(401, 'Your session expired after 15 minutes of inactivity.', 'SESSION_IDLE_EXPIRED');
  }
  if (now > iat + SESSION_ABSOLUTE_MS) {
    throw new AuthError(401, 'Your session reached the 8 hour limit.', 'SESSION_ABSOLUTE_EXPIRED');
  }

  let user;
  let validAfter = null;

  if (kind === SESSION_KIND_STAFF) {
    const staff = await prisma.systemUser.findUnique({ where: { id: sub } });
    if (!staff) throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_INVALID');
    if (!staff.is_active) {
      throw new AuthError(401, 'Your session is invalid or has expired.', 'USER_INACTIVE');
    }
    validAfter = staff.session_valid_after;
    user = {
      id: staff.id,
      username: staff.username,
      role: staff.role,
      full_name: staff.full_name,
      must_change_password: staff.must_change_password,
    };
  } else {
    // Explicit select: session validation needs identity fields only, never
    // the V5 encrypted columns. Reading the whole row would let one damaged
    // encrypted value throw before this request could reach the per-field
    // fallback its own handler applies (a bad field must not 500 a session).
    const resident = await prisma.resident.findUnique({
      where: { id: sub },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        credential: {
          select: { activated_at: true, is_active: true, must_change_password: true, session_valid_after: true },
        },
      },
    });
    if (!resident || !resident.credential) {
      throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_INVALID');
    }
    if (!resident.credential.activated_at || !resident.credential.is_active) {
      throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_NOT_ACTIVATED');
    }
    validAfter = resident.credential.session_valid_after;
    user = {
      id: resident.id,
      role: RESIDENT_ROLE,
      masked_name: maskName(resident.first_name, resident.last_name),
      must_change_password: resident.credential.must_change_password,
    };
  }

  if (validAfter && iat < validAfter.getTime()) {
    throw new AuthError(401, 'Your session is invalid or has expired.', 'SESSION_REVOKED');
  }

  if (allowed && !allowed.includes(user.role)) {
    throw new AuthError(403, 'Your role may not use this endpoint.', 'ROLE_FORBIDDEN');
  }
  if (user.must_change_password && options.allowMustChangePassword !== true) {
    throw new AuthError(403, 'Change your password before using the system.', 'PASSWORD_CHANGE_REQUIRED');
  }

  // Slide the window: the original iat is preserved, last becomes now.
  const reissued = await createSessionToken({ sub: user.id, role: user.role, iat, last: now });
  const session = {
    sub: user.id,
    role: user.role,
    kind,
    iat,
    last: now,
    expires_in_s: computeExpiresIn(iat, idleMs, now),
  };
  return { user, session, cookie: sessionCookieHeader(kind, reissued.token) };
}

/**
 * Require a valid session (Sec. 16.3).
 *
 * The request is rejected when the cookie is missing or cannot be decrypted,
 * when the idle window is over, when the absolute 8 hour limit is over, when
 * the cookie was issued before `session_valid_after`, when the account is
 * inactive, or when a temporary password still requires a change. Residents
 * also need an activated credential.
 *
 * @param {Request} request
 * @param {string[]} [roles] the accepted roles; omit to accept staff or resident
 * @returns {Promise<{user: object, session: object, cookie: string}>}
 */
export async function requireSession(request, roles, options = {}) {
  assertServerOnly();
  const allowed = Array.isArray(roles)
    ? roles.map((role) => String(role).toUpperCase()).filter((role) => role !== '')
    : null;

  let firstError = null;
  for (const kind of candidateKinds(allowed)) {
    const raw = readCookie(request, sessionCookieName(kind));
    if (!raw) continue;
    try {
      return await validateSession(kind, raw, allowed, options);
    } catch (error) {
      if (!firstError) firstError = error;
    }
  }
  if (firstError) throw firstError;
  throw new AuthError(401, 'Authentication required.', 'SESSION_MISSING');
}

// ---------------------------------------------------------------------------
// RBAC - the Sec. 6.5 matrix, applied cell by cell
// ---------------------------------------------------------------------------

/** Permission keys of the Sec. 6.5 matrix. */
export const PERMISSIONS = Object.freeze({
  APPLY_CLEARANCE: 'apply_clearance',
  APPLY_INDIGENCY: 'apply_indigency',
  TRACK_DOCUMENT: 'track_document',
  FILE_BLOTTER: 'file_blotter',
  TRACK_BLOTTER: 'track_blotter',
  VIEW_OWN_ID_CARD: 'view_own_id_card',
  MANAGE_ID_CARDS: 'manage_id_cards',
  ISSUE_ACTIVATION_SLIP: 'issue_activation_slip',
  ASSISTED_INTAKE: 'assisted_intake',
  AI_CHAT: 'ai_chat',
  SCHEDULE_BIZ_SCREENING: 'schedule_biz_screening',
  DOCUMENT_REVIEW_APPROVAL: 'document_review_approval',
  GENERATE_PRINT_CERTIFICATIONS: 'generate_print_certifications',
  RECORD_FEE_SETTLEMENT: 'record_fee_settlement',
  ASSESS_BUSINESS_INCOME: 'assess_business_income',
  UPDATE_BLOTTER_STATUS: 'update_blotter_status',
  PUBLISH_BROADCASTS: 'publish_broadcasts',
  MANAGE_DIRECTORY: 'manage_directory',
  USER_ACCOUNTS_AUDIT: 'user_accounts_audit',
});

const EVERY_ROLE = Object.freeze([
  RESIDENT_ROLE,
  BUSINESS_APPLICANT_ROLE,
  'STAFF',
  'TREASURER',
  'OFFICIAL',
  'ADMIN',
]);

/**
 * The Sec. 6.5 matrix. ADMIN (IT Administrator) is NOT a blanket superuser:
 * the cells that the plan marks with a cross stay a cross.
 */
const RBAC_MATRIX = Object.freeze({
  [PERMISSIONS.APPLY_CLEARANCE]: EVERY_ROLE,
  [PERMISSIONS.APPLY_INDIGENCY]: EVERY_ROLE,
  [PERMISSIONS.TRACK_DOCUMENT]: EVERY_ROLE,
  [PERMISSIONS.FILE_BLOTTER]: EVERY_ROLE,
  [PERMISSIONS.TRACK_BLOTTER]: EVERY_ROLE,
  [PERMISSIONS.VIEW_OWN_ID_CARD]: [RESIDENT_ROLE, BUSINESS_APPLICANT_ROLE],
  [PERMISSIONS.MANAGE_ID_CARDS]: ['STAFF', 'ADMIN'],
  [PERMISSIONS.ISSUE_ACTIVATION_SLIP]: ['STAFF', 'ADMIN'],
  [PERMISSIONS.ASSISTED_INTAKE]: ['STAFF', 'ADMIN'],
  [PERMISSIONS.AI_CHAT]: EVERY_ROLE,
  [PERMISSIONS.SCHEDULE_BIZ_SCREENING]: [
    BUSINESS_APPLICANT_ROLE,
    'STAFF',
    'TREASURER',
  ],
  [PERMISSIONS.DOCUMENT_REVIEW_APPROVAL]: ['STAFF', 'ADMIN'],
  [PERMISSIONS.GENERATE_PRINT_CERTIFICATIONS]: ['STAFF', 'ADMIN'],
  [PERMISSIONS.RECORD_FEE_SETTLEMENT]: ['TREASURER', 'ADMIN'],
  [PERMISSIONS.ASSESS_BUSINESS_INCOME]: ['TREASURER', 'ADMIN'],
  [PERMISSIONS.UPDATE_BLOTTER_STATUS]: ['STAFF', 'ADMIN'],
  [PERMISSIONS.PUBLISH_BROADCASTS]: ['STAFF', 'OFFICIAL', 'ADMIN'],
  [PERMISSIONS.MANAGE_DIRECTORY]: ['OFFICIAL', 'ADMIN'],
  [PERMISSIONS.USER_ACCOUNTS_AUDIT]: ['ADMIN'],
});

/**
 * May this role do this?
 * @param {string} role
 * @param {string} permission one of PERMISSIONS
 * @returns {boolean}
 */
export function can(role, permission) {
  if (typeof role !== 'string' || typeof permission !== 'string') return false;
  const allowed = RBAC_MATRIX[permission];
  if (!allowed) return false;
  return allowed.includes(role.toUpperCase());
}

/**
 * Guard a role.
 * @param {string} role
 * @param {string[]} allowedRoles
 * @returns {string} the role, when it is allowed
 * @throws {AuthError} 403
 */
export function requireRole(role, allowedRoles) {
  const list = Array.isArray(allowedRoles)
    ? allowedRoles.map((entry) => String(entry).toUpperCase())
    : [String(allowedRoles || '').toUpperCase()];
  if (typeof role !== 'string' || !list.includes(role.toUpperCase())) {
    throw new AuthError(403, 'Your role may not use this endpoint.', 'ROLE_FORBIDDEN');
  }
  return role;
}

/**
 * Guard a permission of the Sec. 6.5 matrix.
 * @param {string} role
 * @param {string} permission one of PERMISSIONS
 * @returns {boolean} true when the role may do it
 * @throws {AuthError} 403
 */
export function requirePermission(role, permission) {
  if (!can(role, permission)) {
    throw new AuthError(403, 'Your role may not use this endpoint.', 'PERMISSION_FORBIDDEN');
  }
  return true;
}

// ---------------------------------------------------------------------------
// Request body guards
// ---------------------------------------------------------------------------

/**
 * A request body must never carry a resident_id (invariant 10 / AUTH-01).
 * The resident is always taken from the verified session.
 * @param {unknown} body the parsed request body
 * @throws {AuthError} 400
 */
export function assertNoResidentId(body) {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'resident_id')) {
    throw new AuthError(
      400,
      'This endpoint does not accept a resident_id. The resident is taken from the session.',
      'RESIDENT_ID_NOT_ALLOWED',
    );
  }
}

/**
 * Read a JSON request body. An unreadable or non object body becomes {}.
 * @param {Request} request
 * @returns {Promise<object>}
 */
export async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/** Headers that keep an auth answer out of every cache. */
export function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
  };
}

/**
 * Build a JSON answer. Every auth answer is `no-store`.
 * @param {unknown} body
 * @param {{status?: number, cookie?: string|null, headers?: Record<string,string>}} [options]
 * @returns {Response}
 */
export function jsonResponse(body, options = {}) {
  const headers = new Headers(noStoreHeaders());
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (options.headers) {
    for (const [name, value] of Object.entries(options.headers)) headers.set(name, value);
  }
  if (options.cookie) headers.append('Set-Cookie', options.cookie);
  return new Response(JSON.stringify(body), { status: options.status || 200, headers });
}

/**
 * Turn an error into a safe JSON answer. Only AuthError messages are shown;
 * anything else becomes a generic 500 so nothing leaks to the client.
 * @param {unknown} error
 * @returns {Response}
 */
export function errorResponse(error) {
  if (error instanceof AuthError) {
    const headers = {};
    if (error.details && Number.isFinite(error.details.retry_after_s)) {
      headers['Retry-After'] = String(Math.max(1, Math.floor(error.details.retry_after_s)));
    }
    return jsonResponse({ error: error.code, message: error.message }, { status: error.status, headers });
  }
  return jsonResponse(
    { error: 'SERVER_ERROR', message: 'The request could not be completed.' },
    { status: 500 },
  );
}

// ---------------------------------------------------------------------------
// Password policy
// ---------------------------------------------------------------------------

/**
 * Passwords that are refused whatever their length.
 * The four Sec. 10.2 demo seed passwords are NOT written out here: they all
 * match DENIED_PASSWORD_PATTERN, so they are refused without ever putting a
 * demo credential in this source file.
 */
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password12',
  'password123',
  'passw0rd',
  'pass1234',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'letmein',
  'welcome',
  'welcome1',
  'admin',
  'admin123',
  'administrator',
  'iloveyou',
  'monkey',
  'dragon',
  'abc123',
  'changeme',
  'default',
  'secret',
  'secret123',
  'test',
  'test123',
  'resident',
  'barangay',
  'barangay123',
  'qwertyuiop',
]);

/** Refuses the "<word>2026!" family, which covers the demo seed passwords. */
const DENIED_PASSWORD_PATTERN = /\w+2026!/i;

/**
 * Check a password against the policy.
 * @param {unknown} password
 * @param {'staff'|'resident'} [kind]
 * @returns {{ok: boolean, reason: string|null, min_length: number}}
 */
export function assessPassword(password, kind = 'staff') {
  const minLength = kind === 'resident' ? RESIDENT_PASSWORD_MIN_LENGTH : STAFF_PASSWORD_MIN_LENGTH;
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, reason: 'password_required', min_length: minLength };
  }
  if (password.length < minLength) {
    return { ok: false, reason: 'password_too_short', min_length: minLength };
  }
  if (DENIED_PASSWORD_PATTERN.test(password)) {
    return { ok: false, reason: 'password_denied', min_length: minLength };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: 'password_denied', min_length: minLength };
  }
  return { ok: true, reason: null, min_length: minLength };
}

/**
 * Check a password and throw when it does not pass.
 * @param {unknown} password
 * @param {'staff'|'resident'} [kind]
 * @returns {string} the password
 * @throws {AuthError} 400
 */
export function assertPasswordPolicy(password, kind = 'staff') {
  const result = assessPassword(password, kind);
  if (!result.ok) {
    const message =
      result.reason === 'password_too_short'
        ? 'The password must be at least ' + result.min_length + ' characters long.'
        : 'The password is too easy to guess. Choose a different one.';
    throw new AuthError(400, message, 'PASSWORD_POLICY');
  }
  return password;
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/**
 * Mask a name the way the plan shows it: `J*** D**`.
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export function maskName(firstName, lastName) {
  const first = typeof firstName === 'string' ? firstName.trim() : '';
  const last = typeof lastName === 'string' ? lastName.trim() : '';
  const parts = [];
  if (first) parts.push(first.charAt(0).toUpperCase() + '***');
  if (last) parts.push(last.charAt(0).toUpperCase() + '**');
  return parts.join(' ');
}

/**
 * The date only part of a date, as YYYY-MM-DD.
 * @param {Date|string} value
 * @returns {string|null}
 */
export function dateOnly(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Activation codes
// ---------------------------------------------------------------------------

/**
 * A random Crockford base32 string (about 50 bits for 10 characters).
 * @param {number} length
 * @returns {string}
 */
export function randomActivationCode(length = ACTIVATION_CODE_LENGTH) {
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += CROCKFORD_ALPHABET[randomInt(0, CROCKFORD_ALPHABET.length)];
  }
  return out;
}

/**
 * A random id with the format the schema documents, for example LOG-XXXX.
 * @param {string} prefix
 * @returns {string}
 */
export function randomId(prefix) {
  return prefix + '-' + randomActivationCode(10);
}

// ---------------------------------------------------------------------------
// Staff login / logout
// ---------------------------------------------------------------------------

/**
 * Verify staff credentials.
 *
 * An unknown or inactive account still pays for one bcrypt comparison, so the
 * answer time does not tell an attacker whether the account exists.
 * @param {unknown} username
 * @param {unknown} password
 * @returns {Promise<object>} the SystemUser row
 * @throws {AuthError} 400 / 401
 */
export async function authenticateStaff(username, password) {
  const name = typeof username === 'string' ? username.trim() : '';
  const secret = typeof password === 'string' ? password : '';
  if (!name || !secret) {
    throw new AuthError(400, 'Username and password are required.', 'CREDENTIALS_REQUIRED');
  }

  const user = await prisma.systemUser.findFirst({ where: { username: name } });
  if (!user || !user.is_active) {
    await bcrypt.compare(secret, DUMMY_PASSWORD_HASH);
    throw new AuthError(401, INVALID_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  const matches = await bcrypt.compare(secret, user.password_hash);
  if (!matches) {
    throw new AuthError(401, INVALID_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  await prisma.systemUser.update({ where: { id: user.id }, data: { last_login: new Date() } });
  return user;
}

/**
 * End every staff session of one account by moving session_valid_after.
 *
 * The stamp is written one millisecond ahead on purpose. The rule is
 * `iat < session_valid_after`, so a stamp written at the very millisecond in
 * which the session was issued would NOT kill it. Writing one millisecond
 * ahead makes sure that the session that is being closed - and every other
 * session that was issued up to this moment - is rejected.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function endStaffSession(userId) {
  await prisma.systemUser.update({
    where: { id: userId },
    data: { session_valid_after: new Date(nowMs() + 1) },
  });
}

// ---------------------------------------------------------------------------
// Resident activation / login / logout
// ---------------------------------------------------------------------------

/**
 * Issue a one time activation slip for a resident (Sec. 13.3 step 2).
 *
 * Only the hash of the code is stored, the code lives for 7 days, every
 * session that was issued before this moment is invalidated and the action is
 * written to the audit log. WP-14 owns the staff route that calls this.
 *
 * @param {string} residentId
 * @param {string} issuedById the staff member who checked the physical ID
 * @returns {Promise<{activation_code: string, expires_at: Date}>}
 */
export async function issueActivation(residentId, issuedById) {
  assertServerOnly();
  if (typeof residentId !== 'string' || !residentId.trim()) {
    throw new AuthError(400, 'A resident is required.', 'ACTIVATION_INPUT_INVALID');
  }
  if (typeof issuedById !== 'string' || !issuedById.trim()) {
    throw new AuthError(400, 'The issuing staff member is required.', 'ACTIVATION_INPUT_INVALID');
  }

  // Only the id is used below; the encrypted columns are not selected so a
  // damaged value elsewhere on the row cannot fail an activation.
  const resident = await prisma.resident.findUnique({
    where: { id: residentId.trim() },
    select: { id: true },
  });
  if (!resident) {
    throw new AuthError(404, 'That resident could not be found.', 'ACTIVATION_TARGET_NOT_FOUND');
  }

  const currentCredential = await prisma.residentCredential.findUnique({
    where: { resident_id: resident.id },
    select: { is_active: true },
  });
  if (currentCredential && !currentCredential.is_active) {
    throw new AuthError(403, 'An administrator must reactivate this resident account before issuing a new slip.', 'RESIDENT_ACCOUNT_INACTIVE');
  }

  const code = randomActivationCode(ACTIVATION_CODE_LENGTH);
  const activationHash = await bcrypt.hash(code, BCRYPT_COST);
  const now = new Date(nowMs());
  const expiresAt = new Date(now.getTime() + ACTIVATION_TTL_MS);

  await prisma.residentCredential.upsert({
    where: { resident_id: resident.id },
    create: {
      resident_id: resident.id,
      issued_by_id: issuedById.trim(),
      activation_hash: activationHash,
      activation_expires: expiresAt,
      session_valid_after: now,
      failed_attempts: 0,
    },
    update: {
      issued_by_id: issuedById.trim(),
      activation_hash: activationHash,
      activation_expires: expiresAt,
      activated_at: null,
      failed_attempts: 0,
      locked_until: null,
      session_valid_after: now,
    },
  });

  // No IP address is written: the audit trail keeps the staff member and the
  // action only (invariant 11).
  await prisma.auditLog.create({
    data: {
      id: randomId('LOG'),
      user_id: issuedById.trim(),
      action: 'ISSUE_ACTIVATION',
      target_entity: 'Resident',
      target_id: resident.id,
      metadata: { expires_at: expiresAt.toISOString() },
    },
  });

  return { activation_code: code, expires_at: expiresAt };
}

/**
 * Activate a resident account with the one time code (Sec. 13.3 step 3).
 *
 * Every mismatch answers with the same 400 so the endpoint never says which
 * part was wrong.
 *
 * @param {{residentNo: unknown, activationCode: unknown, birthDate: unknown, newPassword: unknown}} input
 * @returns {Promise<{resident: object, maskedName: string}>}
 * @throws {AuthError} 400
 */
export async function activateResidentAccount(input) {
  assertServerOnly();
  const residentNo = typeof input.residentNo === 'string' ? input.residentNo.trim() : '';
  const activationCode = typeof input.activationCode === 'string' ? input.activationCode.trim() : '';
  const newPassword = typeof input.newPassword === 'string' ? input.newPassword : '';
  const birthDate = typeof input.birthDate === 'string' ? input.birthDate.trim() : '';

  if (!residentNo || !activationCode || !birthDate || !newPassword) {
    throw new AuthError(400, 'Resident number, activation code, birth date and new password are required.', 'ACTIVATION_FIELDS_REQUIRED');
  }
  // The password policy does not depend on the account, so it can be checked
  // before the lookup without leaking anything.
  assertPasswordPolicy(newPassword, 'resident');

  const generic = () => new AuthError(400, GENERIC_ACTIVATION_ERROR, 'ACTIVATION_FAILED');

  // Identity fields plus the credential: no encrypted column is selected, so
  // activation still succeeds when an unrelated encrypted value is unreadable.
  const resident = await prisma.resident.findUnique({
    where: { id: residentNo },
    select: {
      id: true,
      birth_date: true,
      first_name: true,
      last_name: true,
      credential: true,
    },
  });
  const credential = resident ? resident.credential : null;
  if (!resident || !credential || !credential.is_active || !credential.activation_hash) {
    await bcrypt.compare(activationCode, DUMMY_PASSWORD_HASH);
    throw generic();
  }

  const codeMatches = await bcrypt.compare(activationCode, credential.activation_hash);
  if (!codeMatches) throw generic();

  const storedBirthDate = dateOnly(resident.birth_date);
  if (!storedBirthDate || storedBirthDate !== birthDate) throw generic();

  const now = new Date(nowMs());
  if (!credential.activation_expires || credential.activation_expires.getTime() <= now.getTime()) {
    throw generic();
  }
  if (credential.activated_at) throw generic();

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await prisma.residentCredential.update({
    where: { resident_id: resident.id },
    data: {
      password_hash: passwordHash,
      activated_at: now,
      password_changed_at: now,
      activation_hash: null,
      activation_expires: null,
      failed_attempts: 0,
      locked_until: null,
      // Every session that was issued before this moment is dead. The cookie
      // that is handed out right after this write is not: the rule is
      // `iat < session_valid_after` and the new cookie is issued now or later.
      session_valid_after: now,
    },
  });

  return { resident, maskedName: maskName(resident.first_name, resident.last_name) };
}

/**
 * Verify resident credentials (Sec. 13.3 step 4).
 *
 * The counters live on the ResidentCredential row, so no IP address is ever
 * stored. An unknown resident number, an account that was never activated and
 * a wrong password all answer with the same 401 and the same work.
 *
 * @param {unknown} residentNo
 * @param {unknown} password
 * @returns {Promise<{resident: object, credential: object}>}
 * @throws {AuthError} 400 / 401 / 429
 */
export async function authenticateResident(residentNo, password) {
  assertServerOnly();
  const number = typeof residentNo === 'string' ? residentNo.trim() : '';
  const secret = typeof password === 'string' ? password : '';
  if (!number || !secret) {
    throw new AuthError(400, 'Resident number and password are required.', 'CREDENTIALS_REQUIRED');
  }

  const credential = await prisma.residentCredential.findUnique({
    where: { resident_id: number },
    include: { resident: true },
  });
  if (!credential || !credential.is_active || !credential.password_hash || !credential.activated_at || !credential.resident) {
    await bcrypt.compare(secret, DUMMY_PASSWORD_HASH);
    throw new AuthError(401, INVALID_RESIDENT_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  const now = new Date(nowMs());
  const nowValue = now.getTime();

  if (credential.locked_until && credential.locked_until.getTime() > nowValue) {
    // The account is locked. The password is still compared so that the
    // answer time does not change while the lock is running.
    const matches = await bcrypt.compare(secret, credential.password_hash);
    if (!matches) {
      await prisma.residentCredential.update({
        where: { resident_id: credential.resident_id },
        data: { failed_attempts: { increment: 1 } },
      });
    }
    const retryAfter = Math.max(1, Math.ceil((credential.locked_until.getTime() - nowValue) / 1000));
    throw new AuthError(429, LOCKED_MESSAGE, 'ACCOUNT_LOCKED', { retry_after_s: retryAfter });
  }

  const matches = await bcrypt.compare(secret, credential.password_hash);
  if (!matches) {
    const failedAttempts = credential.failed_attempts + 1;
    const lockLevel = Math.floor(failedAttempts / LOCKOUT_THRESHOLD);
    const data = { failed_attempts: failedAttempts };
    if (lockLevel >= 1) {
      const duration = Math.min(
        LOCKOUT_MAX_MS,
        LOCKOUT_BASE_MS * Math.pow(2, lockLevel - 1),
      );
      data.locked_until = new Date(nowValue + duration);
      await prisma.residentCredential.update({
        where: { resident_id: credential.resident_id },
        data,
      });
      throw new AuthError(429, LOCKED_MESSAGE, 'ACCOUNT_LOCKED', {
        retry_after_s: Math.max(1, Math.ceil(duration / 1000)),
      });
    }
    await prisma.residentCredential.update({
      where: { resident_id: credential.resident_id },
      data,
    });
    throw new AuthError(401, INVALID_RESIDENT_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  await prisma.residentCredential.update({
    where: { resident_id: credential.resident_id },
    data: { failed_attempts: 0, locked_until: null },
  });

  return { resident: credential.resident, credential };
}

/**
 * End every resident session of one account by moving session_valid_after.
 *
 * The stamp is written one millisecond ahead, exactly like the staff logout,
 * so that the session that is being closed is really rejected.
 *
 * @param {string} residentId
 * @returns {Promise<void>}
 */
export async function endResidentSession(residentId) {
  await prisma.residentCredential.update({
    where: { resident_id: residentId },
    data: { session_valid_after: new Date(nowMs() + 1) },
  });
}
