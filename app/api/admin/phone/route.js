import { admin, requireUser, json } from '@/lib/server';
import { normPhone } from '@/lib/utils';
export const dynamic = 'force-dynamic';

// Tenant got a new number: update it everywhere (SMS, M-Pesa prompt, portal login)
export async function POST(req) {
  const u = await requireUser(req);
  if (u?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { tenant_id, phone } = await req.json();
  const p = normPhone(phone);
  if (p.length !== 12) return json({ error: 'Enter a valid Kenyan number' }, 400);
  const db = admin();
  const { data: t } = await db.from('tenants').select('user_id').eq('id', tenant_id).single();
  if (!t) return json({ error: 'Tenant not found' }, 404);
  if (t.user_id) {
    const { error } = await db.auth.admin.updateUserById(t.user_id, { email: `${p}@tenant.app`, email_confirm: true });
    if (error) return json({ error: error.message }, 400);
  }
  await db.from('tenants').update({ phone: p }).eq('id', tenant_id);
  return json({ ok: true });
}
