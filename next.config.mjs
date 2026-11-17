// BEST - Next.js configuration.
// Zero external origins (OFFLINE-01): the production CSP below is the enforcement
// layer that stops the browser from loading any CDN, remote font or remote image.
// Security headers are emitted in production only; sw.js is never cached by HTTP.

const csp = [
  "default-src 'self'",
  // Next.js inline bootstrap, the html.js class script and React style injection.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Gemini (optional, hybrid mode) is only ever called server-side.
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is only for the Docker image (Sec. 6.2).
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  // No remote image hosts. Every photo_url is a same-origin /avatars/ path.
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    const entries = [];
    // The global security headers are production-only; an empty-headers rule
    // crashes the Next.js dev server ("Invalid header found"), so we skip the
    // catch-all entirely in development (OFFLINE-01, PERF-01).
    if (process.env.NODE_ENV === 'production') {
      entries.push({ source: '/(.*)', headers: securityHeaders });
    }
    // Service Worker must always be revalidated (no HTTP cache) so a deploy
    // is picked up without manual cache invalidation.
    entries.push(
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/precache-manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }],
      },
    );
    return entries;
  },
};

export default nextConfig;
