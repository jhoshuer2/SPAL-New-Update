import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCron, allSubscriptions, sendToUsers } from "@/lib/push/send";
import { formatCurrency } from "@/lib/utils/currency";

// Weekly insight summary — this week's sales vs expenses, in plain language.
export async function GET(req: NextRequest) {
  if (!assertCron(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subs = await allSubscriptions();
  if (!subs.length) return NextResponse.json({ sent: 0 });

  const since = new Date(); since.setDate(since.getDate() - 6);
  const { data: rows } = await createAdminClient()
    .from("records")
    .select("user_id, amount, type")
    .gte("created_at", `${since.toISOString().slice(0, 10)}T00:00:00Z`);

  const agg = new Map<string, { sales: number; expenses: number }>();
  (rows ?? []).forEach((r) => {
    const a = agg.get(r.user_id) ?? { sales: 0, expenses: 0 };
    if (r.type === "sale") a.sales += Number(r.amount); else a.expenses += Number(r.amount);
    agg.set(r.user_id, a);
  });

  const sent = await sendToUsers(subs, (uid) => {
    const a = agg.get(uid);
    if (!a || a.sales <= 0) return null;
    const profit = a.sales - a.expenses;
    const body = profit >= 0
      ? `You made ${formatCurrency(a.sales)} this week and kept ${formatCurrency(profit)}. See what's driving it.`
      : `You made ${formatCurrency(a.sales)} but spent more than that this week. Tap to see where it went.`;
    return { title: "Your week so far", body, url: "/insights", tag: "insight-summary" };
  });

  return NextResponse.json({ sent });
}
