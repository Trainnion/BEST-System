import UnifiedLoginForm from '@/components/auth/UnifiedLoginForm.jsx';

export const metadata = {
  title: 'Portal Sign In',
  description:
    'Sign in to Barangay Daro e-services terminal. One unified portal for verified residents, officials, and barangay staff.',
};

export default function LoginPage() {
  return (
    <main id="main" className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <UnifiedLoginForm initialRole="resident" />
    </main>
  );
}
