// Spal companion logic (spec §9.3–9.5, C02, H01). Pure functions, no I/O.
import type { Level } from "./placement";

// ── Memory ────────────────────────────────────────────────────────────────────
export type MemoryCategory = "person" | "business" | "goal" | "struggle" | "preference" | "history";
export type MemoryFact = { id: string; fact: string; category: MemoryCategory; created_at: string };

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
/** Crude stemming so "price" matches "pricing" and "shoes" matches "shoe". */
const stem = (w: string) => w.replace(/(ing|ed|es|s|e)$/, "");
const words = (s: string) => new Set(norm(s).split(" ").filter((w) => w.length > 2).map(stem));

/** Spec §9.5: never store health, religion, politics or other sensitive personal details as facts. */
const SENSITIVE = /\b(hiv|aids|cancer|diabet\w*|illness|sick|pregnan\w*|depress\w*|suicid\w*|mental health|medication|church|mosque|pastor|imam|muslim|christian|religio\w*|allah|jesus|party|election|apc|pdp|labour party|vote[sd]?|politic\w*|tribe|ethnic\w*|sexual\w*|gay|lesbian|disabilit\w*|bank account|account number|bvn|nin\b|password|pin\b)\b/i;
export const isSensitiveFact = (fact: string) => SENSITIVE.test(fact);

/** Jaccard overlap of word sets; ≥0.7 counts as the same fact. */
const similar = (a: string, b: string) => {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return false;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter) >= 0.7;
};

/** Keep only candidate facts that are new, non-sensitive, short and not duplicates of each other or existing facts. */
export function dedupeFacts(existing: string[], candidates: { fact: string; category: MemoryCategory }[]) {
  const kept: { fact: string; category: MemoryCategory }[] = [];
  for (const c of candidates) {
    const fact = c.fact.trim().replace(/\s+/g, " ").slice(0, 200);
    if (fact.length < 8 || isSensitiveFact(fact)) continue;
    if ([...existing, ...kept.map((k) => k.fact)].some((e) => similar(e, fact))) continue;
    kept.push({ fact, category: c.category });
  }
  return kept;
}

/** Up to `limit` facts, most relevant first: word overlap with the message, then recency (spec §9.3.3). */
export function rankMemories(facts: MemoryFact[], message: string, limit = 20, now = Date.now()): MemoryFact[] {
  const m = words(message);
  const score = (f: MemoryFact) => {
    const fw = words(f.fact);
    let overlap = 0;
    for (const w of fw) if (m.has(w)) overlap++;
    const ageDays = Math.max(0, (now - Date.parse(f.created_at)) / 86_400_000);
    return overlap * 3 + 1 / (1 + ageDays / 30);
  };
  return [...facts].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

// ── Money aggregates (the model only ever sees totals, never raw rows) ────────
export type RecordRow = { type: "sale" | "expense"; amount: number; record_date: string; payment_status?: string | null };
export type Window = { moneyIn: number; moneyOut: number; profit: number };
export type Aggregates = { last7: Window; last30: Window; last90: Window; owing: number; recordCount90: number };

const dayNum = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10)) / 86_400_000);

export function aggregate(rows: RecordRow[], today: string): Aggregates {
  const t = dayNum(today);
  const win = (days: number): Window => {
    let i = 0, o = 0;
    for (const r of rows) {
      const age = t - dayNum(r.record_date);
      if (age < 0 || age >= days) continue;
      if (r.type === "sale") i += Number(r.amount); else o += Number(r.amount);
    }
    return { moneyIn: i, moneyOut: o, profit: i - o };
  };
  const owing = rows.filter((r) => r.type === "sale" && r.payment_status === "owing").reduce((s, r) => s + Number(r.amount), 0);
  return { last7: win(7), last30: win(30), last90: win(90), owing, recordCount90: rows.filter((r) => t - dayNum(r.record_date) < 90).length };
}

// ── Spal's structured reply ───────────────────────────────────────────────────
export type DataRef = { type: "sales" | "expenses" | "profit" | "debts" | "goals" | "milestones" | "moments"; range?: "last_7_days" | "last_30_days" | "last_90_days" };
export const GOAL_TYPES = ["daily_sales", "weekly_profit", "monthly_sales", "yearly_revenue"] as const;
export const MOMENT_TYPES = ["win", "struggle", "lesson", "decision"] as const;
export type SpalAction =
  | { type: "save_goal"; label: string; goal_type: (typeof GOAL_TYPES)[number]; target_amount: number }
  | { type: "save_moment"; label: string; moment_type: (typeof MOMENT_TYPES)[number]; text: string };

