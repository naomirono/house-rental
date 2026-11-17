import { admin, requireUser, json } from '@/lib/server';
import { allocate } from '@/lib/allocate';
import { receiptSms } from '@/lib/payments';
export const dynamic = 'force-dynamic';

// Manually match an unmatched M-Pesa payment to a tenant
export async function POST(req) {
  const u = await requireUser(req);
  if (u?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { payment_id, tenant_id } = await req.json();
  const db = admin();
  const { data: p } = await db.from('payments').update({ tenant_id }).eq('id', payment_id).is('tenant_id', null).select().single();
  if (!p) return json({ error: 'Payment already matched' }, 409);
  if (p.phone) await db.from('payer_links').upsert({ phone: p.phone, tenant_id }); // next time this payer auto-matches
  const balance = await allocate(tenant_id);
  await receiptSms(tenant_id, p.amount, p.mpesa_receipt, balance);
  return json({ ok: true });
}
