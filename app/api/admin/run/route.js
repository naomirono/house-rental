import { requireUser, json } from '@/lib/server';
import { generateRent, sendReminders } from '@/lib/billing';
import { registerC2B } from '@/lib/mpesa';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const u = await requireUser(req);
  if (u?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { job } = await req.json();
  if (job === 'invoices') return json({ message: `${await generateRent()} invoice(s) sent` });
  if (job === 'reminders') return json({ message: `${await sendReminders()} reminder(s) sent` });
  if (job === 'register') return json({ message: JSON.stringify(await registerC2B()) });
  return json({ error: 'Unknown job' }, 400);
}
