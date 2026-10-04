// I15 · block someone. You can name a user, or a post/comment (which works even when it is anonymous: the
// server finds the author, and never tells you who). Blocked people vanish from each other's feeds in both directions.
import { NextRequest, NextResponse } from "next/server";
import { authed, authorOf, bad, failed, notLive, pending, unauthorized } from "@/lib/community/server";

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { user_id?: string; post_id?: string; comment_id?: string };
  const target = b.user_id ?? (b.post_id ? await authorOf("posts", b.post_id) : b.comment_id ? await authorOf("comments", b.comment_id) : null);
  if (!target) return bad("We couldn't find who to block.");
  if (target === user.id) return bad("You can't block yourself.");
  const { error } = await supabase.from("blocks").upsert({ blocker_id: user.id, blocked_id: target }, { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });
  if (notLive(error)) return pending();
  if (error) return failed();
  return NextResponse.json({ success: true });
}

/** How many people you've blocked. Names and ids are never listed: that could unmask an anonymous author. */
export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { count, error } = await supabase.from("blocks").select("blocked_id", { count: "exact", head: true }).eq("blocker_id", user.id);
  if (notLive(error)) return NextResponse.json({ success: true, data: { count: 0 } });
  return NextResponse.json({ success: true, data: { count: count ?? 0 } });
}

/** Unblock everyone (the only unblock that cannot reveal identities). */
export async function DELETE() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id);
  return error ? failed() : NextResponse.json({ success: true });
}
