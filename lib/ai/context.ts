// Builds the grounded context Spal answers from (spec §9.3). Aggregated numbers only, never raw rows.
import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregate, rankMemories, type Aggregates, type MemoryFact, type RecordRow } from "@/lib/engine/spal";
import { loadJourney } from "@/lib/journey/server";
import { LEVELS } from "@/lib/engine/levels";
import { formatCurrency } from "@/lib/utils/currency";
import type { Level } from "@/lib/engine/placement";

export type SpalContext = {
  text: string;
  level: Level;
  language: "en" | "pcm";
  hardSeason: boolean;
  memoryPaused: boolean;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const money = (n: number) => formatCurrency(n);

export async function buildContext(supabase: SupabaseClient, userId: string, message: string): Promise<SpalContext> {
  const today = isoDay(new Date());
  const since = isoDay(new Date(Date.now() - 90 * 86_400_000));

  // select("*") on users so a column added by migration 026 being absent never breaks chat.
  const [uRes, recRes, goalsRes, memRes, momRes, chkRes, journey] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase.from("records").select("type, amount, description, record_date, payment_status").eq("user_id", userId).gte("record_date", since).limit(5000),
    supabase.from("user_goals").select("goal_type, target_amount").eq("user_id", userId).eq("is_active", true),
    supabase.from("spal_memory").select("id, fact, category, created_at").eq("user_id", userId).is("deleted_at", null).limit(300),
    supabase.from("moments").select("type, text, occurred_on").eq("user_id", userId).is("deleted_at", null).order("occurred_on", { ascending: false }).limit(3),
    supabase.from("checkins").select("question, answer").eq("user_id", userId).not("answered_at", "is", null).order("answered_at", { ascending: false }).limit(5),
    loadJourney(supabase, userId).catch(() => null),
  ]);

  const u = (uRes.data ?? {}) as Record<string, unknown>;
  const level = ((u.current_level as number | undefined) ?? 0) as Level;
  const language = (u.language === "pcm" ? "pcm" : "en") as "en" | "pcm";
  const hardSeason = !!u.hard_season;
  const memoryPaused = !!u.memory_paused;

  const rows = (recRes.data ?? []) as (RecordRow & { description?: string | null })[];
  const agg: Aggregates = aggregate(rows, today);
  const topSellers = (() => {
    const t = new Map<string, number>();
    const cutoff = Date.now() - 30 * 86_400_000;
    for (const r of rows) if (r.type === "sale" && r.description && Date.parse(r.record_date) >= cutoff) t.set(r.description.trim().toLowerCase(), (t.get(r.description.trim().toLowerCase()) ?? 0) + Number(r.amount));
    return [...t.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  })();
  const win = (label: string, w: Aggregates["last7"]) => `${label}: money in ${money(w.moneyIn)}, money out ${money(w.moneyOut)}, profit ${money(w.profit)}`;

  const mems = rankMemories((memRes.data ?? []) as MemoryFact[], message, 20);
  const lines: string[] = [];
  lines.push(`PROFILE: ${(u.display_name || u.full_name || "the owner") as string}; Level ${level} (${LEVELS[level].name}); business: ${(u.business_name as string) || "unnamed"}${u.business_type ? ` (${u.business_type})` : ""}${u.state ? `; ${u.state}` : ""}.`);
  if (journey && journey.ready) {
    const next = journey.progress.next;
    lines.push(`JOURNEY: ${journey.progress.done} of ${journey.progress.total} Level ${level} milestones done${next ? `; next: ${next.title}` : ""}.`);
  }
  const goals = goalsRes.data ?? [];
  lines.push(goals.length ? `GOALS: ${goals.map((g) => `${String(g.goal_type).replace(/_/g, " ")} target ${money(Number(g.target_amount))}`).join("; ")}.` : "GOALS: none set yet.");
  if (agg.recordCount90 === 0) {
    lines.push("MONEY: no sales or expenses recorded in the last 90 days.");
  } else {
    lines.push(`MONEY (cash basis): ${win("last 7 days", agg.last7)}. ${win("last 30 days", agg.last30)}. ${win("last 90 days", agg.last90)}. Unpaid sales (owed to them): ${money(agg.owing)}. ${topSellers.length ? `Top sellers, 30 days: ${topSellers.join(", ")}.` : ""}`);
  }
  if (mems.length) lines.push(`WHAT YOU KNOW ABOUT THEM:\n${mems.map((m) => `- ${m.fact}`).join("\n")}`);
  const moments = momRes.data ?? [];
  if (moments.length) lines.push(`RECENT MOMENTS: ${moments.map((m) => `${m.occurred_on} ${m.type}: ${m.text}`).join(" | ")}`);
  const chk = (chkRes.data ?? []).filter((c) => c.answer);
  if (chk.length) lines.push(`RECENT CHECK-IN ANSWERS: ${chk.map((c) => `${c.question} -> ${c.answer}`).join(" | ")}`);

  return { text: lines.join("\n"), level, language, hardSeason, memoryPaused };
}
