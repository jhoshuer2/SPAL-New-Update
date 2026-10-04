import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCron, allSubscriptions, sendToUsers } from "@/lib/push/send";

// Rotating nudges — different each call so users don't tune them out
const NUDGES = [
  { title: "Log your sales today 💰", body: "Tap to record what you made today — takes 10 seconds.", url: "/records/add-sale/voice" },
  { title: "Any expenses today?", body: "Quick — what did you spend money on? Log it now.", url: "/records/add-expense/voice" },
  { title: "Check in with SPAL", body: "How's business going? Ask SPAL anything about your numbers.", url: "/home" },
  { title: "Your daily summary is waiting", body: "See how your business did today.", url: "/home" },
  { title: "Don't forget to log today", body: "A few seconds now keeps your records accurate.", url: "/records" },
  { title: "How did sales go today?", body: "Record it while it's fresh.", url: "/records/add-sale/voice" },
];

// Nudges anyone who hasn't logged a record today — skipped for anyone already active.
export async function GET(req: NextRequest) {
  if (!assertCron(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subs = await allSubscriptions();
  if (!subs.length) return NextResponse.json({ sent: 0 });

  const today = new Date().toISOString().slice(0, 10);
  const { data: loggedToday } = await createAdminClient()
    .from("records")
    .select("user_id")
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`);
  const loggedIds = new Set((loggedToday ?? []).map((r) => r.user_id));

  // Pick a nudge deterministically based on hour so everyone gets the same message.
  const nudge = NUDGES[new Date().getHours() % NUDGES.length];

  const sent = await sendToUsers(subs, (uid) =>
    loggedIds.has(uid) ? null : { ...nudge, tag: "reminder" }
  );

  return NextResponse.json({ sent });
}
