// F13 · record a (part) payment against a credit sale. Fully paid flips the sale to paid.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, missingTable, saveFailed, unauthorized } from "@/lib/planning/server";
import { applyPayment } from "@/lib/engine/business";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { amount_kobo } = (await req.json().catch(() => ({}))) as { amount_kobo?: number };

  const { data: rec } = await supabase.from("records").select("id, amount, payment_status").eq("id", id).eq("user_id", user.id).eq("type", "sale").single();
  if (!rec || rec.payment_status !== "owing") return NextResponse.json({ success: false, error: "That debt isn't open." }, { status: 404 });

  const total = Math.round(Number(rec.amount) * 100);
  const prior = await supabase.from("debt_payments").select("amount_kobo").eq("record_id", id).eq("user_id", user.id);
  const tableMissing = missingTable(prior.error);
  const paid = tableMissing ? 0 : (prior.data ?? []).reduce((s, p) => s + Number(p.amount_kobo), 0);
  const remaining = total - paid;

  const r = applyPayment(remaining, amount_kobo as number);
  if (!r) return bad(`Enter an amount up to what's left to pay.`);

  if (tableMissing) {
    // Part payments need migration 027. Settling in full still works on the legacy model.
    if (!r.settled) return NextResponse.json({ success: false, error: "Part payments are being set up. You can mark it fully paid for now.", pending: true }, { status: 503 });
  } else {
    const ins = await supabase.from("debt_payments").insert({ user_id: user.id, record_id: id, amount_kobo: r.applied });
    if (ins.error) return saveFailed();
  }
  if (r.settled) {
    const upd = await supabase.from("records").update({ payment_status: "paid" }).eq("id", id).eq("user_id", user.id);
    if (upd.error) return saveFailed();
  }
  return NextResponse.json({ success: true, data: { remaining_kobo: remaining - r.applied, settled: r.settled } });
}
