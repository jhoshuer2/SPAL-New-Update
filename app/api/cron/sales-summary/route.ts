import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCron, allSubscriptions, sendToUsers } from "@/lib/push/send";
import { formatCurrency } from "@/lib/utils/currency";

// Daily sales summary — "You made ₦X from N sales today".
export async function GET(req: NextRequest) {
  if (!assertCron(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subs = await allSubscriptions();
  if (!subs.length) return NextResponse.json({ sent: 0 });

  const today = new Date().toISOString().slice(0, 10);
  const { data: rows } = await createAdminClient()
    .from("records")
    .select("user_id, amount")
    .eq("type", "sale")
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`);

  const agg = new Map<string, { sum: number; count: number }>();
  (rows ?? []).forEach((r) => {
    const a = agg.get(r.user_id) ?? { sum: 0, count: 0 };
    a.sum += Number(r.amount); a.count += 1;
    agg.set(r.user_id, a);
  });

  const sent = await sendToUsers(subs, (uid) => {
    const a = agg.get(uid);
    if (!a || a.sum <= 0) return null; // nothing to summarise
    return {
      title: "Today's sales",
      body: `You made ${formatCurrency(a.sum)} from ${a.count} sale${a.count !== 1 ? "s" : ""} today.`,
      url: "/records",
      tag: "sales-summary",
    };
  });

  return NextResponse.json({ sent });
}
