// F16 · the business identity: name, type, address, CAC, TIN, bank (display only), socials, logo.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, cleanText, notReady, saveFailed, unauthorized } from "@/lib/planning/server";
import { getActiveBusinessId } from "@/lib/business";

const SOCIALS = ["instagram", "facebook", "x", "tiktok", "whatsapp", "website"] as const;
const NEW_COLUMNS = ["logo_url", "address", "cac_number", "tin", "bank_display", "socials"];
const isMissingColumn = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42703" || e.code === "PGRST204" || /column .* does not exist|schema cache/i.test(e.message ?? ""));

export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const id = await getActiveBusinessId(supabase, user.id);
  if (!id) return NextResponse.json({ success: true, data: null });
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error) return NextResponse.json({ success: false, error: "Could not load your business." }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const id = await getActiveBusinessId(supabase, user.id);
  if (!id) return bad("Set up your business first.");
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const u: Record<string, unknown> = {};
  if (b.business_name !== undefined) { const n = cleanText(b.business_name, 80); if (!n) return bad("Your business needs a name."); u.business_name = n; }
  for (const [k, max] of [["address", 200], ["cac_number", 30], ["tin", 30], ["bank_display", 120]] as const) if (b[k] !== undefined) u[k] = cleanText(b[k], max) || null;
  if (typeof b.logo_url === "string") u.logo_url = /^https:\/\//.test(b.logo_url) ? b.logo_url.slice(0, 500) : null;
  if (b.socials && typeof b.socials === "object") {
    const s = b.socials as Record<string, unknown>;
    u.socials = Object.fromEntries(SOCIALS.map((k) => [k, cleanText(s[k], 100)]).filter(([, v]) => v));
  }
  if (!Object.keys(u).length) return bad("Nothing to save.");

  const { data, error } = await supabase.from("businesses").update(u).eq("id", id).eq("user_id", user.id).select("*").single();
  if (isMissingColumn(error)) {
    // Migration 027 isn't live yet. A name change still goes through; the new fields wait.
    const onlyNew = Object.keys(u).every((k) => NEW_COLUMNS.includes(k));
    if (onlyNew) return notReady();
    const fb = await supabase.from("businesses").update({ business_name: u.business_name }).eq("id", id).eq("user_id", user.id).select("*").single();
    return fb.error ? saveFailed() : NextResponse.json({ success: true, data: fb.data, partial: true });
  }
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data });
}
