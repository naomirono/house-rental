'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Stat, Badge, Table, Td, Empty, PageTitle, kes } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [d, setD] = useState({ rows: [], collected: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [t, b, c, p] = await Promise.all([
        supabase.from('tenants').select('id,name,phone,units(name)').eq('active', true),
        supabase.from('tenant_balances').select('tenant_id,balance'),
        supabase.from('charges').select('tenant_id,due_date').eq('status', 'unpaid').lt('due_date', today).order('due_date'),
        supabase.from('payments').select('amount').gte('paid_at', today.slice(0, 7) + '-01'),
      ]);
      const bal = Object.fromEntries((b.data || []).map((x) => [x.tenant_id, x.balance]));
      const oldest = {};
      (c.data || []).forEach((x) => { oldest[x.tenant_id] ??= x.due_date; });
      const rows = (t.data || [])
        .map((x) => ({
          ...x,
          balance: bal[x.id] || 0,
          days: oldest[x.id] ? Math.floor((Date.now() - new Date(oldest[x.id])) / 864e5) : 0,
        }))
        .sort((a, b) => b.balance - a.balance);
      setD({ rows, collected: (p.data || []).reduce((s, x) => s + x.amount, 0) });
    })();
  }, []);

  const unpaid = d.rows.filter((r) => r.balance > 0);
  return (
    <Shell role="admin">
      <PageTitle>Dashboard</PageTitle>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tenants" value={d.rows.length} />
        <Stat label="Collected this month" value={kes(d.collected)} tone="green" />
        <Stat label="Outstanding" value={kes(unpaid.reduce((s, r) => s + r.balance, 0))} tone="red" />
        <Stat label="Tenants with unpaid bills" value={unpaid.length} tone={unpaid.length ? 'red' : 'green'} />
      </div>
      <Card title="Payment status per tenant">
        {d.rows.length === 0 ? <Empty>No tenants yet. Add your first tenant under Tenants.</Empty> : (
          <Table head={['Unit', 'Tenant', 'Phone', 'Balance', 'Overdue', 'Status']}>
            {d.rows.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.units?.name}</Td>
                <Td>{r.name}</Td>
                <Td>{r.phone}</Td>
                <Td>{r.balance < 0 ? `${kes(-r.balance)} credit` : kes(r.balance)}</Td>
                <Td className={r.days ? 'text-red-600' : 'text-slate-400'}>{r.days ? `${r.days} days` : '-'}</Td>
                <Td><Badge paid={r.balance <= 0} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Shell>
  );
}
