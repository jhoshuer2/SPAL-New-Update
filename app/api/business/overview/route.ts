// F01 · money at a glance. Aggregated on the server so the phone never sums thousands of rows.
import { NextRequest, NextResponse } from "next/server";
import { authed, unauthorized } from "@/lib/planning/server";
import { getActiveBusinessId } from "@/lib/business";
import { rangeFor, spalComment, summarize, type Period, type Row } from "@/lib/engine/business";

const PERIODS: Period[] = ["today", "week", "month", "custom"];
const isDay = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const period = (PERIODS.includes(sp.get("period") as Period) ? sp.get("period") : "week") as Period;
  const start = sp.get("start"), end = sp.get("end");
  const today = new Date().toISOString().slice(0, 10);
  const range = rangeFor(period, today, period === "custom" && isDay(start) && isDay(end) ? { start, end } : undefined);
  if (range.days > 366) return NextResponse.json({ success: false, error: "Pick a range of a year or less." }, { status: 400 });

  const bizId = await getActiveBusinessId(supabase, user.id);
  let q = supabase.from("records").select("*").eq("user_id", user.id).gte("record_date", range.prevStart).lte("record_date", range.end).limit(10000);
  if (bizId) q = q.eq("business_id", bizId);
  const [{ data, error }, profile] = await Promise.all([q, supabase.from("users").select("*").eq("id", user.id).single()]);
  if (error) return NextResponse.json({ success: false, error: "Could not load your numbers." }, { status: 500 });

  const rows = (data ?? []) as Row[];
  const cur = summarize(rows, range.start, range.end);
  const prev = summarize(rows, range.prevStart, range.prevEnd);
  const hardSeason = !!(profile.data as { hard_season?: boolean } | null)?.hard_season;
  return NextResponse.json({
    success: true,
    data: { period, range, today, summary: cur, previous: { moneyIn: prev.moneyIn, moneyOut: prev.moneyOut, profit: prev.profit }, comment: spalComment(cur, prev, period, hardSeason) },
  });
}
