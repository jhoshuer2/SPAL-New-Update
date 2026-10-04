// B07 · Spal reflects what it heard. Falls back to templated text if Claude is slow or fails (spec §9.2).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askJSON, MODEL_FAST } from "@/lib/ai/claude";
import { placeFromAnswers, templateReflection, type OnboardingAnswers } from "@/lib/engine/onboarding";
import { levelDef } from "@/lib/engine/levels";

const SYSTEM = `You are Spal, a warm, sharp companion for Nigerian entrepreneurs. You just finished asking a new user a few questions.
Write what you heard back to them as 2 or 3 short sentences, addressed to "you". Plain everyday words, no jargon, never shame.
Be specific to what they told you. Do not invent facts. If the language is "pcm", write in light Nigerian Pidgin.
Return JSON: {"sentences": ["...", "..."], "levelNote": "one short sentence on why this level fits, addressed to you"}`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const answers = (await req.json()) as OnboardingAnswers;
  const placement = placeFromAnswers(answers);
  const fallback = { sentences: templateReflection(answers), levelNote: levelDef(placement.level).blurb, source: "template" as const };

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ success: true, data: fallback });

  try {
    const result = await Promise.race([
      askJSON<{ sentences?: string[]; levelNote?: string }>({
        model: MODEL_FAST(),
        system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify({ answers, level: levelDef(placement.level).name }) }],
        maxTokens: 800,
      }),
      new Promise<null>((r) => setTimeout(() => r(null), 3000)),
    ]);
    const sentences = (result?.sentences ?? []).filter((s) => typeof s === "string" && s.trim()).slice(0, 3);
    if (!sentences.length) return NextResponse.json({ success: true, data: fallback });
    return NextResponse.json({
      success: true,
      data: { sentences, levelNote: result?.levelNote?.trim() || fallback.levelNote, source: "ai" },
    });
  } catch {
    return NextResponse.json({ success: true, data: fallback });
  }
}
