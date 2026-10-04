// Shared helpers for community routes.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scanPrivate } from "@/lib/engine/privacy";

export async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
export const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
export const bad = (error: string, extra: object = {}) => NextResponse.json({ success: false, error, ...extra }, { status: 400 });
export const failed = (msg = "Something went wrong. Please try again.") => NextResponse.json({ success: false, error: msg }, { status: 500 });

/** Postgres/PostgREST "relation or column does not exist": migration 028 hasn't run yet. */
export const notLive = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "42P01" || e.code === "42703" || e.code === "PGRST205" || e.code === "PGRST204" || /schema cache|does not exist/i.test(e.message ?? ""));
export const pending = () => NextResponse.json({ success: false, error: "The community is opening soon. Please check back shortly.", pending: true }, { status: 503 });

/**
 * Private details in a draft. The author may still post after acknowledging; they are never surprised.
 * Returns a 422 response to send, or null when OK to continue.
 */
export function privacyGate(text: string, acknowledged: unknown) {
  const findings = scanPrivate(text);
  if (findings.length && acknowledged !== true) {
    return NextResponse.json({ success: false, code: "private_info", error: "This looks like it has private details.", findings }, { status: 422 });
  }
  return null;
}

/** The real author of a post or comment, resolved server-side only (used for notifications and blocking). Never returned to clients. */
export async function authorOf(table: "posts" | "comments", id: string): Promise<string | null> {
  const { data } = await createAdminClient().from(table).select("author_id").eq("id", id).maybeSingle();
  return (data?.author_id as string | undefined) ?? null;
}
