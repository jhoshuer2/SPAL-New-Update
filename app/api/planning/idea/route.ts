// E02 · turn a rough idea into a clear offer. Spal drafts; if AI is unavailable a written fallback keeps the flow moving.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, cleanText, missingTable, notReady, saveFailed, unauthorized } from "@/lib/planning/server";
import { ideaFallback } from "@/lib/engine/planning";
import { spalDraft } from "@/lib/ai/spal";

const SYSTEM = `You help a Nigerian would-be entrepreneur turn a rough idea into a clear offer.
Return JSON: {"summary": {"oneLiner": string, "customer": string, "offer": string, "why": string}, "questions": [string, string, string], "alternatives": [string, string]}
- oneLiner: one plain sentence, "I will sell X to Y so that Z".
- customer, offer, why: one short sentence each, using only what they told you. If they did not say, leave the string empty.
- questions: up to 3 clarifying questions that would sharpen the idea. One idea per question.
- alternatives: up to 2 other angles worth considering (a different customer or a simpler first version). Not new businesses.`;

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { text?: string };
  const text = cleanText(b.text, 2000);
  if (text.length < 8) return bad("Tell me a bit more about your idea first.");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  const language = (profile as { language?: string } | null)?.language === "pcm" ? "pcm" : "en";

  const drafted = await spalDraft<{ summary?: Record<string, unknown>; questions?: unknown[]; alternatives?: unknown[] }>(user.id, SYSTEM, text, language);
  const fb = ideaFallback(text);
  const s = drafted?.summary ?? {};
  const summary = {
    oneLiner: cleanText(s.oneLiner, 200) || fb.summary.oneLiner,
    customer: cleanText(s.customer, 200),
    offer: cleanText(s.offer, 200),
    why: cleanText(s.why, 200),
  };
  const strings = (a: unknown[] | undefined, n: number) => (a ?? []).map((x) => cleanText(x, 200)).filter(Boolean).slice(0, n);
  const questions = strings(drafted?.questions, 3);
  const row = {
    user_id: user.id, raw_text: text, summary,
    questions: questions.length ? questions : fb.questions,
    alternatives: strings(drafted?.alternatives, 2),
  };
  const { error } = await supabase.from("ideas").upsert(row, { onConflict: "user_id" });
  if (missingTable(error)) return notReady();
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { ...row, drafted: !!drafted } });
}

/** Edit the summary by hand. */
export async function PATCH(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { summary?: Record<string, unknown> };
  const s = b.summary ?? {};
  const summary = { oneLiner: cleanText(s.oneLiner, 200), customer: cleanText(s.customer, 200), offer: cleanText(s.offer, 200), why: cleanText(s.why, 200) };
  if (!summary.oneLiner) return bad("Your idea needs a one-sentence summary.");
  const { error } = await supabase.from("ideas").update({ summary }).eq("user_id", user.id);
  if (missingTable(error)) return notReady();
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { summary } });
}
