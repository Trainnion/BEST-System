// Verified resident sign-in (plan Sec. 1.2 route tree, Sec. 13.3 step 4).
// One unified login platform for all account types.

import UnifiedLoginForm from '@/components/auth/UnifiedLoginForm.jsx';

export const metadata = {
  title: 'Resident Sign In',
  description:
    'Sign in with your resident number and password to file clearance or indigency requests. Accounts are activated with a slip issued at the barangay hall.',
};

export default function ResidentLoginPage() {
  return (
    <main id="main" className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <UnifiedLoginForm initialRole="resident" />
    </main>
  );
}
