import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/jetbrains-mono';
import '@/styles/globals.css';
import '@/styles/motion.css';

import AmbientOrbs from '@/components/home/AmbientOrbs';
import SiteFooter from '@/components/shell/SiteFooter';
import SiteHeader from '@/components/shell/SiteHeader';
import OfflineBanner from '@/components/system/OfflineBanner';
import ServiceWorkerRegistrar from '@/components/system/ServiceWorkerRegistrar';

// Tiny inline bootstrap (CSP allows 'unsafe-inline' for scripts, Sec. 6.2).
// It marks that JS ran so animation "before" states can safely apply (MOTION-01),
// and applies a stored/URL motion choice before first paint to avoid a flash.
// Silent on failure: no-JS visitors and blocked storage still get a readable page.
const bootstrapScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var f=localStorage.getItem('best:fx');var q=new URLSearchParams(location.search).get('fx');var v=(q==='lite'||q==='full')?q:((f==='lite'||f==='full')?f:null);if(v){d.setAttribute('data-fx',v);d.setAttribute('data-motion',v);}else if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-motion','lite');}}catch(e){}})();`;

export const metadata = {
  title: {
    default: 'BEST - Barangay E-Services System Terminal',
    template: '%s | BEST',
  },
  description:
    'Offline-first barangay e-services terminal: document requests, public tracking, announcements, directory and resident services on the barangay LAN.',
  applicationName: 'BEST',
  authors: [{ name: 'Barangay E-Services System Terminal' }],
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, address: false, email: false },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#0a0f1d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-PH" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      </head>
      <body className="relative min-h-dvh bg-obsidian font-sans text-slate-200 antialiased">
        <a className="skip-link" href="#main">
          Skip to main content
        </a>

        <SiteHeader />
        <OfflineBanner />
        <ServiceWorkerRegistrar />

        {/* L0 ambient background: decorative radial gradients, never remote images.
            Drift is Full-tier only and is removed entirely in motion-lite/print. */}
        <AmbientOrbs />

        {children}

        <SiteFooter />
      </body>
    </html>
  );
}
