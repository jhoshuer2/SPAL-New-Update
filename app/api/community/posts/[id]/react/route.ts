// React to a post (one reaction per person; send kind:null to take it back).
import { NextRequest, NextResponse } from "next/server";
import { authed, authorOf, bad, failed, notLive, pending, unauthorized } from "@/lib/community/server";
import { REACTIONS } from "@/lib/engine/community";
import { notifyReaction } from "@/lib/notify";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { kind } = (await req.json().catch(() => ({}))) as { kind?: string | null };
  const visible = await supabase.from("posts_public").select("id").eq("id", id).maybeSingle();
  if (notLive(visible.error)) return pending();
  if (!visible.data) return NextResponse.json({ success: false, error: "This post isn't available." }, { status: 404 });

  if (kind === null) {
    const { error } = await supabase.from("reactions").delete().eq("post_id", id).eq("user_id", user.id);
    return error ? failed() : NextResponse.json({ success: true });
  }
  if (!REACTIONS.some((r) => r.key === kind)) return bad("Pick a reaction.");
  const had = await supabase.from("reactions").select("kind").eq("post_id", id).eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("reactions").upsert({ post_id: id, user_id: user.id, kind }, { onConflict: "post_id,user_id" });
  if (error) return failed();
  if (!had.data) {
    const author = await authorOf("posts", id);
    if (author && author !== user.id) await notifyReaction(author, id);
  }
  return NextResponse.json({ success: true });
}
