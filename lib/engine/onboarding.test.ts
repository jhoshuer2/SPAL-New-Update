import { describe, it, expect } from "vitest";
import { placeFromAnswers, needsConflictFollowUp, templateReflection, legacyBusinessType, type OnboardingAnswers } from "./onboarding";

const base: OnboardingAnswers = { name: "Ada", state: "Lagos", city: "Ikeja", language: "en", challenges: [], goals: [] };

describe("onboarding", () => {
  it("places a food seller who sells but is unregistered at Level 1", () => {
    const p = placeFromAnswers({ ...base, businessType: "food", hasSold: true, isRegistered: false, monthsRunning: 8 });
    expect(p.level).toBe(1);
    expect(p.signals).toHaveLength(3);
  });
  it("flags never-sold with income as a conflict", () => {
    expect(needsConflictFollowUp({ ...base, hasSold: false, revenueBand: 2 })).toBe(true);
    expect(needsConflictFollowUp({ ...base, hasSold: false, revenueBand: 0 })).toBe(false);
  });
  it("builds a 1-3 sentence fallback reflection", () => {
    const r = templateReflection({ ...base, businessType: "food", hasSold: true, monthsRunning: 8, challenges: ["My money is unclear"], goals: ["Record my sales every day"] });
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r[0]).toContain("food & drinks");
  });
  it("maps new types onto the legacy constraint", () => {
    expect(legacyBusinessType("food")).toBe("food_seller");
    expect(legacyBusinessType("tech")).toBe("other");
  });
});

describe("copy", () => {
  it("describes duration loosely, never as a fake exact number", () => {
    const r = templateReflection({ ...base, businessType: "food", hasSold: true, monthsRunning: 6, challenges: ["My money is unclear"], goals: [] });
    expect(r[0]).toBe("You work in food & drinks and you've been running for under a year.");
    expect(r[1]).toBe("On your mind: “My money is unclear”.");
  });
});
