import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Monday of the current week (ISO)
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

const CHALLENGE_POOL = [
  {
    type: "total_records",
    label: "Record at least 10 transactions this week",
    target: 10,
  },
  {
    type: "daily_streak",
    label: "Record something every day for 7 days",
    target: 7,
  },
  {
    type: "total_profit_days",
    label: "Make a profit for 5 days in a row",
    target: 5,
  },
];

// GET /api/challenges — get or create the current week's challenge
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const weekStart = getWeekStart();

    // Try fetching existing challenge
    const { data: existing } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Create new challenge for this week (rotate based on week number)
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const challenge = CHALLENGE_POOL[weekNum % CHALLENGE_POOL.length];

    const { data: created, error } = await supabase
      .from("user_challenges")
      .insert({
        user_id: user.id,
        week_start: weekStart,
        challenge_type: challenge.type,
        challenge_label: challenge.label,
        target: challenge.target,
        current_progress: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error("GET /api/challenges", err);
    return NextResponse.json({ success: false, error: "Failed to fetch challenge" }, { status: 500 });
  }
}
