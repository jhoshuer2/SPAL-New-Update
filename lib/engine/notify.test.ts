import { describe, it, expect } from "vitest";
import { NOTIFICATIONS, categoryOf, isQuiet, lagosMinutes, shouldPush } from "./notify";

// Lagos is UTC+1: 20:30 UTC = 21:30 Lagos
const at = (utcH: number, utcM = 0) => new Date(Date.UTC(2026, 9, 7, utcH, utcM));

describe("quiet hours (Africa/Lagos)", () => {
  it("converts to Lagos time", () => expect(lagosMinutes(at(20, 30))).toBe(21 * 60 + 30));
  it("wraps past midnight, start inclusive and end exclusive", () => {
    expect(isQuiet(at(20, 0))).toBe(true);   // 21:00 Lagos
    expect(isQuiet(at(19, 59))).toBe(false); // 20:59
    expect(isQuiet(at(5, 59))).toBe(true);   // 06:59
    expect(isQuiet(at(6, 0))).toBe(false);   // 07:00
    expect(isQuiet(at(11, 0))).toBe(false);  // midday
  });
  it("supports a daytime window and an empty one", () => {
    expect(isQuiet(at(12, 0), "13:00", "15:00")).toBe(true);
    expect(isQuiet(at(12, 0), "21:00", "21:00")).toBe(false);
  });
});

describe("shouldPush", () => {
  const now = at(11, 0); // midday Lagos
  it("respects the category switch", () => {
    expect(shouldPush({ key: "comment_reply", prefs: { enabled: false }, hardSeason: false, now })).toBe(false);
    expect(shouldPush({ key: "comment_reply", prefs: { enabled: true }, hardSeason: false, now })).toBe(true);
    expect(shouldPush({ key: "comment_reply", hardSeason: false, now })).toBe(true); // no prefs row = defaults on
  });
  it("stays silent in quiet hours", () => {
    expect(shouldPush({ key: "milestone_done", hardSeason: false, now: at(21, 0) })).toBe(false);
  });
  it("hard season drops nudges and cheers but keeps the useful ones", () => {
    expect(shouldPush({ key: "spal_nudge", hardSeason: true, now })).toBe(false);
    expect(shouldPush({ key: "reaction_batch", hardSeason: true, now })).toBe(false);
    expect(shouldPush({ key: "debt_due", hardSeason: true, now })).toBe(true);
  });
});

describe("copy", () => {
  it("never shows amounts on the lock screen unless the user opted in", () => {
    const d = { name: "Chidi", amount: "₦45,000", when: "tomorrow" as const };
    expect(NOTIFICATIONS.debt_due.copy(d, false).body).toBe("A payment is due tomorrow");
    expect(NOTIFICATIONS.debt_due.copy(d, true).body).toBe("A payment of ₦45,000 from Chidi is due tomorrow");
    expect(NOTIFICATIONS.debt_due.copy({ when: "overdue" }, false).body).toBe("A payment is overdue");
  });
  it("opens the right screen", () => {
    expect(NOTIFICATIONS.checkin_daily.link({})).toBe("/check-in");
    expect(NOTIFICATIONS.comment_reply.link({ postId: "p1" })).toBe("/community/post/p1");
    expect(NOTIFICATIONS.level_up_ready.link({})).toBe("/level-up");
  });
  it("pluralises cheers", () => {
    expect(NOTIFICATIONS.reaction_batch.copy({ count: 1 }, false).body).toBe("1 person cheered your post");
    expect(NOTIFICATIONS.reaction_batch.copy({ count: 12 }, false).body).toBe("12 people cheered your post");
  });
});

describe("categoryOf", () => {
  it("uses the stored category, then the key, then legacy type names", () => {
    expect(categoryOf("anything", "community")).toBe("community");
    expect(categoryOf("debt_due")).toBe("reminders");
    expect(categoryOf("badge_unlocked")).toBe("journey");
    expect(categoryOf("coach")).toBe("spal");
    expect(categoryOf("mystery")).toBe("spal");
  });
});
