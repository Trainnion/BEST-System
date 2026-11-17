import UnifiedLoginForm from '@/components/auth/UnifiedLoginForm.jsx';

export const metadata = {
  title: 'Staff & Official Sign In',
  description: 'Authorized personnel and officials management terminal sign-in.',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 transition-colors">
      <UnifiedLoginForm initialRole="staff" />
    </div>
  );
}
