/**
 * SPAL Paywall — subscription check utility
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check whether a user has an active Pro subscription.
 * Uses the denormalised `users.subscription_plan` field for speed;
 * falls back to the subscriptions table for accuracy.
 */
export async function isProUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  // Fast path: denormalised field
  const { data: user } = await supabase
    .from("users")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  if (user?.subscription_plan === "pro") {
    // Verify it hasn't expired
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .single();

    if (!sub) return false;
    if (sub.status !== "active") return false;
    if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false;
    return true;
  }

  return false;
}

/**
 * Get full subscription info for display purposes.
 */
export async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, billing_cycle, status, current_period_end")
    .eq("user_id", userId)
    .single();

  return data ?? { plan: "free", billing_cycle: null, status: "active", current_period_end: null };
}
