import { createClient } from '@supabase/supabase-js';

export const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

export async function requireUser(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  const db = admin();
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return null;
  const { data: p } = await db.from('profiles').select('role').eq('id', data.user.id).single();
  return { user: data.user, role: p?.role };
}

export const json = (body, status = 200) => Response.json(body, { status });
