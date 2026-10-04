// Business overview and debts logic (F01, F13). Pure: the API fetches rows, this summarises them.
export type Period = "today" | "week" | "month" | "custom";
export type PaymentMethod = "cash" | "transfer" | "pos" | "credit";

export type Row = {
  type: "sale" | "expense";
  amount: number; // naira (legacy records are numeric naira)
  description?: string | null;
  record_date: string; // YYYY-MM-DD
  payment_method?: PaymentMethod | null;
  payment_status?: string | null;
  is_personal?: boolean | null;
};

const DAY = 86_400_000;
const num = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10)) / DAY);
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);

export type Range = { start: string; end: string; prevStart: string; prevEnd: string; days: number };

/** Week starts on Monday (the legacy app's convention). The previous range is the same length, just before. */
export function rangeFor(period: Period, today: string, custom?: { start: string; end: string }): Range {
  const t = num(today);
  let s = t, e = t;
  if (period === "week") s = t - ((new Date(t * DAY).getUTCDay() + 6) % 7);
  else if (period === "month") s = num(today.slice(0, 8) + "01");
  else if (period === "custom" && custom) { s = num(custom.start); e = num(custom.end); if (e < s) [s, e] = [e, s]; }
  const days = e - s + 1;
  return { start: iso(s), end: iso(e), prevStart: iso(s - days), prevEnd: iso(s - 1), days };
}

export type Summary = {
  moneyIn: number; moneyOut: number; profit: number; recordCount: number;
  trend: { date: string; in: number; out: number }[];
  topProducts: { name: string; amount: number; count: number }[];
  split: Record<PaymentMethod | "unspecified", number>;
};

/** Personal spending is never business spending (spec F06). Rows outside [start,end] are ignored. */
export function summarize(rows: Row[], start: string, end: string): Summary {
  const s = num(start), e = num(end);
  const inRange = rows.filter((r) => !r.is_personal && num(r.record_date) >= s && num(r.record_date) <= e);
  const days = new Map<number, { in: number; out: number }>();
  for (let d = s; d <= e && d - s < 400; d++) days.set(d, { in: 0, out: 0 });
  const prod = new Map<string, { name: string; amount: number; count: number }>();
  const split: Summary["split"] = { cash: 0, transfer: 0, pos: 0, credit: 0, unspecified: 0 };
  let i = 0, o = 0;
  for (const r of inRange) {
    const a = Number(r.amount);
    const d = days.get(num(r.record_date));
    if (r.type === "sale") {
      i += a; if (d) d.in += a;
      const key = (r.description ?? "").trim().toLowerCase();
      if (key) { const p = prod.get(key) ?? { name: r.description!.trim(), amount: 0, count: 0 }; p.amount += a; p.count++; prod.set(key, p); }
      split[r.payment_method ?? (r.payment_status === "owing" ? "credit" : "unspecified")] += a;
    } else { o += a; if (d) d.out += a; }
  }
  return {
    moneyIn: i, moneyOut: o, profit: i - o, recordCount: inRange.length,
    trend: [...days.entries()].map(([d, v]) => ({ date: iso(d), ...v })),
    topProducts: [...prod.values()].sort((a, b) => b.amount - a.amount).slice(0, 3),
    split,
  };
}

const PERIOD_WORD: Record<Period, string> = { today: "yesterday", week: "last week", month: "last month", custom: "the period before" };

/** One calm line from Spal. Never shames: a drop is met with a next step, not a verdict. */
export function spalComment(cur: Summary, prev: Summary, period: Period, hardSeason: boolean): string {
  if (cur.recordCount === 0) return "Nothing recorded for this period yet. Add a sale or expense and I'll start spotting patterns.";
  if (hardSeason) return cur.profit >= 0 ? "You're keeping more than you spend this period. That's solid in a tough stretch." : "Spending is ahead of sales this period. Let's look at which costs can wait.";
  const word = PERIOD_WORD[period];
  if (prev.moneyIn > 0 && cur.moneyIn > 0) {
    const pct = Math.round(((cur.moneyIn - prev.moneyIn) / prev.moneyIn) * 100);
    if (pct >= 10) return `Money in is up ${pct}% on ${word}. Nice work.`;
    if (pct <= -10) return `Money in is ${Math.abs(pct)}% lower than ${word}. Slow stretches happen. Want ideas to win customers back?`;
    return `Money in is steady compared with ${word}.`;
  }
  if (cur.profit < 0) return "You spent more than you made in this period. Let's see which costs we can trim.";
  return "You're off to a good start this period. Keep recording and I'll show you the patterns.";
}

// ── Debts (F13) ───────────────────────────────────────────────────────────────
export type DueState = "overdue" | "soon" | "later" | "none";
/** "soon" = within 3 days. */
export function dueState(dueOn: string | null | undefined, today: string): DueState {
  if (!dueOn) return "none";
  const diff = num(dueOn) - num(today);
  return diff < 0 ? "overdue" : diff <= 3 ? "soon" : "later";
}
export const dueLabel = (dueOn: string | null | undefined, today: string): string => {
  const s = dueState(dueOn, today);
  if (s === "none") return "No due date";
  const diff = num(dueOn!) - num(today);
  if (diff === 0) return "Due today";
  return diff < 0 ? `${-diff} day${diff === -1 ? "" : "s"} overdue` : `Due in ${diff} day${diff === 1 ? "" : "s"}`;
};

/** Remaining naira on a debt after part payments (kobo in, naira out; never negative). */
export const remainingNaira = (amountNaira: number, paidKobo: number): number => Math.max(0, Math.round(amountNaira * 100 - paidKobo) / 100);

/** A payment larger than what is left is rejected; returns the kobo to apply, or null if invalid. */
export function applyPayment(remainingKobo: number, payKobo: number): { applied: number; settled: boolean } | null {
  if (!Number.isInteger(payKobo) || payKobo <= 0 || payKobo > remainingKobo) return null;
  return { applied: payKobo, settled: payKobo === remainingKobo };
}
