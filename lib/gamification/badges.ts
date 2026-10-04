/**
 * SPAL Gamification — Badge check and award logic
 * Call checkAndAwardBadges() after any action that might unlock a badge.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
}

export type BadgeTrigger =
  | "record_saved"
  | "advisor_chat"
  | "challenge_complete"
  | "goal_set";

export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string,
  trigger: BadgeTrigger,
  context?: {
    streakDays?: number;
    totalRecords?: number;
    totalSales?: number;
  }
): Promise<Badge[]> {
  const newlyEarned: Badge[] = [];

  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earned = new Set((existing ?? []).map((r: { badge_id: string }) => r.badge_id));
  const candidates: string[] = [];

  if (trigger === "record_saved") {
    if (!earned.has("first_step")  && (context?.totalRecords ?? 0) >= 1)   candidates.push("first_step");
    if (!earned.has("money_maker") && (context?.totalSales   ?? 0) >= 10)  candidates.push("money_maker");
    if (!earned.has("century")     && (context?.totalRecords ?? 0) >= 100) candidates.push("century");
    if (!earned.has("streak_7")    && (context?.streakDays   ?? 0) >= 7)   candidates.push("streak_7");
    if (!earned.has("streak_30")   && (context?.streakDays   ?? 0) >= 30)  candidates.push("streak_30");
  }
  if (trigger === "advisor_chat"       && !earned.has("quick_learner")) candidates.push("quick_learner");
  if (trigger === "challenge_complete" && !earned.has("challenge_1"))   candidates.push("challenge_1");
  if (trigger === "goal_set"           && !earned.has("goal_setter"))   candidates.push("goal_setter");

  if (candidates.length === 0) return [];

  const { data: badgeMeta } = await supabase
    .from("badges")
    .select("id, name, emoji, description, category")
    .in("id", candidates);

  if (!badgeMeta || badgeMeta.length === 0) return [];

  const inserts = badgeMeta.map((b: Badge) => ({ user_id: userId, badge_id: b.id }));
  await supabase.from("user_badges").upsert(inserts, { onConflict: "user_id,badge_id" });

  // Create an in-app notification for each newly unlocked badge
  const notifInserts = (badgeMeta as Badge[]).map(b => ({
    user_id: userId,
    type:    "badge_unlocked",
    title:   `${b.emoji} Badge unlocked — ${b.name}`,
    body:    b.description,
    icon:    b.emoji,
    data:    { badge_id: b.id },
  }));
  await supabase.from("notifications").insert(notifInserts);

  return badgeMeta as Badge[];
}

export async function getUserBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<Badge & { earned_at: string | null }>> {
  const [{ data: all }, { data: earnedRows }] = await Promise.all([
    supabase.from("badges").select("id, name, emoji, description, category"),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
  ]);

  const earnedMap = new Map(
    (earnedRows ?? []).map((r: { badge_id: string; earned_at: string }) => [r.badge_id, r.earned_at])
  );

  return (all ?? []).map((b: Badge) => ({
    ...b,
    earned_at: earnedMap.get(b.id) ?? null,
  }));
}

// Helper: create a one-off notification (milestone, app update, etc.)
export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    type:  "milestone" | "app_update" | "streak" | "coach" | string;
    title: string;
    body:  string;
    icon?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: userId,
    type:    payload.type,
    title:   payload.title,
    body:    payload.body,
    icon:    payload.icon ?? null,
    data:    payload.data ?? {},
  });
}
