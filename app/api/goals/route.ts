/**
 * GET  /api/goals — returns the user's goals with live progress computed from records
 * POST /api/goals — upsert a goal target  { goal_type, target_amount }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusinessId } from "@/lib/business";

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOf(unit: "day" | "week" | "month" | "year"): string {
  const now = new Date();
  if (unit === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (unit === "week") {
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff).toISOString();
  }
  if (unit === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  // year
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const bizId = await getActiveBusinessId(supabase, user.id);

    // 1. Fetch user's saved goals
    let goalsQuery = supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);
    if (bizId) goalsQuery = goalsQuery.eq("business_id", bizId);
    const { data: goals } = await goalsQuery;

    // 2. Compute current progress for each goal type from records
    let dayQ   = supabase.from("records").select("amount").eq("user_id", user.id).eq("type", "sale").gte("created_at", startOf("day"));
    let weekQ  = supabase.from("records").select("type, amount").eq("user_id", user.id).gte("created_at", startOf("week"));
    let monthQ = supabase.from("records").select("amount").eq("user_id", user.id).eq("type", "sale").gte("created_at", startOf("month"));
    let yearQ  = supabase.from("records").select("amount").eq("user_id", user.id).eq("type", "sale").gte("created_at", startOf("year"));
    if (bizId) { dayQ = dayQ.eq("business_id", bizId); weekQ = weekQ.eq("business_id", bizId); monthQ = monthQ.eq("business_id", bizId); yearQ = yearQ.eq("business_id", bizId); }

    const [dayRes, weekRes, monthRes, yearRes] = await Promise.all([dayQ, weekQ, monthQ, yearQ]);

    const dailySales   = (dayRes.data   ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const weeklyProfit = (weekRes.data  ?? []).reduce((s, r) => s + (r.type === "sale" ? Number(r.amount) : -Number(r.amount)), 0);
    const monthlySales = (monthRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const yearlySales  = (yearRes.data  ?? []).reduce((s, r) => s + Number(r.amount), 0);

    const currentMap: Record<string, number> = {
      daily_sales:    dailySales,
      weekly_profit:  weeklyProfit,
      monthly_sales:  monthlySales,
      yearly_revenue: yearlySales,
    };

    // 3. Merge saved goals with live progress
    const result = (goals ?? []).map((g) => ({
      id:           g.id,
      goal_type:    g.goal_type,
      target:       Number(g.target_amount),
      current:      Math.max(0, currentMap[g.goal_type] ?? 0),
      progress:     Math.min(100, Math.round((Math.max(0, currentMap[g.goal_type] ?? 0) / Number(g.target_amount)) * 100)),
      completed:    (currentMap[g.goal_type] ?? 0) >= Number(g.target_amount),
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("GET /api/goals", err);
    return NextResponse.json({ success: false, error: "Failed to load goals" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { goal_type, target_amount } = await req.json();

    const validTypes = ["daily_sales", "weekly_profit", "monthly_sales", "yearly_revenue"];
    if (!validTypes.includes(goal_type) || !target_amount || Number(target_amount) <= 0) {
      return NextResponse.json({ success: false, error: "Invalid goal data" }, { status: 400 });
    }

    const bizId = await getActiveBusinessId(supabase, user.id);

    const { data, error } = await supabase
      .from("user_goals")
      .upsert(
        { user_id: user.id, business_id: bizId ?? undefined, goal_type, target_amount: Number(target_amount), is_active: true },
        { onConflict: "user_id,goal_type" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/goals", err);
    return NextResponse.json({ success: false, error: "Failed to save goal" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { goal_type } = await req.json();
    await supabase
      .from("user_goals")
      .delete()
      .eq("user_id", user.id)
      .eq("goal_type", goal_type);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/goals", err);
    return NextResponse.json({ success: false, error: "Failed to delete goal" }, { status: 500 });
  }
}
