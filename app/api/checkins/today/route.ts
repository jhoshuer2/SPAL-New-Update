// C02/H06 · today's check-in. One tailored question a day; created on first open if none exists yet.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadJourney } from "@/lib/journey/server";
import { findQuestion, pickQuestion, rhythm } from "@/lib/engine/spal";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
  const todayIso = startOfDay.toISOString().slice(0, 10);

  const existing = await supabase.from("checkins").select("id, question, context, answer, answered_at").eq("user_id", user.id).gte("scheduled_for", startOfDay.toISOString()).order("scheduled_for", { ascending: false }).limit(1);
  if (existing.error) return NextResponse.json({ success: true, data: { pending: true } }); // migration 026 not live yet

  const recentRes = await supabase.from("checkins").select("question, answered_at").eq("user_id", user.id).gte("scheduled_for", new Date(Date.now() - 14 * 86_400_000).toISOString());
  const answeredDays = (recentRes.data ?? []).filter((c) => c.answered_at).map((c) => c.answered_at as string);
  const days = rhythm(answeredDays, todayIso);

  type Row = { id: string; question: string; context: string | null; answer: string | null; answered_at: string | null };
  let row: Row | undefined = existing.data?.[0];
  let hardSeason = false;
  if (row) { const j = await loadJourney(supabase, user.id); hardSeason = j.ready && j.hardSeason; }
  if (!row) {
    const j = await loadJourney(supabase, user.id);
    const level = j.ready ? j.level : 0;
    hardSeason = j.ready && j.hardSeason;
    const ctx = j.ready ? { hasEverRecorded: j.hasEverRecorded, salesToday: j.salesToday, hardSeason: j.hardSeason } : { hasEverRecorded: false, salesToday: 0, hardSeason: false };
    const seed = Math.floor(Date.now() / 86_400_000);
    const q = pickQuestion(level, ctx, (recentRes.data ?? []).map((c) => c.question as string), seed);
    const ins = await supabase.from("checkins").insert({ user_id: user.id, question: q.question, context: q.why, answer_type: q.mood ? "mood" : q.choices.length ? "choice" : "text" }).select("id, question, context, answer, answered_at").single();
    if (ins.error?.code === "23505") {
      // Lost a race with another open: use the one that won.
      const again = await supabase.from("checkins").select("id, question, context, answer, answered_at").eq("user_id", user.id).gte("scheduled_for", startOfDay.toISOString()).order("scheduled_for", { ascending: false }).limit(1);
      row = again.data?.[0];
    } else if (!ins.error) row = ins.data ?? undefined;
    if (!row) return NextResponse.json({ success: false, error: "Could not start your check-in." }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: { id: row.id, question: row.question, why: row.context, answered: !!row.answered_at, answer: row.answer, choices: findQuestion(row.question)?.choices ?? [], mood: findQuestion(row.question)?.mood ?? false, daysThisWeek: hardSeason ? null : days } });
}
