// I09 · a public view of someone's journey: only what the privacy-safe views allow.
import { NextRequest, NextResponse } from "next/server";
import { authed, failed, notLive, pending, unauthorized } from "@/lib/community/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const prof = await supabase.from("profiles_public").select("*").eq("id", id).maybeSingle();
  if (notLive(prof.error)) return pending();
  if (prof.error) return failed();
  // Hidden and blocked profiles look exactly like missing ones.
  if (!prof.data) return NextResponse.json({ success: false, error: "This profile isn't available." }, { status: 404 });
  const posts = await supabase.from("posts_public").select("*").eq("author_id", id).order("created_at", { ascending: false }).limit(20); // anonymous posts have author_id null, so they never appear here
  return NextResponse.json({ success: true, data: { profile: prof.data, posts: posts.data ?? [] } });
}
