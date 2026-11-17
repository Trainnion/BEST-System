/**
 * BEST - /services/kaagapay page (WP-09, route tree Sec. 1.2).
 *
 * Statically rendered shell: the page is prerendered at build time and the
 * conversation happens client-side over POST /api/ai/chat (see
 * KaagapayChat.jsx). Route segment config lives here, in the server
 * component; it cannot be exported from the client chat component itself.
 */

import KaagapayChat from '@/components/system/KaagapayChat.jsx';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Kaagapay Concierge',
  description:
    'Ask civic questions in English, Tagalog or Bisaya: clearance requirements, fees, steps and office hours from the local knowledge base.',
};

export default function KaagapayPage() {
  return <KaagapayChat />;
}
