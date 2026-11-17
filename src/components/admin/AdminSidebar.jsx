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
} from 'lucide-react';

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

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    router.push('/admin/login');
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col min-h-screen border-r border-white/10 bg-slate-950/70 backdrop-blur-xl text-slate-200">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
          <Shield className="w-6 h-6 text-slate-950" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            BEST Admin
          </div>
          <div className="text-xs text-cyan-400 font-mono tracking-wider uppercase">
            {user?.role || 'Staff Portal'}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {user && (
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-slate-400">Signed in as</div>
            <div className="text-sm font-semibold text-white truncate">{user.username}</div>
            <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">{user.role}</div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
