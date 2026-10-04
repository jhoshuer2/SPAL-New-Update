// B08-B10 · Save placement. Placement is recomputed server-side from the answers; the client is not trusted.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { placeFromAnswers, legacyBusinessType, type OnboardingAnswers } from "@/lib/engine/onboarding";
import type { Level } from "@/lib/engine/placement";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { answers: OnboardingAnswers; chosenLevel: number; beginChoice?: string };
  const { answers } = body;
  const chosen = body.chosenLevel;
  if (!answers || !Number.isInteger(chosen) || chosen < 0 || chosen > 5) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  const level = chosen as Level;
  const placement = placeFromAnswers(answers);

  try {
    // Business: every user has at least one (spec §7.1)
    const { data: profile } = await supabase.from("users").select("active_business_id").eq("id", user.id).single();
    let businessId: string | null = profile?.active_business_id ?? null;
    if (!businessId) {
      const { data: b } = await supabase.from("businesses").insert({
        user_id: user.id,
        business_name: level === 0 ? "My idea" : "My business",
        business_type: legacyBusinessType(answers.businessType),
      }).select("id").single();
      businessId = b?.id ?? null;
    }

    await supabase.from("onboarding_responses").upsert({
      user_id: user.id,
      answers,
      computed_level: placement.level,
      confidence: placement.confidence,
      signals: placement.signals,
      chosen_level: level,
      begin_choice: body.beginChoice ?? null,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    await supabase.from("level_history").insert({
      user_id: user.id, business_id: businessId, from_level: null, to_level: level,
      reason: level === placement.level ? "placement" : "adjusted",
    });

    // Milestones: earlier levels done, chosen level in progress, later locked (spec §8.1)
    const { data: ms } = await supabase.from("milestones").select("id, level");
    if (ms?.length) {
      const rows = ms.map((m) => ({
        user_id: user.id, business_id: businessId, milestone_id: m.id,
        status: m.level < level ? "done" : m.level === level ? "in_progress" : "locked",
        completed_at: m.level < level ? new Date().toISOString() : null,
        completed_by: m.level < level ? "placement" : null,
      }));
      await supabase.from("user_milestones").upsert(rows, { onConflict: "user_id,milestone_id", ignoreDuplicates: true });
    }

    await supabase.from("users").update({
      full_name: answers.name || undefined,
      display_name: answers.name || null,
      state: answers.state || null,
      city: answers.city || null,
      language: answers.language,
      business_type: legacyBusinessType(answers.businessType),
      current_level: level,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      active_business_id: businessId,
    }).eq("id", user.id);

    return NextResponse.json({ success: true, data: { level } });
  } catch (err) {
    console.error("POST /api/onboarding/complete", err);
    return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
  }
}
