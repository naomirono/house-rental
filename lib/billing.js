import { admin } from './server';
import { allocate } from './allocate';
import { notify } from './sms';

const payInfo = (unit) => `Pay via M-Pesa Paybill ${process.env.MPESA_SHORTCODE}, Account ${unit || ''}.`;

// Creates charges (skips ones that already exist), applies any credit, sends invoice SMS
export async function issueCharges(rows) {
  if (!rows.length) return 0;
  const db = admin();
  const { data, error } = await db
    .from('charges')
    .upsert(rows, { onConflict: 'tenant_id,kind,period', ignoreDuplicates: true })
    .select('*, tenants(units(name))');
  if (error) throw error;
  for (const c of data || []) {
    const bal = await allocate(c.tenant_id);
    await notify(
      c.tenant_id, 'invoice',
      `Invoice ${c.period}: ${c.kind} KES ${c.amount} due ${c.due_date}. Total balance KES ${Math.max(bal, 0)}. ${payInfo(c.tenants?.units?.name)}`
    );
  }
  return data?.length || 0;
}

export async function generateRent() {
  const db = admin();
  const period = new Date().toISOString().slice(0, 7);
  const due = `${period}-${String(process.env.RENT_DUE_DAY || 5).padStart(2, '0')}`;
  const { data } = await db.from('tenants').select('id, units(rent)').eq('active', true).not('unit_id', 'is', null);
  return issueCharges((data || []).map((t) => ({ tenant_id: t.id, kind: 'rent', period, amount: t.units.rent, due_date: due })));
}

// Reminds tenants with bills overdue or due within 3 days (max one reminder per 3 days)
export async function sendReminders() {
  const db = admin();
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const { data } = await db
    .from('charges')
    .select('tenant_id, amount, paid_amount, due_date, tenants(units(name))')
    .eq('status', 'unpaid')
    .lte('due_date', limit);
  const by = {};
  (data || []).forEach((c) => {
    const o = (by[c.tenant_id] ??= { total: 0, over: 0, unit: c.tenants?.units?.name });
    const left = c.amount - c.paid_amount;
    o.total += left;
    if (c.due_date < today) o.over += left;
  });
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  let n = 0;
  for (const [id, o] of Object.entries(by)) {
    const { count } = await db.from('messages').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id).eq('kind', 'reminder').gte('created_at', since);
    if (count) continue;
    const late = o.over ? ` (KES ${o.over} is overdue)` : '';
    await notify(id, 'reminder', `Reminder: KES ${o.total} rent/water is due${late}. ${payInfo(o.unit)}`);
    n++;
  }
  return n;
}
