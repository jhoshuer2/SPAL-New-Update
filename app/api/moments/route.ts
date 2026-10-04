// GET /api/moments — timeline (D05). POST — add a moment (D06). Moments are private; sharing is a separate act.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPES = ["win", "struggle", "lesson", "decision"] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("moments").select("id, kind, type, text, occurred_on, created_at")
    .eq("user_id", user.id).is("deleted_at", null).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ success: true, data: [], pending: true });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as { type?: string; text?: string; occurredOn?: string; clientId?: string };
  const text = b.text?.trim().slice(0, 2000);
  if (!text || !TYPES.includes(b.type as (typeof TYPES)[number])) {
    return NextResponse.json({ success: false, error: "Write a few words and pick a tag." }, { status: 400 });
  }
  const occurred = b.occurredOn && /^\d{4}-\d{2}-\d{2}$/.test(b.occurredOn) ? b.occurredOn : new Date().toISOString().slice(0, 10);
  const { data: profile } = await supabase.from("users").select("active_business_id").eq("id", user.id).single();
  const { data, error } = await supabase.from("moments")
    .insert({ user_id: user.id, business_id: profile?.active_business_id ?? null, kind: "manual", type: b.type, text, occurred_on: occurred, client_id: b.clientId ?? null })
    .select("id").single();
  if (error) return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
