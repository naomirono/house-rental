const base = () =>
  process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

async function token() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const r = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });
  return (await r.json()).access_token;
}

async function post(path, body) {
  const r = await fetch(base() + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

const cbUrl = (p, extra = '') => `${process.env.APP_URL}${p}?k=${process.env.MPESA_CALLBACK_KEY}${extra}`;

// Sends the PIN prompt to the tenant's phone
export function stkPush({ phone, amount, ref }) {
  const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const sc = process.env.MPESA_SHORTCODE;
  return post('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: sc,
    Password: Buffer.from(sc + process.env.MPESA_PASSKEY + ts).toString('base64'),
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: sc,
    PhoneNumber: phone,
    CallBackURL: cbUrl('/api/pay/stk-callback'),
    AccountReference: ref,
    TransactionDesc: 'Rent',
  });
}

// One-time: tells Safaricom where to send Paybill payments
export function registerC2B() {
  return post('/mpesa/c2b/v2/registerurl', {
    ShortCode: process.env.MPESA_SHORTCODE,
    ResponseType: 'Completed',
    ConfirmationURL: cbUrl('/api/pay/c2b', '&t=confirm'),
    ValidationURL: cbUrl('/api/pay/c2b', '&t=validate'),
  });
}
