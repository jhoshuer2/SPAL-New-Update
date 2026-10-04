// E04 · startup budget. Amounts arrive and are stored as whole kobo.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, cleanText, missingTable, notReady, okKobo, saveFailed, unauthorized } from "@/lib/planning/server";
import { budgetGap, type BudgetItem } from "@/lib/engine/planning";

export async function PUT(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { items?: Partial<BudgetItem>[]; available_kobo?: number };
  if (!okKobo(b.available_kobo)) return bad("Enter how much you have set aside (0 is fine).");
  const raw = (b.items ?? []).slice(0, 40);
  const items: BudgetItem[] = [];
  for (const i of raw) {
    const name = cleanText(i.name, 60);
    if (!name) continue;
    if (!okKobo(i.cost_kobo)) return bad(`Check the amount for "${name}".`);
    items.push({ id: cleanText(i.id, 40) || crypto.randomUUID(), name, cost_kobo: i.cost_kobo, have: !!i.have });
  }
  const { error } = await supabase.from("budgets").upsert({ user_id: user.id, items, available_kobo: b.available_kobo }, { onConflict: "user_id" });
  if (missingTable(error)) return notReady();
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { result: budgetGap(items, b.available_kobo) } });
}
