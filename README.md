# Rental Manager (Next.js + Tailwind + Supabase + M-Pesa)

## 1. Setup
1. Create a Supabase project. In **SQL Editor**, run `supabase/schema.sql`.
   Edit the rents of your 9 single rooms (S1-S9) and 4 one-bedrooms (B1-B4) in the `units` table.
2. Supabase **Authentication > Users > Add user**: create your own landlord login (email + password).
   Then run: `insert into profiles (id, role) values ('<that user id>', 'admin');`
3. `cp .env.example .env.local` and fill it in (Supabase keys: Project Settings > API).
4. `npm install` then `npm run dev`. Sign in at `/login`.

## 2. How payments are matched (Paybill)
Tenants pay your Paybill with **Account number = unit name**: SR1-SR9 for single rooms, OB1-OB4 for one bedrooms.
- The account belongs to the house, so tenants and phone numbers can change freely. The payment goes to whoever currently lives in that unit.
- Typing "sr 1" or "SR-1" still matches. Tenants can also tap "Send M-Pesa prompt" in their portal.
- A payment with a wrong account number lands in **Payments > Unmatched**. Pick the tenant and that payer is remembered for next time.
- Mark tenants as "Moved out" when they leave, then add the new tenant to the same unit. Use **Change phone** for new numbers.
- Payments clear the oldest bill first. Extra money stays as credit. Each payment sends an SMS receipt with the new balance.

## 3. M-Pesa (Daraja)
- `MPESA_SHORTCODE=174379` is Safaricom's sandbox test Paybill. Replace it with your own Paybill after you get one.
- Create an app at developer.safaricom.co.ke and put key/secret/passkey in `.env.local`. The sandbox passkey is on the Daraja "Simulate" page.
- Callbacks need a public HTTPS URL (deploy to Vercel). Set `APP_URL`.
- Go-live: set `MPESA_ENV=production`, then press **Bills > Register Paybill URLs** once.

## 4. SMS (invoices, receipts, reminders)
Uses Africa's Talking. Without `AT_API_KEY`, messages are only saved to the `messages` table (safe for testing).

## 5. Automation (Vercel Cron, see vercel.json)
- 1st of each month 09:00 EAT: rent invoices to all tenants.
- Daily 10:00 EAT: reminders for bills due within 3 days or overdue (at most one every 3 days per tenant).
- Set `CRON_SECRET` in Vercel env vars. Water bills are entered by you under **Bills**.
