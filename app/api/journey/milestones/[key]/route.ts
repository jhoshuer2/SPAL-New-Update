// POST /api/journey/milestones/:key — mark a manual or Spal-confirmed milestone done (D03), or undo it.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canCompleteManually, type MilestoneDef } from "@/lib/engine/milestones";
import type { Level } from "@/lib/engine/placement";

export async function POST(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { proofNote?: string; undo?: boolean };
  const [{ data: def }, { data: profile }] = await Promise.all([
    supabase.from("milestones").select("id, key, level, position, title, completion_type, data_rule, is_gateway").eq("key", key).single(),
    supabase.from("users").select("current_level, active_business_id").eq("id", user.id).single(),
  ]);
  if (!def) return NextResponse.json({ success: false, error: "Milestone not found" }, { status: 404 });
  const level = (profile?.current_level ?? 0) as Level;
  if (!canCompleteManually(def as unknown as MilestoneDef, level)) {
    return NextResponse.json({ success: false, error: "This one completes on its own as you use Spal." }, { status: 400 });
  }

  const businessId = profile?.active_business_id ?? null;
  const done = !body.undo;
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_milestones").upsert({
    user_id: user.id, business_id: businessId, milestone_id: def.id,
    status: done ? "done" : "in_progress",
    completed_at: done ? now : null,
    completed_by: done ? "user" : null,
    proof_note: done ? (body.proofNote?.trim().slice(0, 500) || null) : null,
  }, { onConflict: "user_id,milestone_id" });
  if (error) return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });

  if (done) {
    await supabase.from("moments").insert({ user_id: user.id, business_id: businessId, kind: "auto", type: def.key === "l1_register_business" ? "registered" : "milestone", text: `Milestone done: ${def.title}` });
  }
  return NextResponse.json({ success: true, data: { key, done, gateway: !!def.is_gateway && done } });
}
