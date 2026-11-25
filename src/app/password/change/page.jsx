import PasswordChangeForm from '../../../components/auth/PasswordChangeForm.jsx';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Change Password',
};

export default function PasswordChangePage({ searchParams }) {
  const mode = searchParams?.type === 'resident' ? 'resident' : 'staff';
  const forced = searchParams?.required === '1';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-xl space-y-5">
        <header>
          <p className="text-sm font-bold text-sky-700 dark:text-cyan-300">BEST account security</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Password settings</h1>
        </header>
        <PasswordChangeForm mode={mode} forced={forced} />
      </div>
    </main>
  );
}
