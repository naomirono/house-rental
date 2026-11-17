'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Badge, Table, Td, Empty, PageTitle, inputCls, btnCls, btn2Cls, kes } from '@/components/ui';
import { supabase, api } from '@/lib/supabase';

const today = new Date().toISOString().slice(0, 10);
const blank = { tenant_id: '', kind: 'water', period: today.slice(0, 7), amount: '', due_date: today };

export default function Bills() {
  const [tenants, setTenants] = useState([]);
  const [charges, setCharges] = useState([]);
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [t, c] = await Promise.all([
      supabase.from('tenants').select('id,name,units(name)').eq('active', true),
      supabase.from('charges').select('*, tenants(name, units(name))').order('due_date', { ascending: false }).limit(100),
    ]);
    setTenants(t.data || []); setCharges(c.data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await api('/api/admin/charge', { ...f, amount: Number(f.amount) }); setMsg('Bill added and invoice sent'); setF({ ...blank, kind: f.kind }); load(); }
    catch (err) { setMsg(err.message); }
    setBusy(false);
  };
  const run = async (job) => {
    setBusy(true); setMsg('');
    try { setMsg((await api('/api/admin/run', { job })).message); load(); }
    catch (err) { setMsg(err.message); }
    setBusy(false);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Shell role="admin">
      <PageTitle>Bills</PageTitle>
      <Card title="Monthly actions" className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className={btnCls} disabled={busy} onClick={() => run('invoices')}>Send this month&apos;s rent invoices</button>
          <button className={btn2Cls} disabled={busy} onClick={() => run('reminders')}>Send reminders now</button>
          <button className={btn2Cls} disabled={busy} onClick={() => run('register')}>Register Paybill URLs</button>
        </div>
        <p className="mt-3 text-sm text-slate-500">Invoices go out automatically on the 1st and reminders daily. Use these buttons to run them early.</p>
      </Card>
      <Card title="Add a bill (water or extra rent)" className="mb-6">
        <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <select className={`${inputCls} xl:col-span-2`} value={f.tenant_id} onChange={set('tenant_id')} required>
            <option value="">Choose tenant</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.units?.name} - {t.name}</option>)}
          </select>
          <select className={inputCls} value={f.kind} onChange={set('kind')}>
            <option value="water">Water</option><option value="rent">Rent</option>
          </select>
          <input type="month" className={inputCls} value={f.period} onChange={set('period')} required />
          <input type="number" min="1" className={inputCls} placeholder="Amount (KES)" value={f.amount} onChange={set('amount')} required />
          <input type="date" className={inputCls} value={f.due_date} onChange={set('due_date')} required />
          <button className={`${btnCls} sm:col-span-2 xl:col-span-6 xl:w-fit`} disabled={busy}>Add bill and send invoice</button>
        </form>
      </Card>
      {msg && <p className="mb-4 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200">{msg}</p>}
      <Card title="Recent bills">
        {charges.length === 0 ? <Empty>No bills yet.</Empty> : (
          <Table head={['Unit', 'Tenant', 'Type', 'Month', 'Amount', 'Paid', 'Due', 'Status']}>
            {charges.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.tenants?.units?.name}</Td>
                <Td>{c.tenants?.name}</Td>
                <Td className="capitalize">{c.kind}</Td>
                <Td>{c.period}</Td>
                <Td>{kes(c.amount)}</Td>
                <Td>{kes(c.paid_amount)}</Td>
                <Td>{c.due_date}</Td>
                <Td><Badge paid={c.status === 'paid'} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Shell>
  );
}
