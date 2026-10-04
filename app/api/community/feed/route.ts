// I01 · feed. Reads only the privacy-safe view. Tabs: For you, My level; Following arrives with connections.
import { NextRequest, NextResponse } from "next/server";
import { authed, failed, notLive, pending, unauthorized } from "@/lib/community/server";

const PAGE = 15;

export async function GET(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const tab = sp.get("tab") ?? "for_you";
  const before = sp.get("before");
  if (tab === "following") return NextResponse.json({ success: true, data: { posts: [], next: null, note: "Following opens up when connections arrive." } });

  let q = supabase.from("posts_public").select("*").order("created_at", { ascending: false }).limit(PAGE + 1);
  if (before && !Number.isNaN(Date.parse(before))) q = q.lt("created_at", before);
  if (tab === "level") {
    const { data: me } = await supabase.from("users").select("current_level").eq("id", user.id).single();
    q = q.eq("author_level", (me as { current_level?: number } | null)?.current_level ?? 0);
  }
  const { data, error } = await q;
  if (notLive(error)) return pending();
  if (error) return failed();

  const rows = data ?? [];
  const page = rows.slice(0, PAGE);
  const ids = page.map((p) => p.id as string);
  const [rx, sv] = ids.length ? await Promise.all([
    supabase.from("reactions").select("post_id, kind").eq("user_id", user.id).in("post_id", ids),
    supabase.from("saves").select("item_id").eq("user_id", user.id).eq("item_type", "post").in("item_id", ids),
  ]) : [{ data: [] }, { data: [] }];
  const mine = new Map((rx.data ?? []).map((r) => [r.post_id as string, r.kind as string]));
  const saved = new Set((sv.data ?? []).map((s) => s.item_id as string));
  return NextResponse.json({
    success: true,
    data: {
      posts: page.map((p) => ({ ...p, my_reaction: mine.get(p.id as string) ?? null, saved: saved.has(p.id as string) })),
      next: rows.length > PAGE ? page[page.length - 1].created_at : null,
    },
  });
}
