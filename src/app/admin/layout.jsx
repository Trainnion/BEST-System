'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '../../components/admin/AdminSidebar.jsx';
import SessionGuard from '../../components/admin/SessionGuard.jsx';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isLoginPage) return;
    let active = true;

    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (active && data?.user) {
            setUser(data.user);
          }
        }
      } catch {
        // offline
      }
    }

    loadMe();
    return () => {
      active = false;
    };
  }, [isLoginPage]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">{children}</main>;
  }

  return (
    <SessionGuard>
      <div className="flex min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <AdminSidebar user={user} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-100 dark:bg-gradient-to-b dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </SessionGuard>
  );
}
