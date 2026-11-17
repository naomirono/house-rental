import { admin } from './server';

// Re-applies ALL of a tenant's payments to their charges, oldest first.
// Safe to run any number of times. Returns balance (positive = owes, negative = credit).
export async function allocate(tenantId) {
  const db = admin();
  const [{ data: pays }, { data: charges }] = await Promise.all([
    db.from('payments').select('amount').eq('tenant_id', tenantId),
    db.from('charges').select('*').eq('tenant_id', tenantId).order('due_date'),
  ]);
  let pool = (pays || []).reduce((s, p) => s + p.amount, 0);
  let owed = 0;
  for (const c of charges || []) {
    const paid = Math.min(c.amount, pool);
    pool -= paid;
    owed += c.amount - paid;
    const status = paid >= c.amount ? 'paid' : 'unpaid';
    if (paid !== c.paid_amount || status !== c.status)
      await db.from('charges').update({ paid_amount: paid, status }).eq('id', c.id);
  }
  return owed - pool;
}
