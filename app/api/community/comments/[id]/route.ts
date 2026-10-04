import { NextRequest, NextResponse } from "next/server";
import { authed, failed, unauthorized } from "@/lib/community/server";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { error } = await supabase.from("comments").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("author_id", user.id);
  return error ? failed() : NextResponse.json({ success: true });
}
