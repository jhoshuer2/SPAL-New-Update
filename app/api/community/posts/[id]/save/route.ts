import { NextRequest, NextResponse } from "next/server";
import { authed, failed, unauthorized } from "@/lib/community/server";

/** Toggle: saved posts are private to you. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const ex = await supabase.from("saves").select("item_id").eq("user_id", user.id).eq("item_type", "post").eq("item_id", id).maybeSingle();
  const { error } = ex.data
    ? await supabase.from("saves").delete().eq("user_id", user.id).eq("item_type", "post").eq("item_id", id)
    : await supabase.from("saves").insert({ user_id: user.id, item_type: "post", item_id: id });
  return error ? failed() : NextResponse.json({ success: true, data: { saved: !ex.data } });
}
