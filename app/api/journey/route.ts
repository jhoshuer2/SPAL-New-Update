// GET /api/journey — everything D01/D02/C01 need in one round trip.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadJourney } from "@/lib/journey/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ success: true, data: await loadJourney(supabase, user.id) });
  } catch (err) {
    console.error("GET /api/journey", err);
    return NextResponse.json({ success: false, error: "Could not load your journey" }, { status: 500 });
  }
}
