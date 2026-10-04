// H07 · What Spal knows. GET lists every remembered fact plus the pause setting.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const [facts, profile] = await Promise.all([
    supabase.from("spal_memory").select("id, fact, category, source, created_at").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(300),
    supabase.from("users").select("*").eq("id", user.id).single(),
  ]);
  if (facts.error) return NextResponse.json({ success: true, data: { facts: [], paused: false, pending: true } });
  return NextResponse.json({ success: true, data: { facts: facts.data ?? [], paused: !!(profile.data as Record<string, unknown> | null)?.memory_paused } });
}
