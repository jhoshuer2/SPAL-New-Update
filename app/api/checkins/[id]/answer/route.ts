// C02 · answer today's check-in. Text answers can become a private moment and feed Spal's memory.
import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMemory } from "@/lib/ai/spal";
import { warmReply } from "@/lib/engine/spal";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as { choice?: string; text?: string };
  const choice = b.choice?.trim().slice(0, 60) || null;
  const text = b.text?.trim().slice(0, 1000) || null;
  if (!choice && !text) return NextResponse.json({ success: false, error: "Tap an answer or write a few words." }, { status: 400 });

  const { data: row } = await supabase.from("checkins").select("id, question, answered_at").eq("id", id).eq("user_id", user.id).single();
  if (!row) return NextResponse.json({ success: false, error: "Check-in not found" }, { status: 404 });

  const answer = [choice, text].filter(Boolean).join(" · ");
  const { error } = await supabase.from("checkins").update({ answer, answered_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  const p = (profile ?? {}) as Record<string, unknown>;

  // Written words go on the timeline (private). A tap alone does not clutter it.
  if (text && text.split(/\s+/).length >= 3) {
    const type = choice === "Great" ? "win" : choice === "Slow" || choice === "No sales" || choice === "Struggling" || choice === "Very tight" ? "struggle" : "lesson";
    await supabase.from("moments").insert({ user_id: user.id, business_id: (p.active_business_id as string) ?? null, kind: "manual", type, text });
    if (!p.memory_paused) after(() => extractMemory(user.id, text, "", false));
  }
  return NextResponse.json({ success: true, data: { reply: warmReply(choice, !!p.hard_season) } });
}
