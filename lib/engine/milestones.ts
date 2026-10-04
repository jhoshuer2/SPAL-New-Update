// Milestone engine (spec §8.2–8.3). Pure functions: no I/O, shared by API routes and UI.
import type { Level } from "./placement";

export type CompletionType = "manual" | "data" | "spal" | "none";
export type MilestoneStatus = "locked" | "in_progress" | "done";

export type MilestoneDef = {
  key: string;
  level: Level;
  position: number;
  title: string;
  completion_type: CompletionType;
  data_rule: { rule: string } | null;
  is_gateway: boolean;
};

export type MilestoneState = MilestoneDef & { status: MilestoneStatus; completed_at: string | null };

export type LevelProgress = {
  done: number;
  total: number;
  /** 0–100, whole number */
  pct: number;
  next: MilestoneState | null;
  gatewayDone: boolean;
};

/** Milestones with no completion route (the Level 5 "journey continues" row) do not count toward progress. */
const counts = (m: { completion_type: CompletionType }) => m.completion_type !== "none";

export function levelProgress(milestones: MilestoneState[], level: Level): LevelProgress {
  const mine = milestones.filter((m) => m.level === level && counts(m)).sort((a, b) => a.position - b.position);
  const done = mine.filter((m) => m.status === "done").length;
  const total = mine.length;
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    next: mine.find((m) => m.status !== "done") ?? null,
    gatewayDone: mine.some((m) => m.is_gateway && m.status === "done"),
  };
}

/** Level-up is offered (never forced) once the current level's gateway is done and a next level exists. */
export const levelUpReady = (milestones: MilestoneState[], level: Level): boolean =>
  level < 5 && levelProgress(milestones, level).gatewayDone;

/** A milestone can be completed by hand only at or below the user's level, and only if it is not data-driven. */
export function canCompleteManually(m: MilestoneDef, userLevel: Level): boolean {
  return m.level <= userLevel && (m.completion_type === "manual" || m.completion_type === "spal");
}

// ── Data rules ────────────────────────────────────────────────────────────────

export type RuleContext = {
  /** Any sale ever recorded. */
  hasSale: boolean;
  /** Distinct YYYY-MM-DD days with a sale or expense (any range, any order). */
  recordDays: string[];
  /** Today, YYYY-MM-DD (injected so tests are deterministic). */
  today: string;
};

const DAY = 86_400_000;
const toDay = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY);

/** 30 distinct record days inside any 60-day window. */
export function recordsInWindow(days: string[], need = 30, window = 60): boolean {
  const d = [...new Set(days.map(toDay))].sort((a, b) => a - b);
  for (let i = 0; i + need - 1 < d.length; i++) if (d[i + need - 1] - d[i] < window) return true;
  return false;
}

/** Entries on at least `minDays` distinct days in each of the `months` most recent *closed* calendar months. */
export function recordsEachMonth(days: string[], today: string, months = 3, minDays = 8): boolean {
  const set = new Set(days);
  const y = +today.slice(0, 4);
  const m = +today.slice(5, 7) - 1;
  for (let k = 1; k <= months; k++) {
    const dt = new Date(Date.UTC(y, m - k, 1));
    const prefix = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    let n = 0;
    for (const d of set) if (d.startsWith(prefix)) n++;
    if (n < minDays) return false;
  }
  return true;
}

/**
 * Evaluate a data rule. Returns true/false, or null when the rule cannot be evaluated yet
 * (its data does not exist in the app). Null never completes a milestone.
 */
export function evaluateRule(rule: string, ctx: RuleContext): boolean | null {
  switch (rule) {
    case "first_sale": return ctx.hasSale;
    case "records_30_days": return recordsInWindow(ctx.recordDays);
    case "records_3_months": return recordsEachMonth(ctx.recordDays, ctx.today);
    default: return null; // profit_per_product, monthly_profit_goal, first_hire, salaries_on_time_3, meetings, year review
  }
}
