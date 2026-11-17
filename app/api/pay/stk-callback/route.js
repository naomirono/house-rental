import { admin } from '@/lib/server';
import { recordPayment } from '@/lib/payments';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (new URL(req.url).searchParams.get('k') !== process.env.MPESA_CALLBACK_KEY)
    return new Response('forbidden', { status: 403 });
  const cb = (await req.json())?.Body?.stkCallback;
  if (cb?.ResultCode === 0) {
    const m = Object.fromEntries((cb.CallbackMetadata?.Item || []).map((i) => [i.Name, i.Value]));
    const { data: r } = await admin().from('stk_requests').select('tenant_id').eq('checkout_id', cb.CheckoutRequestID).maybeSingle();
    await recordPayment({
      tenantId: r?.tenant_id, receipt: m.MpesaReceiptNumber, phone: String(m.PhoneNumber || ''), amount: m.Amount,
    });
  }
  return Response.json({ ResultCode: 0, ResultDesc: 'OK' });
}
