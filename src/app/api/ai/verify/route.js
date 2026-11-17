/**
 * BEST - POST & GET /api/ai/verify (WP-09, plan Sec. 6.4).
 *
 * RETIRED IN V4: verification of a purpose statement now runs in the staff
 * browser on decrypted text (plan Sec. 12.6). Every method answers
 * 410 Gone with the same fixed body. No session, no body parsing, no
 * storage, no logging.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GONE_BODY = JSON.stringify({
  error: 'GONE',
  message: 'Retired in V4: verification runs in the staff browser.',
});

function gone() {
  return new Response(GONE_BODY, {
    status: 410,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

export async function POST() {
  return gone();
}

export async function GET() {
  return gone();
}
