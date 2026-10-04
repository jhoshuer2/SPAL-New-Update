import { describe, it, expect } from "vitest";
import { graceDaysLeft, passwordHint, pinProblem } from "./me";

describe("pinProblem", () => {
  it("accepts 4 to 6 digits", () => { expect(pinProblem("4829")).toBeNull(); expect(pinProblem("482915")).toBeNull(); });
  it("rejects wrong length, non-digits, repeats and runs", () => {
    for (const p of ["123", "1234567", "12a4", "1111", "000000", "1234", "4321", "56789"]) expect(pinProblem(p), p).not.toBeNull();
  });
});
describe("passwordHint", () => {
  it("nudges without blocking the reasonable", () => {
    expect(passwordHint("short").ok).toBe(false);
    expect(passwordHint("onlyletters").ok).toBe(false);
    expect(passwordHint("letters123").ok).toBe(true);
    expect(passwordHint("a-much-longer-Pass1").message).toBe("Strong.");
  });
});
describe("graceDaysLeft", () => {
  it("counts whole days and floors at zero", () => {
    const now = Date.parse("2026-10-07T12:00:00Z");
    expect(graceDaysLeft("2026-11-06T12:00:00Z", now)).toBe(30);
    expect(graceDaysLeft("2026-10-08T00:00:00Z", now)).toBe(1);
    expect(graceDaysLeft("2026-10-01T00:00:00Z", now)).toBe(0);
  });
});
