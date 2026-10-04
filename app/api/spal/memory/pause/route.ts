// "Pause learning": extraction stops; existing facts stay until deleted (spec §9.5).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { paused } = (await req.json().catch(() => ({}))) as { paused?: boolean };
  const { error } = await supabase.from("users").update({ memory_paused: !!paused }).eq("id", user.id);
  if (error) return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true, data: { paused: !!paused } });
}
