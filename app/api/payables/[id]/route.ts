import { NextRequest, NextResponse } from "next/server";
import { authed, saveFailed, unauthorized } from "@/lib/planning/server";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { error } = await supabase.from("payables").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  return error ? saveFailed() : NextResponse.json({ success: true });
}
