// L10 · delete account. Confirmed with your password. Hidden at once, permanently deleted after a 30-day grace period.
import { NextRequest, NextResponse } from "next/server";
import { authed, failed, notLive, unauthorized } from "@/lib/community/server";
import { verifyPassword } from "@/lib/auth/verify-password";

export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { data, error } = await supabase.from("account_deletions").select("purge_after, cancelled_at").eq("user_id", user.id).maybeSingle();
  if (notLive(error) || !data || data.cancelled_at) return NextResponse.json({ success: true, data: { scheduled: false } });
  return NextResponse.json({ success: true, data: { scheduled: true, purge_after: data.purge_after } });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!(await verifyPassword(user, password ?? ""))) return NextResponse.json({ success: false, error: "That isn't your password." }, { status: 403 });

  const now = new Date().toISOString();
  const { error } = await supabase.from("account_deletions").upsert({ user_id: user.id, requested_at: now, purge_after: new Date(Date.now() + 30 * 86_400_000).toISOString(), cancelled_at: null }, { onConflict: "user_id" });
  if (notLive(error)) return NextResponse.json({ success: false, error: "Account deletion is being set up. Please try again soon.", pending: true }, { status: 503 });
  if (error) return failed("Could not schedule deletion. Please try again.");

  // Hide everything now: profile, posts, comments. (Permanent deletion happens after the grace period.)
  await supabase.from("users").update({ profile_visibility: "hidden" }).eq("id", user.id);
  await supabase.from("posts").update({ deleted_at: now }).eq("author_id", user.id).is("deleted_at", null);
  await supabase.from("comments").update({ deleted_at: now }).eq("author_id", user.id).is("deleted_at", null);
  await supabase.auth.signOut({ scope: "global" });
  return NextResponse.json({ success: true });
}

/** Changed your mind within the grace period. Your records and journey are untouched; your profile stays hidden until you choose otherwise. */
export async function DELETE() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { error } = await supabase.from("account_deletions").update({ cancelled_at: new Date().toISOString() }).eq("user_id", user.id).is("cancelled_at", null);
  return error ? failed() : NextResponse.json({ success: true });
}
