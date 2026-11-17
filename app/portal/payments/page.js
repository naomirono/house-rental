'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Card, Badge, Table, Td, Empty, PageTitle, kes } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function MyPayments() {
  const [pays, setPays] = useState([]);
  const [charges, setCharges] = useState([]);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from('payments').select('*').order('paid_at', { ascending: false }),
        supabase.from('charges').select('*').order('due_date', { ascending: false }),
      ]);
      setPays(p.data || []); setCharges(c.data || []);
    })();
  }, []);

  return (
    <Shell role="tenant">
      <PageTitle>Payments</PageTitle>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Payments I have made">
          {pays.length === 0 ? <Empty>No payments yet.</Empty> : (
            <Table head={['M-Pesa receipt', 'Date', 'Amount']}>
              {pays.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">{p.mpesa_receipt}</Td>
                  <Td>{new Date(p.paid_at).toLocaleString('en-KE')}</Td>
                  <Td>{kes(p.amount)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Bill history">
          {charges.length === 0 ? <Empty>No bills yet.</Empty> : (
            <Table head={['Bill', 'Month', 'Amount', 'Paid', 'Status']}>
              {charges.map((c) => (
                <tr key={c.id}>
                  <Td className="capitalize">{c.kind}</Td>
                  <Td>{c.period}</Td>
                  <Td>{kes(c.amount)}</Td>
                  <Td>{kes(c.paid_amount)}</Td>
                  <Td><Badge paid={c.status === 'paid'} /></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </Shell>
  );
}
