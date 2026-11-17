import { admin, requireUser, json } from '@/lib/server';
import { stkPush } from '@/lib/mpesa';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const u = await requireUser(req);
  if (!u) return json({ error: 'Unauthorized' }, 401);
  const { amount } = await req.json();
  const amt = Math.ceil(Number(amount));
  if (!(amt >= 1)) return json({ error: 'Enter a valid amount' }, 400);
  const db = admin();
  const { data: t } = await db.from('tenants').select('id, phone, units(name)').eq('user_id', u.user.id).single();
  if (!t) return json({ error: 'Tenant not found' }, 404);
  const r = await stkPush({ phone: t.phone, amount: amt, ref: t.units?.name || 'RENT' });
  if (r.ResponseCode !== '0') return json({ error: r.errorMessage || r.ResponseDescription || 'M-Pesa request failed' }, 502);
  await db.from('stk_requests').insert({ checkout_id: r.CheckoutRequestID, tenant_id: t.id });
  return json({ ok: true });
}
