// F13 · "I owe": add money you owe a supplier or someone else.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, cleanText, missingTable, notReady, okKobo, saveFailed, unauthorized } from "@/lib/planning/server";
import { getActiveBusinessId } from "@/lib/business";

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { counterparty_name?: string; amount_kobo?: number; due_on?: string; note?: string; client_id?: string };
  const name = cleanText(b.counterparty_name, 60);
  if (!name) return bad("Who do you owe?");
  if (!okKobo(b.amount_kobo) || b.amount_kobo <= 0) return bad("Enter how much you owe.");
  const bizId = await getActiveBusinessId(supabase, user.id);
  const { data, error } = await supabase.from("payables").insert({
    user_id: user.id, business_id: bizId, counterparty_name: name, amount_kobo: b.amount_kobo,
    due_on: /^\d{4}-\d{2}-\d{2}$/.test(b.due_on ?? "") ? b.due_on : null, note: cleanText(b.note, 200) || null, client_id: b.client_id ?? null,
  }).select("id").single();
  if (missingTable(error)) return notReady();
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data });
}
