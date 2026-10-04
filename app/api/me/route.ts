// L01/L02/L03 · your own profile and privacy settings.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, failed, unauthorized } from "@/lib/community/server";
import { LEGACY_BUSINESS_TYPES } from "@/lib/engine/me";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (error || !data) return failed("Could not load your profile.");
  const d = data as Record<string, unknown>;
  // Only what the Me screens need. Never the whole row.
  return NextResponse.json({ success: true, data: {
    id: user.id, email: user.email ?? null,
    full_name: d.full_name ?? null, display_name: d.display_name ?? null, bio: d.bio ?? null, avatar_url: d.avatar_url ?? null,
    business_name: d.business_name ?? null, business_type: d.business_type ?? null, state: d.state ?? null, city: d.city ?? null,
    current_level: d.current_level ?? 0, language: d.language ?? "en",
    profile_visibility: d.profile_visibility ?? "hidden", anonymous_default: !!d.anonymous_default, memory_paused: !!d.memory_paused,
    show_amounts_in_notifications: !!d.show_amounts_in_notifications,
    checkin_frequency: d.checkin_frequency ?? "few_weekly", checkin_time: String(d.checkin_time ?? "18:00").slice(0, 5),
    hard_season: !!d.hard_season,
  } });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const u: Record<string, unknown> = {};

  if (b.display_name !== undefined) { const n = clean(b.display_name, 40); if (!n) return bad("Your name can't be empty."); u.display_name = n; }
  if (b.bio !== undefined) u.bio = clean(b.bio, 200) || null;
  if (b.state !== undefined) u.state = clean(b.state, 40) || null;
  if (b.city !== undefined) u.city = clean(b.city, 60) || null;
  if (b.avatar_url !== undefined) u.avatar_url = typeof b.avatar_url === "string" && /^https:\/\//.test(b.avatar_url) ? b.avatar_url.slice(0, 500) : null;
  if (b.business_type !== undefined) { if (!LEGACY_BUSINESS_TYPES.includes(b.business_type as never)) return bad("Pick a business type from the list."); u.business_type = b.business_type; }
  if (b.language !== undefined) { if (b.language !== "en" && b.language !== "pcm") return bad("Pick English or Pidgin."); u.language = b.language; }
  if (b.profile_visibility !== undefined) { if (!["public", "hidden"].includes(b.profile_visibility as string)) return bad("Choose public or hidden."); u.profile_visibility = b.profile_visibility; }
  for (const k of ["anonymous_default", "memory_paused", "show_amounts_in_notifications"] as const) if (b[k] !== undefined) u[k] = b[k] === true;
  if (b.checkin_frequency !== undefined) { if (!["daily", "few_weekly", "weekly"].includes(b.checkin_frequency as string)) return bad("Pick how often you'd like check-ins."); u.checkin_frequency = b.checkin_frequency; }
  if (b.checkin_time !== undefined) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(b.checkin_time))) return bad("Pick a valid time."); u.checkin_time = b.checkin_time; }
  if (!Object.keys(u).length) return bad("Nothing to save.");

  const { error } = await supabase.from("users").update(u).eq("id", user.id);
  if (error) return error.code === "42703" || error.code === "PGRST204" ? NextResponse.json({ success: false, error: "These settings are being set up. Please try again soon.", pending: true }, { status: 503 }) : failed("Could not save. Please try again.");
  return NextResponse.json({ success: true });
}
