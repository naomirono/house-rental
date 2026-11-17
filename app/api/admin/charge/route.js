import { requireUser, json } from '@/lib/server';
import { issueCharges } from '@/lib/billing';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const u = await requireUser(req);
  if (u?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { tenant_id, kind, period, amount, due_date } = await req.json();
  if (!tenant_id || !kind || !period || !(amount > 0) || !due_date) return json({ error: 'Fill all fields' }, 400);
  const n = await issueCharges([{ tenant_id, kind, period, amount: Math.round(amount), due_date }]);
  if (!n) return json({ error: `A ${kind} bill for ${period} already exists for this tenant` }, 409);
  return json({ ok: true });
}
