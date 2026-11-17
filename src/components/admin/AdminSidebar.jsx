'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  ShieldAlert,
  CreditCard,
  Users,
  Radio,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import useTheme from '@/lib/hooks/useTheme';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/documents', label: 'Document Queue', icon: FileText },
  { href: '/admin/blotter', label: 'Anonymous Blotter', icon: ShieldAlert },
  { href: '/admin/treasury', label: 'Treasury & ORs', icon: CreditCard },
  { href: '/admin/residents', label: 'Residents & Slips', icon: Users },
  { href: '/admin/broadcasts', label: 'Broadcasts', icon: Radio },
  { href: '/admin/directory', label: 'Officials Directory', icon: BookOpen },
];

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme, mounted } = useTheme();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    router.push('/admin/login');
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col min-h-screen border-r border-slate-200 bg-white text-slate-800 transition-colors dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200">
      <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-sky-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              BEST Admin
            </div>
            <div className="text-xs text-sky-700 dark:text-cyan-400 font-mono tracking-wider uppercase font-semibold">
              {user?.role || 'Staff Portal'}
            </div>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={mounted ? (isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme') : 'Toggle Theme'}
          title={mounted ? (isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme') : 'Toggle Theme'}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {mounted ? (
            isDark ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-slate-700" />
            )
          ) : (
            <span className="h-3 w-3 rounded-full border border-dashed border-slate-400" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-semibold transition-all ${
                isActive
                  ? 'bg-sky-100 text-sky-900 font-bold border border-sky-300 shadow-sm dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-3">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 dark:bg-white/5 dark:border-white/5 dark:text-slate-200">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Signed in as</div>
            <div className="text-base font-bold text-slate-900 dark:text-white truncate">{user.username}</div>
            <div className="text-xs text-sky-700 dark:text-cyan-400 font-mono mt-0.5 font-bold">{user.role}</div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition dark:text-rose-300 dark:hover:text-rose-200 dark:hover:bg-rose-500/10 dark:border-rose-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