const REFS = ["sales", "expenses", "profit", "debts", "goals", "milestones", "moments"];
const RANGES = ["last_7_days", "last_30_days", "last_90_days"];

/** Validate whatever the model returned. Unknown actions are dropped: Spal never offers what the app can't do. */
export function parseSpalReply(raw: { reply?: unknown; data_refs?: unknown; actions?: unknown } | null, fallbackText: string) {
  const reply = typeof raw?.reply === "string" && raw.reply.trim() ? raw.reply.trim() : fallbackText.trim();
  const dataRefs: DataRef[] = (Array.isArray(raw?.data_refs) ? raw!.data_refs : [])
    .flatMap((r: { type?: string; range?: string }) => (REFS.includes(r?.type ?? "") ? [{ type: r.type as DataRef["type"], range: RANGES.includes(r.range ?? "") ? (r.range as DataRef["range"]) : undefined }] : []))
    .slice(0, 3);
  const actions: SpalAction[] = [];
  for (const a of Array.isArray(raw?.actions) ? (raw!.actions as Record<string, unknown>[]) : []) {
    if (a?.type === "save_goal" && (GOAL_TYPES as readonly string[]).includes(a.goal_type as string) && Number(a.target_amount) > 0) {
      actions.push({ type: "save_goal", label: String(a.label ?? "Save as goal").slice(0, 40), goal_type: a.goal_type as (typeof GOAL_TYPES)[number], target_amount: Math.round(Number(a.target_amount)) });
    } else if (a?.type === "save_moment" && (MOMENT_TYPES as readonly string[]).includes(a.moment_type as string) && typeof a.text === "string" && a.text.trim()) {
      actions.push({ type: "save_moment", label: String(a.label ?? "Save as moment").slice(0, 40), moment_type: a.moment_type as (typeof MOMENT_TYPES)[number], text: a.text.trim().slice(0, 500) });
    }
  }
  return { reply, dataRefs, actions: actions.slice(0, 2) };
}

const RANGE_TEXT: Record<string, string> = { last_7_days: "the last 7 days", last_30_days: "the last 30 days", last_90_days: "the last 90 days" };
const REF_TEXT: Record<DataRef["type"], string> = { sales: "sales", expenses: "expenses", profit: "profit", debts: "money owed to you", goals: "goals", milestones: "milestones", moments: "moments" };
/** "Based on your sales from the last 30 days" */
export const describeDataRefs = (refs: DataRef[]) =>
  refs.length ? `Based on your ${refs.map((r) => REF_TEXT[r.type] + (r.range ? ` from ${RANGE_TEXT[r.range]}` : "")).join(" and ")}` : null;

// ── Daily check-in (C02) ──────────────────────────────────────────────────────
export type CheckinQuestion = { key: string; question: string; why: string; choices: string[]; mood: boolean };
export type CheckinCtx = { hasEverRecorded: boolean; salesToday: number; hardSeason: boolean };

