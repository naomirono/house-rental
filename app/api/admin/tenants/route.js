import { admin, requireUser, json } from '@/lib/server';
import { normPhone } from '@/lib/utils';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const u = await requireUser(req);
  if (u?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { name, phone, unit_id, password } = await req.json();
  if (!name || !phone || !unit_id || !password || password.length < 6) return json({ error: 'Fill all fields (password 6+ chars)' }, 400);
  const p = normPhone(phone);
  const db = admin();
  const { data, error } = await db.auth.admin.createUser({ email: `${p}@tenant.app`, password, email_confirm: true });
  if (error) return json({ error: error.message }, 400);
  await db.from('profiles').insert({ id: data.user.id, role: 'tenant' });
  const { error: e2 } = await db.from('tenants').insert({ user_id: data.user.id, name, phone: p, unit_id });
  if (e2) {
    await db.auth.admin.deleteUser(data.user.id);
    return json({ error: e2.message }, 400);
  }
  return json({ ok: true });
}
