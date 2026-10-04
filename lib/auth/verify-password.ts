// Re-check someone's password before a sensitive action (change password, delete account).
// Uses a throwaway client so the user's real session cookies are never touched.
import { createClient } from "@supabase/supabase-js";

export async function verifyPassword(user: { email?: string | null; phone?: string | null }, password: string): Promise<boolean> {
  if (!password || (!user.email && !user.phone)) return false;
  const tmp = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await tmp.auth.signInWithPassword(user.email ? { email: user.email, password } : { phone: user.phone!, password });
  return !error && !!data.user;
}
