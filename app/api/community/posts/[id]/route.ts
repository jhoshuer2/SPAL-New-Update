// I02 · one post with its comments. DELETE removes your own post (soft delete).
import { NextRequest, NextResponse } from "next/server";
import { authed, failed, notLive, pending, unauthorized } from "@/lib/community/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const post = await supabase.from("posts_public").select("*").eq("id", id).maybeSingle();
  if (notLive(post.error)) return pending();
  if (post.error) return failed();
  if (!post.data) return NextResponse.json({ success: false, error: "This post isn't available." }, { status: 404 });

  const [comments, rx, sv] = await Promise.all([
    supabase.from("comments_public").select("*").eq("post_id", id).order("created_at", { ascending: true }).limit(300),
    supabase.from("reactions").select("kind").eq("user_id", user.id).eq("post_id", id).maybeSingle(),
    supabase.from("saves").select("item_id").eq("user_id", user.id).eq("item_type", "post").eq("item_id", id).maybeSingle(),
  ]);
  return NextResponse.json({ success: true, data: { post: { ...post.data, my_reaction: rx.data?.kind ?? null, saved: !!sv.data }, comments: comments.data ?? [] } });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { error } = await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("author_id", user.id);
  return error ? failed() : NextResponse.json({ success: true });
}
