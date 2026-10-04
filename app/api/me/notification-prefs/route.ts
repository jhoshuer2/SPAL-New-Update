// L05 · what reaches you: a switch per category, quiet hours (Africa/Lagos), amounts on lock screen.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, failed, notLive, unauthorized } from "@/lib/community/server";
import { CATEGORIES, type Category } from "@/lib/engine/notify";

const hhmm = (v: unknown) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { data, error } = await supabase.from("notification_prefs").select("category, enabled, quiet_start, quiet_end").eq("user_id", user.id);
  const rows = notLive(error) ? [] : data ?? [];
  const by = new Map(rows.map((r) => [r.category as Category, r]));
  const first = rows[0];
  return NextResponse.json({ success: true, data: {
    categories: Object.fromEntries(CATEGORIES.map((c) => [c.key, by.get(c.key)?.enabled ?? true])),
    quiet_start: String(first?.quiet_start ?? "21:00").slice(0, 5), quiet_end: String(first?.quiet_end ?? "07:00").slice(0, 5),
  } });
}

export async function PUT(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { categories?: Record<string, boolean>; quiet_start?: string; quiet_end?: string };
  if (!hhmm(b.quiet_start) || !hhmm(b.quiet_end)) return bad("Pick valid quiet hours.");
  const rows = CATEGORIES.map((c) => ({ user_id: user.id, category: c.key, enabled: b.categories?.[c.key] !== false, quiet_start: b.quiet_start, quiet_end: b.quiet_end }));
  const { error } = await supabase.from("notification_prefs").upsert(rows, { onConflict: "user_id,category" });
  if (notLive(error)) return NextResponse.json({ success: false, error: "These settings are being set up. Please try again soon.", pending: true }, { status: 503 });
  return error ? failed("Could not save. Please try again.") : NextResponse.json({ success: true });
}
