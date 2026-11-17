'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Table, Td, Empty, PageTitle, inputCls, btnCls, btn2Cls, kes } from '@/components/ui';
import { supabase, api } from '@/lib/supabase';

const blank = { name: '', phone: '', unit_id: '', password: '' };

export default function Tenants() {
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [u, t] = await Promise.all([
      supabase.from('units').select('*').order('name'),
      supabase.from('tenants').select('id,name,phone,active,unit_id,units(name,rent)').order('created_at', { ascending: false }),
    ]);
    setUnits(u.data || []); setTenants(t.data || []);
  };
  useEffect(() => { load(); }, []);

  const taken = new Set(tenants.filter((t) => t.active).map((t) => t.unit_id));
  const free = units.filter((u) => !taken.has(u.id));

  const add = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await api('/api/admin/tenants', f); setF(blank); setMsg('Tenant added'); load(); }
    catch (err) { setMsg(err.message); }
    setBusy(false);
  };
  const moveOut = async (id) => {
    if (!confirm('Mark this tenant as moved out?')) return;
    await supabase.from('tenants').update({ active: false }).eq('id', id); load();
  };
  const changePhone = async (t) => {
    const phone = prompt(`New phone number for ${t.name}`, t.phone);
    if (!phone) return;
    try { await api('/api/admin/phone', { tenant_id: t.id, phone }); setMsg('Phone updated. They now sign in with the new number.'); load(); }
    catch (err) { setMsg(err.message); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Shell role="admin">
      <PageTitle>Tenants</PageTitle>
      <Card title="Add tenant" className="mb-6">
        <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <input className={inputCls} placeholder="Full name" value={f.name} onChange={set('name')} required />
          <input className={inputCls} placeholder="Phone e.g. 0712345678" value={f.phone} onChange={set('phone')} required />
          <select className={inputCls} value={f.unit_id} onChange={set('unit_id')} required>
            <option value="">Choose vacant unit</option>
            {free.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.type === 'single' ? 'single room' : '1 bedroom'}) - {kes(u.rent)}</option>)}
          </select>
          <input className={inputCls} placeholder="Portal password (6+ chars)" value={f.password} onChange={set('password')} required />
          <button className={btnCls} disabled={busy}>{busy ? 'Saving…' : 'Add tenant'}</button>
        </form>
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
        <p className="mt-3 text-sm text-slate-500">The tenant signs in with their phone number and this password.</p>
      </Card>
      <Card title="All tenants">
        {tenants.length === 0 ? <Empty>No tenants yet.</Empty> : (
          <Table head={['Unit', 'Name', 'Phone', 'Rent', 'Status', '']}>
            {tenants.map((t) => (
              <tr key={t.id} className={t.active ? '' : 'text-slate-400'}>
                <Td className="font-medium">{t.units?.name}</Td>
                <Td>{t.name}</Td>
                <Td>{t.phone}</Td>
                <Td>{kes(t.units?.rent)}</Td>
                <Td>{t.active ? 'Living here' : 'Moved out'}</Td>
                <Td>{t.active && (
                  <div className="flex gap-2">
                    <button className={btn2Cls} onClick={() => changePhone(t)}>Change phone</button>
                    <button className={btn2Cls} onClick={() => moveOut(t.id)}>Moved out</button>
                  </div>
                )}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Shell>
  );
}
