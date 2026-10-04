import { describe, it, expect } from "vitest";
import { applyPayment, dueLabel, dueState, rangeFor, remainingNaira, spalComment, summarize, type Row } from "./business";
import { budgetGap, defaultLaunchPlan, ideaFallback, launchProgress, validationProgress, waysToClose, type BudgetItem } from "./planning";

const TODAY = "2026-10-07"; // a Wednesday
const r = (type: "sale" | "expense", amount: number, date: string, extra: Partial<Row> = {}): Row => ({ type, amount, record_date: date, ...extra });

describe("rangeFor", () => {
  it("week starts Monday and previous range is the week before", () => {
    expect(rangeFor("week", TODAY)).toMatchObject({ start: "2026-10-05", end: "2026-10-07", prevStart: "2026-10-02", prevEnd: "2026-10-04" });
  });
  it("month starts on the 1st; today is one day", () => {
    expect(rangeFor("month", TODAY).start).toBe("2026-10-01");
    expect(rangeFor("today", TODAY)).toMatchObject({ start: TODAY, end: TODAY, prevStart: "2026-10-06" });
  });
  it("custom range accepts reversed dates", () => {
    expect(rangeFor("custom", TODAY, { start: "2026-10-04", end: "2026-10-01" })).toMatchObject({ start: "2026-10-01", end: "2026-10-04", days: 4 });
  });
});

describe("summarize", () => {
  const rows: Row[] = [
    r("sale", 10000, "2026-10-06", { description: "Jollof rice", payment_method: "cash" }),
    r("sale", 5000, "2026-10-06", { description: "jollof rice", payment_method: "transfer" }),
    r("sale", 2000, "2026-10-07", { description: "Zobo", payment_status: "owing" }),
    r("sale", 700, "2026-10-07", { description: "Water" }),
    r("expense", 4000, "2026-10-06"),
    r("expense", 9000, "2026-10-06", { is_personal: true }), // never counted
    r("sale", 99999, "2026-09-01", { description: "Old" }), // outside range
  ];
  const s = summarize(rows, "2026-10-05", "2026-10-07");
  it("totals money in, out and profit; personal spending excluded", () => {
    expect(s).toMatchObject({ moneyIn: 17700, moneyOut: 4000, profit: 13700, recordCount: 5 });
  });
  it("ranks top products case-insensitively", () => {
    expect(s.topProducts[0]).toEqual({ name: "Jollof rice", amount: 15000, count: 2 });
  });
  it("splits payment methods, with credit for owing and unspecified for legacy rows", () => {
    expect(s.split).toEqual({ cash: 10000, transfer: 5000, pos: 0, credit: 2000, unspecified: 700 });
  });
  it("gives one trend point per day including empty days", () => {
    expect(s.trend.map((d) => d.date)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
    expect(s.trend[0]).toEqual({ date: "2026-10-05", in: 0, out: 0 });
  });
});

describe("spalComment", () => {
  const mk = (i: number, o = 0, n = 1) => ({ moneyIn: i, moneyOut: o, profit: i - o, recordCount: n, trend: [], topProducts: [], split: { cash: 0, transfer: 0, pos: 0, credit: 0, unspecified: 0 } });
  it("celebrates growth, softens a drop, never shames", () => {
    expect(spalComment(mk(1200), mk(1000), "week", false)).toMatch(/up 20%/);
    const down = spalComment(mk(500), mk(1000), "week", false);
    expect(down).toMatch(/50% lower/);
    expect(down).not.toMatch(/bad|fail|poor|worse/i);
  });
  it("guides a brand-new period and respects hard season", () => {
    expect(spalComment(mk(0, 0, 0), mk(0, 0, 0), "today", false)).toMatch(/Nothing recorded/);
    expect(spalComment(mk(500, 900), mk(1000), "week", true)).toMatch(/costs can wait/);
  });
});

describe("debts", () => {
  it("classifies due dates", () => {
    expect(dueState("2026-10-06", TODAY)).toBe("overdue");
    expect(dueState("2026-10-09", TODAY)).toBe("soon");
    expect(dueState("2026-10-20", TODAY)).toBe("later");
    expect(dueState(null, TODAY)).toBe("none");
    expect(dueLabel("2026-10-05", TODAY)).toBe("2 days overdue");
    expect(dueLabel("2026-10-07", TODAY)).toBe("Due today");
  });
  it("computes what is left after part payments, never negative", () => {
    expect(remainingNaira(5000, 200_000)).toBe(3000);
    expect(remainingNaira(5000, 900_000)).toBe(0);
  });
  it("rejects overpayment and non-positive or fractional kobo", () => {
    expect(applyPayment(300_000, 100_000)).toEqual({ applied: 100_000, settled: false });
    expect(applyPayment(300_000, 300_000)).toEqual({ applied: 300_000, settled: true });
    expect(applyPayment(300_000, 300_001)).toBeNull();
    expect(applyPayment(300_000, 0)).toBeNull();
    expect(applyPayment(300_000, 10.5)).toBeNull();
  });
});

describe("budget", () => {
  const items: BudgetItem[] = [
    { id: "1", name: "Gas cooker", cost_kobo: 4_000_000, have: false },
    { id: "2", name: "Pots", cost_kobo: 1_500_000, have: true },
    { id: "3", name: "Rice", cost_kobo: 2_500_000, have: false },
  ];
  it("finds the gap after what you have and what you've set aside", () => {
    expect(budgetGap(items, 5_000_000)).toMatchObject({ total: 8_000_000, haveValue: 1_500_000, toBuy: 6_500_000, gap: 1_500_000, covered: false });
    expect(budgetGap(items, 7_000_000).covered).toBe(true);
  });
  const fmt = (k: number) => `₦${k / 100}`;
  it("offers save / start smaller / partner, and nothing when covered", () => {
    const w = waysToClose(items, 5_000_000, fmt);
    expect(w.map((x) => x.key)).toEqual(["save", "smaller", "partner"]);
    expect(w[1].body).toContain("Rice"); // cheapest first
    expect(w[1].body).not.toContain("Gas cooker"); // can't afford both
    expect(waysToClose(items, 9_000_000, fmt)).toEqual([]);
  });
});

describe("validation, idea, launch", () => {
  it("tracks 5 conversations plus 3 steps", () => {
    expect(validationProgress(2, { price: { done: true, note: "" } })).toMatchObject({ talked: 2, steps: 1, pct: 38, talkedEnough: false });
    expect(validationProgress(7, {}).talked).toBe(5);
    expect(validationProgress(5, {}).talkedEnough).toBe(true);
  });
  it("idea fallback keeps the first sentence and asks three questions", () => {
    const f = ideaFallback("I want to sell zobo to office workers. Maybe also snacks.");
    expect(f.summary.oneLiner).toBe("I want to sell zobo to office workers.");
    expect(f.questions).toHaveLength(3);
  });
  it("launch plan ends at the first sale and tracks progress", () => {
    const p = defaultLaunchPlan();
    expect(p[p.length - 1].title).toBe("Make your first sale");
    p[0].tasks[0].done = true;
    expect(launchProgress(p)).toMatchObject({ done: 1, total: 12, pct: 8 });
  });
});
