import { NextRequest, NextResponse } from "next/server";
import { assertCron, allSubscriptions, sendToUsers } from "@/lib/push/send";

// Rotating business quotes / tips — one per run, encouraging and jargon-free.
const QUOTES = [
  "Small daily sales add up to big money. Keep logging.",
  "Know your best seller, and sell more of it.",
  "Money you can't track is money you can lose. Record every sale.",
  "Profit is what's left after costs. Watch both, not just sales.",
  "A little saved each day becomes your growth fund.",
  "Serve one more happy customer today than you did yesterday.",
  "Cheap stock that doesn't sell is money sitting still.",
  "Ask for the money owed to you. It's your money.",
  "Your busiest hour is your goldmine. Be ready for it.",
  "Steady beats big. Show up and record every day.",
];

export async function GET(req: NextRequest) {
  if (!assertCron(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subs = await allSubscriptions();
  if (!subs.length) return NextResponse.json({ sent: 0 });

  // Rotate by day so everyone gets the same quote, different each day.
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const sent = await sendToUsers(subs, () => ({
    title: "SPAL tip of the day",
    body: quote,
    url: "/ask",
    tag: "quote",
  }));

  return NextResponse.json({ sent });
}
