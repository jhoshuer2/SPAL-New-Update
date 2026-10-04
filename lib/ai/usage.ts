// Per-user daily AI budget (spec §9.1). Writes use the service role: clients cannot write ai_usage.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Usage } from "./claude";

/** Tokens per user per day. Spec §19 #5 is open, so this is a configurable default. */
export const dailyBudget = () => Number(process.env.SPAL_DAILY_TOKEN_BUDGET) || 100_000;

export async function tokensUsedToday(userId: string): Promise<number> {
  try {
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const { data, error } = await createAdminClient().from("ai_usage").select("input_tokens, output_tokens").eq("user_id", userId).gte("created_at", since.toISOString()).limit(1000);
    if (error) return 0; // table not live yet: never block users
    return (data ?? []).reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);
  } catch { return 0; }
}

export async function overBudget(userId: string): Promise<boolean> {
  return (await tokensUsedToday(userId)) >= dailyBudget();
}

export async function recordUsage(userId: string, fn: string, u: Usage): Promise<void> {
  try { await createAdminClient().from("ai_usage").insert({ user_id: userId, function: fn, input_tokens: u.input, output_tokens: u.output }); } catch { /* best effort */ }
}

export const LIMIT_MESSAGE = "You've used a lot of Spal's thinking time today, so I need a short rest. I'll be back with you tomorrow. Your records and journey are all still here.";
