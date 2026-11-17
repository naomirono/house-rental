'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Table, Td, Empty, PageTitle, inputCls, kes } from '@/components/ui';
import { supabase, api } from '@/lib/supabase';

export default function Payments() {
  const [pays, setPays] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [p, t] = await Promise.all([
      supabase.from('payments').select('*, tenants(name, units(name))').order('paid_at', { ascending: false }).limit(200),
      supabase.from('tenants').select('id,name,units(name)').eq('active', true),
    ]);
    setPays(p.data || []); setTenants(t.data || []);
  };
  useEffect(() => { load(); }, []);

  const assign = async (payment_id, tenant_id) => {
    if (!tenant_id) return;
    try { await api('/api/admin/assign', { payment_id, tenant_id }); setMsg('Payment matched and receipt sent'); load(); }
    catch (err) { setMsg(err.message); }
  };
  const unmatched = pays.filter((p) => !p.tenant_id);

  return (
    <Shell role="admin">
      <PageTitle>Payments</PageTitle>
      {msg && <p className="mb-4 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200">{msg}</p>}
      {unmatched.length > 0 && (
        <Card title={`Unmatched payments (${unmatched.length})`} className="mb-6 ring-red-200">
          <p className="mb-3 text-sm text-slate-500">These came in with a wrong or missing account number (it should be the unit, e.g. SR1 or OB1). Choose who paid and that number will match automatically next time.</p>
          <Table head={['Receipt', 'Date', 'Amount', 'Payer', 'Account used', 'Match to']}>
            {unmatched.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.mpesa_receipt}</Td>
                <Td>{new Date(p.paid_at).toLocaleString('en-KE')}</Td>
                <Td>{kes(p.amount)}</Td>
                <Td>{p.phone}</Td>
                <Td>{p.account_ref || '-'}</Td>
                <Td>
                  <select className={inputCls} defaultValue="" onChange={(e) => assign(p.id, e.target.value)}>
                    <option value="">Choose tenant</option>
                    {tenants.map((t) => <option key={t.id} value={t.id}>{t.units?.name} - {t.name}</option>)}
                  </select>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      <Card title="All payments">
        {pays.length === 0 ? <Empty>No payments received yet.</Empty> : (
          <Table head={['Receipt', 'Date', 'Unit', 'Tenant', 'Amount']}>
            {pays.filter((p) => p.tenant_id).map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.mpesa_receipt}</Td>
                <Td>{new Date(p.paid_at).toLocaleString('en-KE')}</Td>
                <Td>{p.tenants?.units?.name}</Td>
                <Td>{p.tenants?.name}</Td>
                <Td>{kes(p.amount)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Shell>
  );
}