const Q = (key: string, question: string, why: string, choices: string[] = [], mood = false): CheckinQuestion => ({ key, question, why, choices, mood });
const BY_LEVEL: Record<Level, CheckinQuestion[]> = {
  0: [
    Q("l0_idea_step", "What's one small thing you did for your idea this week?", "Small steps add up, and it helps me know where you are.", ["Talked to someone", "Wrote it down", "Looked at costs", "Nothing yet"]),
    Q("l0_fear", "What's the biggest thing holding you back right now?", "So I can help with the right thing first.", ["Money", "Not sure what to sell", "Fear of failing", "Time"]),
    Q("l0_customer", "Who is the first person you'd love to sell to?", "Knowing your first customer makes everything clearer."),
  ],
  1: [
    Q("l1_sales", "How did sales go today?", "A quick read on your day helps me spot patterns for you.", ["Great", "OK", "Slow", "No sales"], true),
    Q("l1_costs", "Did anything cost more than you expected this week?", "Surprises in costs are the easiest thing to fix once we see them.", ["Yes", "No", "Not sure"]),
    Q("l1_best", "What was your best seller this week?", "I use this to tailor ideas to what you actually sell."),
    Q("l1_credit", "Is anyone owing you right now?", "Money owed is easy to forget, and it matters.", ["Yes", "No", "A little"]),
  ],
  2: [
    Q("l2_sales", "How did sales go today?", "Steady records make planning easy.", ["Great", "OK", "Slow", "No sales"], true),
    Q("l2_supplier", "Did your supplier deliver on time this week?", "Supply problems show up in your costs and your sales.", ["Yes", "Late", "Not at all"]),
    Q("l2_compliance", "Anything coming up on tax or registration?", "I can help you keep dates from sneaking up on you.", ["Yes", "No", "Not sure"]),
  ],
  3: [
    Q("l3_team", "How is your team doing this week?", "A calm team makes a steadier business.", ["Great", "OK", "Struggling"], true),
    Q("l3_salary", "Is anything holding up salaries this month?", "Paying on time builds trust, and I can help you plan for it.", ["No", "Maybe", "Yes"]),
  ],
  4: [
    Q("l4_growth", "What's the one thing you'd fix to grow faster?", "Helps me focus my advice on your real bottleneck."),
    Q("l4_run", "Could the business run for a week without you?", "A good test of how ready your systems are.", ["Yes", "Mostly", "Not yet"]),
  ],
  5: [
    Q("l5_next", "What's on your mind about what comes next?", "You've built something. I'd like to hear where your head is.")
  ],
};
const HARD: CheckinQuestion[] = [
  Q("hard_cash", "How is cash holding up this week?", "Gentle check, no pressure. Cash and costs matter most right now.", ["OK", "Tight", "Very tight"]),
  Q("hard_you", "How are you doing, apart from the business?", "You matter more than the numbers.", ["Fine", "Tired", "Heavy"]),
];

/** Find a library question by its text (the checkins table stores only the text). */
export const findQuestion = (text: string): CheckinQuestion | undefined =>
  [...Object.values(BY_LEVEL).flat(), ...HARD].find((q) => q.question === text);

/** One question per day. Avoids repeating anything asked in the last 14 days; hard season gets softer questions only. */
export function pickQuestion(level: Level, ctx: CheckinCtx, recent: string[], seed: number): CheckinQuestion {
  const pool = ctx.hardSeason ? HARD : [...BY_LEVEL[level]].filter((q) => !(q.key.endsWith("_sales") && !ctx.hasEverRecorded));
  const fresh = pool.filter((q) => !recent.includes(q.question));
  const from = fresh.length ? fresh : pool;
  return from[seed % from.length];
}

export const warmReply = (mood: string | null, hardSeason: boolean) =>
  hardSeason ? "Thank you for telling me. One step at a time is enough."
  : mood === "Great" ? "Love to hear it. Let's keep that going."
  : mood === "Slow" || mood === "No sales" ? "Slow days happen to every business. Thanks for being honest, we'll work with it."
  : "Got it. Thanks for telling me, it helps me help you.";

/** Gentle rhythm: how many of the last 7 days had a check-in. Never a streak that "breaks". */
export const rhythm = (answeredDays: string[], today: string) => {
  const t = Math.floor(Date.parse(today) / 86_400_000);
  return new Set(answeredDays.map((d) => d.slice(0, 10)).filter((d) => { const a = t - Math.floor(Date.parse(d) / 86_400_000); return a >= 0 && a < 7; })).size;
};

// ── Suggested prompts (H01) ───────────────────────────────────────────────────
export function suggestedPrompts(level: Level, ctx: { hasEverRecorded: boolean; hardSeason: boolean }): string[] {
  if (ctx.hardSeason) return ["How do I get through a slow month?", "Which costs can I trim this week?", "Help me plan this week with less stress"];
  const byLevel: Record<Level, string[]> = {
    0: ["Help me shape my business idea", "What do I need to get started?", "How do I find my first customer?"],
    1: ctx.hasEverRecorded ? ["How are my sales this week?", "Which product makes me the most profit?", "How can I get more repeat customers?"] : ["How do I record my first sale?", "How should I price what I sell?", "How do I get my first customers?"],
    2: ["How do I register my business with CAC?", "Is my profit healthy this month?", "When should I hire my first person?"],
    3: ["How do I write clear roles for my team?", "How do I plan salaries each month?", "How do I run a better team meeting?"],
    4: ["How do I test a new location safely?", "What should be in a funding pack?", "Which of my processes should I document first?"],
    5: ["What should I focus on next year?", "How do I mentor someone well?", "How do I plan for the long term?"],
  };
  return byLevel[level];
}
