import { admin } from './server';

// Sends an SMS via Africa's Talking and logs it. Without AT_API_KEY it only logs.
export async function notify(tenantId, kind, body) {
  const db = admin();
  const { data: t } = await db.from('tenants').select('phone').eq('id', tenantId).single();
  if (!t) return;
  let status = 'logged';
  if (process.env.AT_API_KEY) {
    const host = process.env.AT_USERNAME === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
    const params = { username: process.env.AT_USERNAME, to: '+' + t.phone, message: body };
    if (process.env.AT_SENDER) params.from = process.env.AT_SENDER;
    const r = await fetch(`https://${host}/version1/messaging`, {
      method: 'POST',
      headers: {
        apiKey: process.env.AT_API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });
    status = r.ok ? 'sent' : 'failed';
  }
  await db.from('messages').insert({ tenant_id: tenantId, kind, body, status });
}
