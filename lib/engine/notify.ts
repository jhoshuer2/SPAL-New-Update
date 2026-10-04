// Notification rules (spec §12): copy, categories, quiet hours, hard season, and "no amounts on the lock screen".
export type Category = "spal" | "journey" | "community" | "reminders";
export type NotifKey = "checkin_daily" | "spal_nudge" | "milestone_done" | "level_up_ready" | "debt_due" | "launch_task" | "comment_reply" | "reaction_batch";

export type NotifData = { name?: string; title?: string; level?: number; amount?: string; count?: number; when?: "tomorrow" | "overdue"; postId?: string; week?: string };
type Def = { category: Category; copy: (d: NotifData, showAmounts: boolean) => { title: string; body: string }; link: (d: NotifData) => string };

export const NOTIFICATIONS: Record<NotifKey, Def> = {
  checkin_daily: { category: "spal", link: () => "/check-in", copy: (d) => ({ title: "Spal", body: `Quick one${d.name ? `, ${d.name}` : ""}: how did today go?` }) },
  spal_nudge: { category: "spal", link: () => "/home", copy: (d) => ({ title: "Spal", body: d.title ?? "I have a thought for your business today." }) },
  milestone_done: { category: "journey", link: () => "/journey", copy: (d) => ({ title: "Milestone done", body: d.title ?? "You completed a milestone." }) },
  level_up_ready: { category: "journey", link: () => "/level-up", copy: (d) => ({ title: "You're ready to level up", body: `You're ready for Level ${d.level ?? ""}`.trim() }) },
  debt_due: {
    category: "reminders", link: () => "/business/debts",
    copy: (d, show) => {
      const when = d.when === "overdue" ? "is overdue" : "is due tomorrow";
      return { title: "Payment reminder", body: show && d.amount && d.name ? `A payment of ${d.amount} from ${d.name} ${when}` : `A payment ${when}` };
    },
  },
  launch_task: { category: "reminders", link: () => "/business/planning/launch", copy: (d) => ({ title: "Launch plan", body: d.title ? `This week: ${d.title}` : "A task in your launch plan is due." }) },
  comment_reply: { category: "community", link: (d) => `/community/post/${d.postId ?? ""}`, copy: (d) => ({ title: "New reply", body: `${d.name ?? "Someone"} replied to your post` }) },
  reaction_batch: { category: "community", link: (d) => `/community/post/${d.postId ?? ""}`, copy: (d) => ({ title: "Your post", body: `${d.count ?? 1} ${(d.count ?? 1) === 1 ? "person" : "people"} cheered your post` }) },
};

export const CATEGORIES: { key: Category; label: string; hint: string }[] = [
  { key: "spal", label: "Spal", hint: "Check-ins and thoughtful nudges" },
  { key: "journey", label: "Journey", hint: "Milestones and level-ups" },
  { key: "community", label: "Community", hint: "Replies and cheers on your posts" },
  { key: "reminders", label: "Reminders", hint: "Payments due and launch tasks" },
];

/** Legacy notification types map onto the four spec categories. */
export function categoryOf(type: string, stored?: string | null): Category {
  if (stored && CATEGORIES.some((c) => c.key === stored)) return stored as Category;
  if (type in NOTIFICATIONS) return NOTIFICATIONS[type as NotifKey].category;
  if (/badge|milestone|streak|level/.test(type)) return "journey";
  if (/coach|ai|spal/.test(type)) return "spal";
  if (/comment|reaction|post|follow/.test(type)) return "community";
  if (/debt|reminder|due|payment/.test(type)) return "reminders";
  return "spal";
}

/** Minutes since midnight in Africa/Lagos (UTC+1, no daylight saving). */
export const lagosMinutes = (d: Date): number => { const t = new Date(d.getTime() + 3_600_000); return t.getUTCHours() * 60 + t.getUTCMinutes(); };
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };

/** Quiet hours may wrap past midnight (21:00 to 07:00). Start inclusive, end exclusive. */
export function isQuiet(now: Date, start = "21:00", end = "07:00"): boolean {
  const n = lagosMinutes(now), s = toMin(start), e = toMin(end);
  if (s === e) return false;
  return s < e ? n >= s && n < e : n >= s || n < e;
}

export type Prefs = { enabled: boolean; quiet_start?: string; quiet_end?: string };

/** Push (lock-screen) decision. The in-app copy in C04 is always kept, whatever this returns. */
export function shouldPush(o: { key: NotifKey; prefs?: Prefs; hardSeason: boolean; now: Date }): boolean {
  if (o.prefs && !o.prefs.enabled) return false;
  if (o.hardSeason && (o.key === "spal_nudge" || o.key === "reaction_batch")) return false; // fewer asks in a hard season
  return !isQuiet(o.now, o.prefs?.quiet_start, o.prefs?.quiet_end); // every category respects quiet hours (spec §12)
}

// ── Scheduling helpers for the reminder cron ─────────────────────────────────
/** Day of week in Africa/Lagos, 0 = Sunday. */
export const lagosDow = (d: Date): number => new Date(d.getTime() + 3_600_000).getUTCDay();

/**
 * Is a daily check-in nudge due today for this rhythm? Hard season is weekly at most (spec §8.4).
 * daily: every day · few_weekly: Mon, Wed, Fri · weekly: Mondays.
 */
export function checkinDue(freq: string | null | undefined, now: Date, hardSeason: boolean): boolean {
  const dow = lagosDow(now);
  if (hardSeason || freq === "weekly") return dow === 1;
  if (freq === "daily") return true;
  return dow === 1 || dow === 3 || dow === 5; // few_weekly is the default
}

/** Debt reminder state for a due date: tomorrow, or overdue (reminded once, the day after it passes). */
export function debtReminder(dueOn: string | null | undefined, todayLagos: string): "tomorrow" | "overdue" | null {
  if (!dueOn) return null;
  const diff = Math.floor((Date.parse(dueOn) - Date.parse(todayLagos)) / 86_400_000);
  return diff === 1 ? "tomorrow" : diff === -1 ? "overdue" : null;
}
export const lagosDate = (d: Date): string => new Date(d.getTime() + 3_600_000).toISOString().slice(0, 10);
