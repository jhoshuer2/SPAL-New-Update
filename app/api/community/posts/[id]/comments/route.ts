// I02 · comment or reply. The post author is told (never who, if you comment anonymously).
import { NextRequest, NextResponse } from "next/server";
import { authed, authorOf, bad, failed, notLive, pending, privacyGate, unauthorized } from "@/lib/community/server";
import { validateComment } from "@/lib/engine/community";
import { notify } from "@/lib/notify";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { body?: string; anonymous?: boolean; parent_id?: string; acknowledged?: boolean };
  const v = validateComment(b.body);
  if (!v.ok) return bad(v.error);
  const gate = privacyGate(v.body, b.acknowledged);
  if (gate) return gate;

  const visible = await supabase.from("posts_public").select("id").eq("id", id).maybeSingle();
  if (notLive(visible.error)) return pending();
  if (!visible.data) return NextResponse.json({ success: false, error: "This post isn't available." }, { status: 404 });

  const { data: me } = await supabase.from("users").select("*").eq("id", user.id).single();
  const p = (me ?? {}) as { profile_visibility?: string; display_name?: string; full_name?: string };
  if (!b.anonymous && p.profile_visibility === "hidden") {
    return NextResponse.json({ success: false, code: "needs_visibility", error: "To comment under your name, your profile needs to be visible." }, { status: 409 });
  }
  if (b.parent_id) {
    const parent = await supabase.from("comments_public").select("id").eq("id", b.parent_id).eq("post_id", id).maybeSingle();
    if (!parent.data) return bad("That comment isn't there any more.");
  }
  const { data, error } = await supabase.from("comments").insert({ post_id: id, author_id: user.id, parent_id: b.parent_id ?? null, body: v.body, anonymous: !!b.anonymous }).select("id").single();
  if (error) return failed("Could not comment. Please try again.");

  const author = await authorOf("posts", id);
  if (author && author !== user.id) {
    const name = b.anonymous ? undefined : (p.display_name || p.full_name?.split(" ")[0]);
    await notify(author, "comment_reply", { name, postId: id });
  }
  return NextResponse.json({ success: true, data });
}
