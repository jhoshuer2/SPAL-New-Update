// POST /api/journey/level-up — the user confirms the step up (spec §8.3). Never automatic, never downward.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadJourney } from "@/lib/journey/server";
import type { Level } from "@/lib/engine/placement";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const j = await loadJourney(supabase, user.id);
  if (!j.ready) return NextResponse.json({ success: false, error: "Journey not set up yet" }, { status: 409 });
  if (!j.levelUp) return NextResponse.json({ success: false, error: "Finish your gateway milestone first." }, { status: 400 });

  const from = j.level;
  const to = (from + 1) as Level;
  const { data: profile } = await supabase.from("users").select("active_business_id").eq("id", user.id).single();
  const businessId = profile?.active_business_id ?? null;

  const { error } = await supabase.from("users").update({ current_level: to }).eq("id", user.id);
  if (error) return NextResponse.json({ success: false, error: "Could not level up. Please try again." }, { status: 500 });

  await supabase.from("level_history").insert({ user_id: user.id, business_id: businessId, from_level: from, to_level: to, reason: "milestones" });
  // Next level's milestones open up (rows may not exist yet for later levels).
  const { data: next } = await supabase.from("milestones").select("id").eq("level", to);
  if (next?.length) {
    await supabase.from("user_milestones").upsert(
      next.map((m) => ({ user_id: user.id, business_id: businessId, milestone_id: m.id, status: "in_progress" })),
      { onConflict: "user_id,milestone_id", ignoreDuplicates: true },
    );
  }
  await supabase.from("moments").insert({ user_id: user.id, business_id: businessId, kind: "auto", type: "level_up", text: `Reached Level ${to}` });
  return NextResponse.json({ success: true, data: { from, to } });
}
