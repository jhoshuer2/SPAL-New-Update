import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserBadges } from "@/lib/gamification/badges";

// GET /api/badges — get all badges with earned status for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const badges = await getUserBadges(supabase, user.id);
    return NextResponse.json({ success: true, data: badges });
  } catch (err) {
    console.error("GET /api/badges", err);
    return NextResponse.json({ success: false, error: "Failed to fetch badges" }, { status: 500 });
  }
}
