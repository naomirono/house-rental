import { admin } from './server';
import { allocate } from './allocate';
import { notify } from './sms';
import { normPhone } from './utils';

// Match order: explicit tenant -> account number (unit name) -> remembered payer -> registered phone
async function findTenant(db, ref, phone) {
  if (ref) {
    const clean = ref.replace(/[\s-]/g, '').toUpperCase(); // 'sr 1' -> 'SR1'
    const { data: u } = await db.from('units').select('id').eq('name', clean).maybeSingle();
    if (u) {
      const { data: t } = await db.from('tenants').select('id').eq('unit_id', u.id).eq('active', true).maybeSingle();
      if (t) return t.id;
    }
  }
  if (phone) {
    const { data: l } = await db.from('payer_links').select('tenant_id, tenants(active)').eq('phone', phone).maybeSingle();
    if (l?.tenants?.active) return l.tenant_id;
  }
  if (phone) {
    const { data: t } = await db.from('tenants').select('id').eq('phone', normPhone(phone)).eq('active', true).maybeSingle();
    if (t) return t.id;
  }
  return null;
}

export async function receiptSms(tenantId, amount, receipt, balance) {
  const bal = balance > 0 ? `Balance: KES ${balance}.` : balance < 0 ? `Credit: KES ${-balance}.` : 'Balance: KES 0.';
  await notify(tenantId, 'receipt', `Receipt: KES ${amount} received (M-Pesa ${receipt}). ${bal} Thank you.`);
}

export async function recordPayment({ tenantId, receipt, phone, ref, amount }) {
  const db = admin();
  const tid = tenantId || (await findTenant(db, ref, phone));
  const { error } = await db.from('payments').insert({
    tenant_id: tid, mpesa_receipt: receipt, phone, account_ref: ref, amount: Math.round(amount),
  });
  if (error) {
    if (error.code === '23505') return { duplicate: true }; // Safaricom retried
    throw error;
  }
  if (tid) {
    const balance = await allocate(tid);
    await receiptSms(tid, Math.round(amount), receipt, balance);
  }
  return { matched: !!tid };
}
