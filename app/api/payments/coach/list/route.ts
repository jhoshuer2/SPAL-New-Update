/**
 * GET /api/payments/coach/list
 *   Returns: { subscriptions: [...], payments: [...] }
 *
 * Used by /learn and /billing to render real subscription + receipt state.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [subsRes, payRes] = await Promise.all([
      supabase
        .from("coach_subscriptions")
        .select("coach_id, status, current_period_end, amount")
        .eq("user_id", user.id)
        .order("current_period_end", { ascending: false }),
      supabase
        .from("coach_payments")
        .select("id, coach_id, amount, status, paid_at, paystack_reference")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subsRes.data ?? [],
        payments:      payRes.data  ?? [],
      },
    });
  } catch (err) {
    console.error("GET /api/payments/coach/list", err);
    return NextResponse.json(
      { success: false, error: "Failed to load subscriptions." },
      { status: 500 }
    );
  }
}
