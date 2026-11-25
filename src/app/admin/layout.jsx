'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '../../components/admin/AdminSidebar.jsx';
import SessionGuard from '../../components/admin/SessionGuard.jsx';
import { canAccessAdminPath } from '../../lib/admin-access.js';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  const [user, setUser] = useState(null);
  const [verifiedPathname, setVerifiedPathname] = useState('');

  useEffect(() => {
    if (isLoginPage) {
      setUser(null);
      setVerifiedPathname('');
      return;
    }
    setUser(null);
    setVerifiedPathname('');
    let active = true;

    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (active && data?.user) {
            setUser(data.user);
            setVerifiedPathname(pathname);
          }
        } else if (res.status === 401 || res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (active) {
            setUser(null);
            setVerifiedPathname('');
          }
          router.replace(data.error === 'PASSWORD_CHANGE_REQUIRED'
            ? '/password/change?type=staff&required=1'
            : '/admin/login');
        }
      } catch {
        // offline
      }
    }

    loadMe();
    window.addEventListener('best-staff-profile-updated', loadMe);
    return () => {
      active = false;
      window.removeEventListener('best-staff-profile-updated', loadMe);
    };
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <main className="admin-portal min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">{children}</main>;
  }

  const verifiedUser = verifiedPathname === pathname ? user : null;
  if (!verifiedUser) {
    return (
      <main role="status" className="admin-portal flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        Checking your account and access level…
      </main>
    );
  }

  const hasPageAccess = canAccessAdminPath(verifiedUser.role, pathname);

  return (
    <SessionGuard>
      <div className="admin-portal flex min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <AdminSidebar user={verifiedUser} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-100 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {hasPageAccess ? children : (
              <section role="alert" className="mx-auto mt-12 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-7 text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                <h1 className="text-2xl font-black tracking-tight">Outside your clearance level</h1>
                <p className="mt-3 text-sm leading-6">
                  Your account is assigned the <strong>{verifiedUser.role}</strong> role and cannot open this section. No fields or actions are available here. Contact the administrator if you believe you need access.
                </p>
                <button type="button" onClick={() => router.replace('/admin/dashboard')} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-4 py-2 text-sm font-bold text-white hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200">
                  Return to dashboard
                </button>
              </section>
            )}
          </div>
        </main>
      </div>
    </SessionGuard>
  );
}
