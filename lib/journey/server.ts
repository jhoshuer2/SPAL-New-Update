// Server-side journey loader. Reads milestones + state, lazily completes data-driven milestones
// from the user's records, and reports whether the new tables exist yet (migration 026).
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateRule, levelProgress, levelUpReady, type MilestoneState, type MilestoneDef, type LevelProgress } from "@/lib/engine/milestones";
import type { Level } from "@/lib/engine/placement";
import { notify } from "@/lib/notify";

export type JourneyData = {
  ready: true;
  level: Level;
  onboardingDone: boolean;
  beginChoice: string | null;
  daysSinceOnboarding: number;
  hardSeason: boolean;
  milestones: MilestoneState[];
  progress: LevelProgress;
  levelUp: boolean;
  /** ISO date each level was reached, from level_history. */
  reached: Record<number, string>;
  salesToday: number;
  hasEverRecorded: boolean;
};
export type JourneyNotReady = { ready: false; reason: "migration_pending" | "not_found" };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Postgres "undefined table/column" (42P01/42703) or PostgREST "not in schema cache" mean migration 026 has not run. */
const missing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === "42P01" || e.code === "42703" || e.code === "PGRST204" || e.code === "PGRST205" || /schema cache|does not exist/i.test(e.message ?? ""));

export async function loadJourney(supabase: SupabaseClient, userId: string): Promise<JourneyData | JourneyNotReady> {
  const { data: u, error: ue } = await supabase
    .from("users").select("current_level, onboarding_completed_at, hard_season").eq("id", userId).single();
  if (ue) return { ready: false, reason: missing(ue) ? "migration_pending" : "not_found" };

  const level = (u?.current_level ?? 0) as Level;

  const [defsRes, statesRes, histRes, respRes] = await Promise.all([
    supabase.from("milestones").select("key, level, position, title, completion_type, data_rule, is_gateway, id"),
    supabase.from("user_milestones").select("milestone_id, status, completed_at").eq("user_id", userId),
    supabase.from("level_history").select("to_level, created_at").eq("user_id", userId).order("created_at"),
    supabase.from("onboarding_responses").select("begin_choice, completed_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (defsRes.error) return { ready: false, reason: missing(defsRes.error) ? "migration_pending" : "not_found" };

  const stateById = new Map((statesRes.data ?? []).map((s) => [s.milestone_id as string, s]));
  let milestones: MilestoneState[] = (defsRes.data ?? []).map((d) => {
    const s = stateById.get(d.id as string);
    // No row yet (e.g. a user who skipped onboarding): current level is in progress, earlier done, later locked.
    const status = (s?.status as MilestoneState["status"]) ?? (d.level === level ? "in_progress" : d.level < level ? "done" : "locked");
    return { ...(d as unknown as MilestoneDef), status, completed_at: (s?.completed_at as string | null) ?? null };
  });

  // Records snapshot for data rules (cap the window; first_sale uses a head count).
  const since = isoDay(new Date(Date.now() - 130 * 86_400_000));
  const today = isoDay(new Date());
  const [recRes, saleCount, todaySales] = await Promise.all([
    supabase.from("records").select("record_date").eq("user_id", userId).gte("record_date", since).limit(5000),
    supabase.from("records").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "sale"),
    supabase.from("records").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "sale").eq("record_date", today),
  ]);
  const recordDays = [...new Set((recRes.data ?? []).map((r) => r.record_date as string))];
  const ctx = { hasSale: (saleCount.count ?? 0) > 0, recordDays, today };

  // Lazily complete data-driven milestones for the current level that are now satisfied.
  const toComplete = milestones.filter((m) => m.level === level && m.status !== "done" && m.completion_type === "data" && m.data_rule && evaluateRule(m.data_rule.rule, ctx) === true);
  if (toComplete.length) {
    const now = new Date().toISOString();
    const idByKey = new Map((defsRes.data ?? []).map((d) => [d.key as string, d.id as string]));
    await supabase.from("user_milestones").upsert(
      toComplete.map((m) => ({ user_id: userId, milestone_id: idByKey.get(m.key)!, status: "done", completed_at: now, completed_by: "data" })),
      { onConflict: "user_id,milestone_id" },
    );
    await supabase.from("moments").insert(
      toComplete.map((m) => ({ user_id: userId, kind: "auto", type: m.key === "l0_first_sale" ? "first_sale" : "milestone", text: m.key === "l0_first_sale" ? "Made your first sale" : `Milestone done: ${m.title}`, occurred_on: today })),
    );
    for (const m of toComplete) {
      await notify(userId, "milestone_done", { title: m.title });
      if (m.is_gateway && level < 5) await notify(userId, "level_up_ready", { level: level + 1 });
    }
    milestones = milestones.map((m) => (toComplete.includes(m) ? { ...m, status: "done" as const, completed_at: now } : m));
  }

  const reached: Record<number, string> = {};
  for (const h of histRes.data ?? []) if (!(h.to_level in reached)) reached[h.to_level] = h.created_at as string;

  const doneAt = respRes.data?.completed_at ?? u?.onboarding_completed_at ?? null;
  return {
    ready: true,
    level,
    onboardingDone: !!u?.onboarding_completed_at,
    beginChoice: (respRes.data?.begin_choice as string | null) ?? null,
    daysSinceOnboarding: doneAt ? Math.floor((Date.now() - Date.parse(doneAt)) / 86_400_000) : 999,
    hardSeason: !!u?.hard_season,
    milestones,
    progress: levelProgress(milestones, level),
    levelUp: levelUpReady(milestones, level),
    reached,
    salesToday: todaySales.count ?? 0,
    hasEverRecorded: ctx.hasSale || recordDays.length > 0,
  };
}
