import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDailyInsight } from "@/lib/openai/chat";
import { todayISO } from "@/lib/utils/dates";
import { getActiveBusinessId } from "@/lib/business";

// GET /api/ai/daily-insight — always computes fresh totals; only caches AI text
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const date = new URL(req.url).searchParams.get("date") || todayISO();

    const bizId = await getActiveBusinessId(supabase, user.id);

    // ── Always fetch live records for fresh totals ─────────────────────────────
    let recordsQuery = supabase
      .from("records")
      .select("type, amount, description, category, payment_status")
      .eq("user_id", user.id)
      .eq("record_date", date);
    if (bizId) recordsQuery = recordsQuery.eq("business_id", bizId);
    const { data: records } = await recordsQuery;

    const totalSales    = (records ?? []).filter(r => r.type === "sale")
                           .reduce((s, r) => s + Number(r.amount), 0);
    const totalExpenses = (records ?? []).filter(r => r.type === "expense")
                           .reduce((s, r) => s + Number(r.amount), 0);
    const owed          = (records ?? []).filter(r => r.type === "sale" && r.payment_status === "owing")
                           .reduce((s, r) => s + Number(r.amount), 0);
    // Cash-basis profit: money still owed isn't profit until it's actually paid
    const profit        = totalSales - totalExpenses - owed;

    // ── Reuse cached AI text if the numbers haven't changed ───────────────────
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("daily_summaries")
      .select("total_sales, total_expenses, ai_insight, ai_message")
      .eq("user_id", user.id)
      .eq("summary_date", date)
      .maybeSingle();

    let ai_insight = existing?.ai_insight ?? null;
    let ai_message = existing?.ai_message ?? null;

    // Regenerate AI text if totals changed or if there are records but no insight yet
    const numbersChanged =
      existing &&
      (Number(existing.total_sales) !== totalSales ||
       Number(existing.total_expenses) !== totalExpenses);

    const needsInsight = (records ?? []).length > 0 && (!ai_insight || numbersChanged);

    if (needsInsight) {
      const { data: userData } = await supabase
        .from("users")
        .select("business_type, full_name, currency")
        .eq("id", user.id)
        .single();

      // Pull business_goals from the active business row
      let businessGoals: string[] = [];
      if (bizId) {
        const { data: bizData } = await supabase
          .from("businesses")
          .select("business_goals")
          .eq("id", bizId)
          .single();
        businessGoals = bizData?.business_goals ?? [];
      }

      try {
        const result = await generateDailyInsight({
          totalSales,
          totalExpenses,
          profit,
          records:      records ?? [],
          businessType: userData?.business_type ?? "other",
          currency:     userData?.currency      ?? "NGN",
          businessGoals,
        });
        ai_insight = result.insight;
        ai_message = result.message;
      } catch (e) {
        console.error("AI insight generation failed:", e);
      }
    }

    // ── Upsert with fresh numbers (always) ────────────────────────────────────
    const { data: summary, error } = await admin
      .from("daily_summaries")
      .upsert(
        {
          user_id:        user.id,
          business_id:    bizId ?? undefined,
          summary_date:   date,
          total_sales:    totalSales,
          total_expenses: totalExpenses,
          profit,
          ai_insight,
          ai_message,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: "user_id,summary_date" }
      )
      .select()
      .single();

    if (error) throw error;

    // `owed` is computed live (no column) — merge it into the response
    return NextResponse.json({ success: true, data: { ...summary, owed } });
  } catch (err) {
    console.error("GET /api/ai/daily-insight", err);
    return NextResponse.json({ success: false, error: "Failed to generate insight" }, { status: 500 });
  }
}
