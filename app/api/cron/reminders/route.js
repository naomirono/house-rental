import { sendReminders } from '@/lib/billing';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new Response('forbidden', { status: 403 });
  return Response.json({ sent: await sendReminders() });
}
