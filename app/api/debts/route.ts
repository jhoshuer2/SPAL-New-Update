// F13 · who owes you, and who you owe. "Owed to me" are sale records marked owing; "I owe" are payables.
import { NextResponse } from "next/server";
import { authed, missingTable, unauthorized } from "@/lib/planning/server";
import { getActiveBusinessId } from "@/lib/business";

export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const bizId = await getActiveBusinessId(supabase, user.id);

  let owing = supabase.from("records").select("*").eq("user_id", user.id).eq("type", "sale").eq("payment_status", "owing").order("record_date", { ascending: false }).limit(500);
  if (bizId) owing = owing.eq("business_id", bizId);
  const recs = await owing;
  if (recs.error) return NextResponse.json({ success: false, error: "Could not load debts." }, { status: 500 });

  const ids = (recs.data ?? []).map((r) => r.id as string);
  const paid = new Map<string, number>();
  if (ids.length) {
    const pay = await supabase.from("debt_payments").select("record_id, amount_kobo").in("record_id", ids);
    if (!pay.error) for (const p of pay.data ?? []) paid.set(p.record_id, (paid.get(p.record_id) ?? 0) + Number(p.amount_kobo));
  }
  const owedToMe = (recs.data ?? []).map((r) => {
    const amountKobo = Math.round(Number(r.amount) * 100);
    const paidKobo = Math.min(paid.get(r.id) ?? 0, amountKobo);
    return { id: r.id, customer: r.customer_name ?? "Customer", description: r.description, record_date: r.record_date, due_on: r.due_on ?? null, amount_kobo: amountKobo, paid_kobo: paidKobo, remaining_kobo: amountKobo - paidKobo };
  });

  const pay = await supabase.from("payables").select("id, counterparty_name, amount_kobo, paid_kobo, due_on, note").eq("user_id", user.id).eq("status", "open").is("deleted_at", null).order("due_on", { ascending: true, nullsFirst: false }).limit(500);
  const iOwe = missingTable(pay.error) ? [] : (pay.data ?? []).map((p) => ({ ...p, amount_kobo: Number(p.amount_kobo), paid_kobo: Number(p.paid_kobo), remaining_kobo: Number(p.amount_kobo) - Number(p.paid_kobo) }));

  const sum = (a: { remaining_kobo: number }[]) => a.reduce((s, x) => s + x.remaining_kobo, 0);
  return NextResponse.json({ success: true, data: { today: new Date().toISOString().slice(0, 10), owedToMe, iOwe, totals: { owedToMe: sum(owedToMe), iOwe: sum(iOwe) }, payablesReady: !missingTable(pay.error) } });
}
