// F13 · pay (part of) something you owe. DELETE on the parent removes a mistaken entry (soft delete).
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, saveFailed, unauthorized } from "@/lib/planning/server";
import { applyPayment } from "@/lib/engine/business";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { amount_kobo } = (await req.json().catch(() => ({}))) as { amount_kobo?: number };
  const { data: p } = await supabase.from("payables").select("amount_kobo, paid_kobo, status").eq("id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!p || p.status !== "open") return NextResponse.json({ success: false, error: "That isn't open." }, { status: 404 });
  const remaining = Number(p.amount_kobo) - Number(p.paid_kobo);
  const r = applyPayment(remaining, amount_kobo as number);
  if (!r) return bad("Enter an amount up to what's left to pay.");
  const { error } = await supabase.from("payables").update({ paid_kobo: Number(p.paid_kobo) + r.applied, status: r.settled ? "paid" : "open" }).eq("id", id).eq("user_id", user.id);
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { remaining_kobo: remaining - r.applied, settled: r.settled } });
}
