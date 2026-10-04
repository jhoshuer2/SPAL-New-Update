// Scheduled reminders (spec §12): debts due, the weekly launch nudge, and the daily check-in prompt.
//   ?job=morning  (06:00 UTC = 07:00 Lagos): debt_due, launch_task (Mondays)
//   ?job=evening  (17:00 UTC = 18:00 Lagos): checkin_daily
// Each notification respects the user's switches, quiet hours and hard season inside notify().
import { NextRequest, NextResponse } from "next/server";
import { assertCron } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { checkinDue, debtReminder, lagosDate, lagosDow } from "@/lib/engine/notify";
import { formatCurrency } from "@/lib/utils/currency";
import { launchProgress, type Week } from "@/lib/engine/planning";

const MAX_PER_USER = 3;

export async function GET(req: NextRequest) {
  if (!assertCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const job = new URL(req.url).searchParams.get("job");
  const admin = createAdminClient();
  const now = new Date();
  const today = lagosDate(now);
  let sent = 0;

  if (job === "morning") {
    // Debts: owed to me (sale records) and I owe (payables), due tomorrow or one day overdue
    const from = new Date(Date.parse(today) - 86_400_000).toISOString().slice(0, 10), to = new Date(Date.parse(today) + 86_400_000).toISOString().slice(0, 10);
    const perUser = new Map<string, number>();
    const owed = await admin.from("records").select("user_id, customer_name, amount, due_on").eq("type", "sale").eq("payment_status", "owing").gte("due_on", from).lte("due_on", to).limit(1000);
    for (const r of owed.data ?? []) {
      const when = debtReminder(r.due_on as string, today); if (!when) continue;
      const n = perUser.get(r.user_id) ?? 0; if (n >= MAX_PER_USER) continue; perUser.set(r.user_id, n + 1);
      await notify(r.user_id, "debt_due", { when, name: r.customer_name ?? undefined, amount: formatCurrency(Number(r.amount)) }); sent++;
    }
    const owe = await admin.from("payables").select("user_id, counterparty_name, amount_kobo, paid_kobo, due_on").eq("status", "open").is("deleted_at", null).gte("due_on", from).lte("due_on", to).limit(1000);
    for (const r of owe.data ?? []) {
      const when = debtReminder(r.due_on as string, today); if (!when) continue;
      const n = perUser.get(r.user_id) ?? 0; if (n >= MAX_PER_USER) continue; perUser.set(r.user_id, n + 1);
      await notify(r.user_id, "debt_due", { when, name: r.counterparty_name, amount: formatCurrency((Number(r.amount_kobo) - Number(r.paid_kobo)) / 100) }); sent++;
    }
    // Launch plan: on Mondays, this week's first open task
    if (lagosDow(now) === 1) {
      const plans = await admin.from("launch_plans").select("user_id, weeks").limit(1000);
      for (const p of plans.data ?? []) {
        const weeks = (p.weeks ?? []) as Week[];
        if (launchProgress(weeks).pct >= 100) continue;
        const w = weeks.find((x) => x.tasks.some((t) => !t.done)); const task = w?.tasks.find((t) => !t.done);
        if (task) { await notify(p.user_id, "launch_task", { title: task.text }); sent++; }
      }
    }
  } else if (job === "evening") {
    const users = await admin.from("users").select("*").not("onboarding_completed_at", "is", null).limit(2000);
    const startOfDay = new Date(`${today}T00:00:00+01:00`).toISOString();
    const done = await admin.from("checkins").select("user_id").gte("answered_at", startOfDay);
    const answered = new Set((done.data ?? []).map((c) => c.user_id as string));
    for (const u of (users.data ?? []) as { id: string; display_name?: string; checkin_frequency?: string; hard_season?: boolean }[]) {
      if (answered.has(u.id) || !checkinDue(u.checkin_frequency, now, !!u.hard_season)) continue;
      await notify(u.id, "checkin_daily", { name: u.display_name }); sent++;
    }
  } else {
    return NextResponse.json({ error: "job must be morning or evening" }, { status: 400 });
  }
  console.log(`[reminders] job=${job} sent=${sent}`); // counts only
  return NextResponse.json({ success: true, sent });
}
