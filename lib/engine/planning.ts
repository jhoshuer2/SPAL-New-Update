// Planning studio logic (E02–E06). Pure functions; Spal's drafting falls back to these when AI is unavailable.
export type BudgetItem = { id: string; name: string; cost_kobo: number; have: boolean };
export type Idea = { oneLiner: string; customer: string; offer: string; why: string };
export type Conversation = { id: string; name: string; date: string; said: string };
export type Checklist = Record<"competitors" | "price" | "pilot", { done: boolean; note: string }>;
export type Task = { id: string; text: string; done: boolean; remind_on?: string | null };
export type Week = { n: number; title: string; tasks: Task[] };

// ── E04 budget ────────────────────────────────────────────────────────────────
export type BudgetResult = { total: number; haveValue: number; toBuy: number; available: number; gap: number; covered: boolean };

/** `toBuy` is what still has to be paid for. `gap` is what's missing after the money already set aside. */
export function budgetGap(items: BudgetItem[], availableKobo: number): BudgetResult {
  const total = items.reduce((s, i) => s + i.cost_kobo, 0);
  const haveValue = items.filter((i) => i.have).reduce((s, i) => s + i.cost_kobo, 0);
  const toBuy = total - haveValue;
  const gap = Math.max(0, toBuy - availableKobo);
  return { total, haveValue, toBuy, available: availableKobo, gap, covered: gap === 0 };
}

export type Way = { key: "save" | "smaller" | "partner"; title: string; body: string };

/** Ways to close a gap (spec E04): save for it, start smaller, or bring in a partner. */
export function waysToClose(items: BudgetItem[], availableKobo: number, fmt: (kobo: number) => string): Way[] {
  const r = budgetGap(items, availableKobo);
  if (r.covered) return [];
  const ways: Way[] = [];
  ways.push({ key: "save", title: "Save towards it", body: `Setting aside ${fmt(Math.ceil(r.gap / 3 / 100) * 100)} a month closes the gap in 3 months.` });
  // Start smaller: buy the cheapest items first until the money runs out.
  const need = items.filter((i) => !i.have).sort((a, b) => a.cost_kobo - b.cost_kobo);
  let left = availableKobo; const first: string[] = [];
  for (const i of need) { if (i.cost_kobo <= left) { first.push(i.name); left -= i.cost_kobo; } }
  ways.push({ key: "smaller", title: "Start smaller", body: first.length ? `With what you have you can start with ${first.join(", ")}, then add the rest as sales come in.` : "Pick the one item you can't start without, and begin with only that." });
  ways.push({ key: "partner", title: "Find a partner", body: `A partner who adds ${fmt(r.gap)} could close the gap. Agree how you'll share profit before any money moves.` });
  return ways;
}

// ── E03 validation ────────────────────────────────────────────────────────────
export const CONVERSATIONS_NEEDED = 5;
export function validationProgress(conversations: number, c: Partial<Checklist>) {
  const steps = (["competitors", "price", "pilot"] as const).filter((k) => c[k]?.done).length;
  const talked = Math.min(conversations, CONVERSATIONS_NEEDED);
  const done = talked + steps, total = CONVERSATIONS_NEEDED + 3;
  return { talked, steps, pct: Math.round((done / total) * 100), talkedEnough: conversations >= CONVERSATIONS_NEEDED };
}

// ── E02 idea (fallback when AI drafting is unavailable) ───────────────────────
export function ideaFallback(raw: string): { summary: Idea; questions: string[]; alternatives: string[] } {
  const text = raw.trim().replace(/\s+/g, " ");
  const first = (text.split(/(?<=[.!?])\s/)[0] ?? text).slice(0, 140);
  return {
    summary: { oneLiner: first, customer: "", offer: "", why: "" },
    questions: ["Who is the first person you'd sell this to?", "What problem does it solve for them?", "How much would they pay, and why?"],
    alternatives: [],
  };
}

// ── E06 launch plan ───────────────────────────────────────────────────────────
const id = () => Math.random().toString(36).slice(2, 10);
const t = (text: string): Task => ({ id: id(), text, done: false });

/** A week-by-week path to the first sale. Ends at the "Make your first sale" milestone. */
export function defaultLaunchPlan(): Week[] {
  return [
    { n: 1, title: "Get clear", tasks: [t("Write your idea in one sentence"), t("Decide who your first customer is"), t("List what you need to start")] },
    { n: 2, title: "Test it", tasks: [t("Talk to 5 possible customers"), t("Check what others charge for the same thing"), t("Try a price on one real person")] },
    { n: 3, title: "Get ready", tasks: [t("Buy only the essentials"), t("Set up how you'll get paid (cash, transfer)"), t("Tell 10 people you're opening")] },
    { n: 4, title: "Make your first sale", tasks: [t("Offer to your first customer"), t("Record the sale in Spal"), t("Ask them what they liked")] },
  ];
}
export function launchProgress(weeks: Week[]) {
  const all = weeks.flatMap((w) => w.tasks);
  const done = all.filter((x) => x.done).length;
  return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
}
