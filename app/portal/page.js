'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Stat, Badge, Table, Td, Empty, PageTitle, inputCls, btnCls, kes } from '@/components/ui';
import { supabase, api } from '@/lib/supabase';

export default function Portal() {
  const [s, setS] = useState(null);
  const [amt, setAmt] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('tenants').select('id,name,units(name,rent)').single();
      if (!t) return setS({ none: true });
      const [b, c] = await Promise.all([
        supabase.from('tenant_balances').select('balance').eq('tenant_id', t.id).single(),
        supabase.from('charges').select('*').eq('status', 'unpaid').order('due_date'),
      ]);
      const balance = b.data?.balance || 0;
      setS({ t, balance, charges: c.data || [] });
      setAmt(balance > 0 ? String(balance) : '');
    })();
  }, []);

  const pay = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await api('/api/pay/stk', { amount: Number(amt) }); setMsg('Check your phone and enter your M-Pesa PIN. You will get an SMS receipt.'); }
    catch (err) { setMsg(err.message); }
    setBusy(false);
  };

  if (!s) return <Shell role="tenant"><p className="text-sm text-slate-500">Loading…</p></Shell>;
  if (s.none) return <Shell role="tenant"><Empty>Your account is not linked to a unit yet. Contact your landlord.</Empty></Shell>;

  const today = new Date().toISOString().slice(0, 10);
  return (
    <Shell role="tenant">
      <PageTitle>Hello, {s.t.name.split(' ')[0]} ({s.t.units?.name})</PageTitle>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Balance" value={s.balance < 0 ? `${kes(-s.balance)} credit` : kes(s.balance)} tone={s.balance > 0 ? 'red' : 'green'} />
        <Stat label="Monthly rent" value={kes(s.t.units?.rent)} />
        <div className="flex items-center rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
          <div><p className="mb-2 text-sm text-slate-500">Status</p><Badge paid={s.balance <= 0} /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Upcoming and unpaid bills">
          {s.charges.length === 0 ? <Empty>You have no bills to pay.</Empty> : (
            <Table head={['Bill', 'Month', 'Amount left', 'Due']}>
              {s.charges.map((c) => (
                <tr key={c.id}>
                  <Td className="capitalize">{c.kind}</Td>
                  <Td>{c.period}</Td>
                  <Td>{kes(c.amount - c.paid_amount)}</Td>
                  <Td className={c.due_date < today ? 'font-medium text-red-600' : ''}>{c.due_date}{c.due_date < today && ' (overdue)'}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Pay with M-Pesa">
          <form onSubmit={pay} className="flex flex-col gap-3 sm:flex-row">
            <input type="number" min="1" className={inputCls} placeholder="Amount (KES)" value={amt} onChange={(e) => setAmt(e.target.value)} required />
            <button className={`${btnCls} sm:whitespace-nowrap`} disabled={busy}>{busy ? 'Sending…' : 'Send M-Pesa prompt'}</button>
          </form>
          {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
          <p className="mt-3 text-sm text-slate-500">Or pay at M-Pesa Paybill {process.env.NEXT_PUBLIC_PAYBILL || ''} with account number {s.t.units?.name}.</p>
        </Card>
      </div>
    </Shell>
  );
}
