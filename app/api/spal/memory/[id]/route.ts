// Edit or delete one remembered fact. Deleting is immediate and excludes it from context (spec §9.5).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSensitiveFact } from "@/lib/engine/spal";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { fact } = (await req.json().catch(() => ({}))) as { fact?: string };
  const clean = fact?.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!clean || clean.length < 3) return NextResponse.json({ success: false, error: "Write a few words." }, { status: 400 });
  if (isSensitiveFact(clean)) return NextResponse.json({ success: false, error: "Spal doesn't keep that kind of detail. Please leave it out." }, { status: 400 });
  const { error } = await supabase.from("spal_memory").update({ fact: clean, confidence: 1 }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.from("spal_memory").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ success: false, error: "Could not delete. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true });
}
