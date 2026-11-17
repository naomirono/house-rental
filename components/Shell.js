'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = {
  admin: [['/admin', 'Dashboard'], ['/admin/tenants', 'Tenants'], ['/admin/bills', 'Bills'], ['/admin/payments', 'Payments']],
  tenant: [['/portal', 'Balance & bills'], ['/portal/payments', 'Payments']],
};

export default function Shell({ role, children }) {
  const router = useRouter();
  const path = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login');
      const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      const mine = p?.role === 'admin' ? 'admin' : 'tenant';
      if (mine !== role) return router.replace(mine === 'admin' ? '/admin' : '/portal');
      setOk(true);
    })();
  }, []);

  const out = async () => { await supabase.auth.signOut(); router.replace('/login'); };

  if (!ok) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  return (
    <div className="min-h-screen">
      <aside className="border-b bg-white lg:fixed lg:inset-y-0 lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-6 lg:py-6">
          <span className="text-lg font-bold text-emerald-700">Rental Manager</span>
          <button onClick={out} className="text-sm text-slate-500 hover:text-slate-800 lg:mt-1 lg:block">Sign out</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
          {NAV[role].map(([href, label]) => (
            <Link key={href} href={href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${path === href ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
