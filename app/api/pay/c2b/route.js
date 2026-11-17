import { recordPayment } from '@/lib/payments';
export const dynamic = 'force-dynamic';

// Paybill payments: tenant pays to your Paybill with Account = unit name (e.g. S3)
export async function POST(req) {
  const q = new URL(req.url).searchParams;
  if (q.get('k') !== process.env.MPESA_CALLBACK_KEY) return new Response('forbidden', { status: 403 });
  if (q.get('t') === 'validate') return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  const b = await req.json();
  await recordPayment({
    receipt: b.TransID, phone: String(b.MSISDN || ''), ref: b.BillRefNumber, amount: Number(b.TransAmount),
  });
  return Response.json({ ResultCode: 0, ResultDesc: 'Success' });
}
