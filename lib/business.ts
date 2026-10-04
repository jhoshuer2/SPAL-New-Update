import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the active business_id for the given user.
 * Returns null if the migration hasn't run yet (safe — callers skip the filter).
 */
export async function getActiveBusinessId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("active_business_id")
    .eq("id", userId)
    .single();
  return data?.active_business_id ?? null;
}
