// Dashboard module registry (spec §8.5, Appendix A default modules). Pure data + selection.
import type { Level } from "./placement";
import type { LevelProgress } from "./milestones";

export type ModuleDef = {
  key: string;
  title: string;
  levels: Level[];
  /** Lower comes first by default. */
  priority: number;
  /** `begin_choice` keys (B10) that pin this module to the top for the first 14 days. */
  pinFor?: string[];
  /** false until the feature behind it ships; hidden from the UI. */
  available: boolean;
};

const all: Level[] = [0, 1, 2, 3, 4, 5];

export const MODULES: ModuleDef[] = [
  // Level 0
  { key: "idea_card", title: "Your idea", levels: [0], priority: 10, pinFor: ["shape_idea", "find_idea"], available: false },
  { key: "validation_checklist", title: "Validation checklist", levels: [0], priority: 20, available: false },
  { key: "startup_budget", title: "Startup budget", levels: [0], priority: 30, pinFor: ["startup_budget"], available: false },
  { key: "launch_plan", title: "Launch plan", levels: [0], priority: 40, available: false },
  { key: "learn_for_you", title: "Learn for you", levels: [0, 1], priority: 50, pinFor: ["learn_basics"], available: false },
  // Level 1+ (existing money home)
  { key: "today_money", title: "Today's money", levels: [1, 2, 3, 4, 5], priority: 10, pinFor: ["track_money", "records_order"], available: true },
  { key: "who_owes_me", title: "Who owes me", levels: [1], priority: 40, available: false },
  { key: "pricing_helper", title: "Pricing helper", levels: [1], priority: 50, pinFor: ["price_right"], available: false },
  // Level 2+
  { key: "profit_loss", title: "Profit and loss", levels: [2, 3], priority: 15, available: false },
  { key: "compliance", title: "Compliance tracker", levels: [2, 4], priority: 20, pinFor: ["tax_compliance"], available: false },
  // Level 3+
  { key: "team_today", title: "Team today", levels: [3], priority: 5, available: false },
  { key: "salaries_due", title: "Salaries due", levels: [3], priority: 10, pinFor: ["salaries"], available: false },
  // Level 4–5
  { key: "growth_by_channel", title: "Growth by location", levels: [4], priority: 5, available: false },
  { key: "portfolio", title: "Portfolio overview", levels: [5], priority: 5, pinFor: ["portfolio"], available: false },
  { key: "mentor_sessions", title: "Mentor sessions", levels: [4, 5], priority: 30, pinFor: ["find_mentor", "mentor"], available: false },
  // Any level
  { key: "spal_tip", title: "Spal tip of the day", levels: all, priority: 100, available: true },
];

/**
 * Ordered modules for a level. The user's "where to begin" choice pins its module to the top
 * during the first 14 days after onboarding.
 */
export function selectModules(
  level: Level,
  opts: { beginChoice?: string | null; daysSinceOnboarding?: number; onlyAvailable?: boolean } = {},
): ModuleDef[] {
  const pinActive = !!opts.beginChoice && (opts.daysSinceOnboarding ?? 0) <= 14;
  return MODULES.filter((m) => m.levels.includes(level) && (!opts.onlyAvailable || m.available)).sort((a, b) => {
    const pa = pinActive && a.pinFor?.includes(opts.beginChoice!) ? 0 : 1;
    const pb = pinActive && b.pinFor?.includes(opts.beginChoice!) ? 0 : 1;
    return pa - pb || a.priority - b.priority;
  });
}

// ── Today's focus and Spal's line (templated; the AI nudge replaces these once credit is available) ──

export type Focus = { title: string; why: string; href: string };

export function todaysFocus(
  level: Level,
  progress: LevelProgress,
  ctx: { salesToday: number; hasEverRecorded: boolean; hardSeason: boolean },
): Focus {
  if (level >= 1 && !ctx.hasEverRecorded) {
    return { title: "Record your first sale", why: "It takes under five seconds and starts your journey.", href: "/sell" };
  }
  if (level >= 1 && ctx.salesToday === 0 && !ctx.hardSeason) {
    return { title: "Record today's sales", why: "A quick note now saves you guessing later.", href: "/sell" };
  }
  if (progress.next) {
    return { title: progress.next.title, why: `Next step on your Level ${level} path.`, href: `/journey/milestone/${progress.next.key}` };
  }
  return { title: "Look at how far you've come", why: "Take a moment to see your journey.", href: "/journey/timeline" };
}

const NUDGES: Record<number, string[]> = {
  0: ["Every business starts with one small step. What's yours today?", "Talk to one possible customer today. Their words are gold."],
  1: ["Small records, big clarity. Add today's sales when you can.", "Know your profit on each product and pricing gets easy."],
  2: ["Steady records make planning easy. You're building something solid.", "A quick look at your numbers this week can show where to grow."],
  3: ["Clear roles make a calm team. Who owns what in your business?", "Paying on time builds trust. You're doing the hard part."],
  4: ["Write down how you do things now. It's how you grow without burning out.", "Test a new location small before you commit."],
  5: ["What would help the next entrepreneur most? You've lived it.", "Take a step back and look at the whole picture today."],
};
const HARD_NUDGES = ["Tough stretch? Focus on cash and costs today. One step is enough.", "You don't have to do it all today. Showing up counts."];

/** Deterministic per user-day so the line does not flicker between renders. */
export function nudgeFor(level: Level, dayOfYear: number, hardSeason: boolean): string {
  const pool = hardSeason ? HARD_NUDGES : NUDGES[level];
  return pool[dayOfYear % pool.length];
}
