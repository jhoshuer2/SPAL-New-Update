import { describe, it, expect } from "vitest";
import { evaluateRule, levelProgress, levelUpReady, recordsEachMonth, recordsInWindow, canCompleteManually, type MilestoneState } from "./milestones";
import { selectModules, todaysFocus, nudgeFor } from "./modules";

const ms = (level: 0 | 1, specs: Array<[string, "done" | "in_progress" | "locked", boolean?]>): MilestoneState[] =>
  specs.map(([key, status, gw], i) => ({
    key, level, position: i + 1, title: key, completion_type: "manual", data_rule: null, is_gateway: !!gw, status, completed_at: null,
  }));

const days = (start: string, n: number, step = 1) =>
  Array.from({ length: n }, (_, i) => new Date(Date.parse(start) + i * step * 86_400_000).toISOString().slice(0, 10));

describe("levelProgress", () => {
  it("counts done milestones and finds the next one", () => {
    const p = levelProgress(ms(0, [["a", "done"], ["b", "in_progress"], ["c", "in_progress"], ["g", "in_progress", true]]), 0);
    expect(p).toMatchObject({ done: 1, total: 4, pct: 25 });
    expect(p.next?.key).toBe("b");
    expect(p.gatewayDone).toBe(false);
  });
  it("offers level up only when the gateway is done", () => {
    expect(levelUpReady(ms(0, [["a", "done"], ["g", "done", true]]), 0)).toBe(true);
    expect(levelUpReady(ms(0, [["a", "done"], ["g", "in_progress", true]]), 0)).toBe(false);
  });
  it("never offers level up at Level 5", () => {
    const l5: MilestoneState[] = [{ key: "g", level: 5, position: 4, title: "g", completion_type: "none", data_rule: null, is_gateway: true, status: "done", completed_at: null }];
    expect(levelUpReady(l5, 5)).toBe(false);
  });
});

describe("data rules", () => {
  const today = "2026-10-04";
  it("first_sale", () => {
    expect(evaluateRule("first_sale", { hasSale: true, recordDays: [], today })).toBe(true);
    expect(evaluateRule("first_sale", { hasSale: false, recordDays: [], today })).toBe(false);
  });
  it("30 days inside a 60-day window", () => {
    expect(recordsInWindow(days("2026-08-01", 30))).toBe(true);
    expect(recordsInWindow(days("2026-06-01", 30, 3))).toBe(false); // 30 entries spread over 87 days
    expect(recordsInWindow(days("2026-08-01", 29))).toBe(false);
    expect(recordsInWindow([...days("2026-08-01", 30), ...days("2026-08-01", 30)])).toBe(true); // duplicates collapse
  });
  it("3 closed months of 8+ days", () => {
    const d = [...days("2026-07-01", 8), ...days("2026-08-01", 8), ...days("2026-09-01", 8)];
    expect(recordsEachMonth(d, "2026-10-04")).toBe(true);
    expect(recordsEachMonth(d.slice(1), "2026-10-04")).toBe(false);
  });
  it("returns null for rules the app cannot evaluate yet", () => {
    expect(evaluateRule("first_hire", { hasSale: true, recordDays: [], today })).toBeNull();
  });
});

describe("manual completion", () => {
  const base = { key: "k", position: 1, title: "t", data_rule: null, is_gateway: false };
  it("blocks future levels and data-driven milestones", () => {
    expect(canCompleteManually({ ...base, level: 1, completion_type: "manual" }, 1)).toBe(true);
    expect(canCompleteManually({ ...base, level: 2, completion_type: "manual" }, 1)).toBe(false);
    expect(canCompleteManually({ ...base, level: 1, completion_type: "data" }, 1)).toBe(false);
  });
});

describe("modules and focus", () => {
  it("pins the chosen module for 14 days only", () => {
    expect(selectModules(1, { beginChoice: "price_right", daysSinceOnboarding: 3 })[0].key).toBe("pricing_helper");
    expect(selectModules(1, { beginChoice: "price_right", daysSinceOnboarding: 20 })[0].key).toBe("today_money");
  });
  it("hides modules that have not shipped", () => {
    expect(selectModules(0, { onlyAvailable: true }).map((m) => m.key)).toEqual(["spal_tip"]);
  });
  it("focus points a brand-new seller at their first sale, then at milestones", () => {
    const p = levelProgress(ms(1, [["a", "in_progress"]]), 1);
    expect(todaysFocus(1, p, { salesToday: 0, hasEverRecorded: false, hardSeason: false }).href).toBe("/sell");
    expect(todaysFocus(1, p, { salesToday: 2, hasEverRecorded: true, hardSeason: false }).href).toBe("/journey/milestone/a");
  });
  it("hard season does not nag about today's sales", () => {
    const p = levelProgress(ms(1, [["a", "in_progress"]]), 1);
    expect(todaysFocus(1, p, { salesToday: 0, hasEverRecorded: true, hardSeason: true }).href).toBe("/journey/milestone/a");
    expect(nudgeFor(1, 5, true)).toMatch(/tough|don't have to/i);
  });
});
