import { describe, it, expect } from "vitest";
import { checkPin, hashPin, LOCK_AFTER_MS, shouldLock, waitAfterFailures } from "./core";

describe("PIN hashing", () => {
  it("accepts the right PIN and rejects a wrong one", async () => {
    const s = await hashPin("4829");
    expect(await checkPin("4829", s)).toBe(true);
    expect(await checkPin("4828", s)).toBe(false);
    expect(await checkPin("", s)).toBe(false);
  });
  it("salts: the same PIN hashes differently each time, and the PIN is never stored", async () => {
    const a = await hashPin("4829"), b = await hashPin("4829");
    expect(a.hash).not.toBe(b.hash);
    expect(JSON.stringify(a)).not.toContain("4829");
  });
});

describe("shouldLock", () => {
  const base = { enabled: true, unlockedThisSession: true, hiddenAt: null as number | null, now: 1_000_000 };
  it("never locks when the lock is off", () => expect(shouldLock({ ...base, enabled: false, unlockedThisSession: false })).toBe(false));
  it("locks on a cold start", () => expect(shouldLock({ ...base, unlockedThisSession: false })).toBe(true));
  it("locks only after more than 5 minutes in the background", () => {
    expect(shouldLock({ ...base, hiddenAt: base.now - LOCK_AFTER_MS })).toBe(false);
    expect(shouldLock({ ...base, hiddenAt: base.now - LOCK_AFTER_MS - 1 })).toBe(true);
    expect(shouldLock({ ...base, hiddenAt: base.now - 10_000 })).toBe(false);
  });
});

describe("waitAfterFailures", () => {
  it("is free for the first four tries, then backs off", () => {
    expect([0, 3, 4].map(waitAfterFailures)).toEqual([0, 0, 0]);
    expect([5, 6, 7, 8, 20].map(waitAfterFailures)).toEqual([30_000, 60_000, 300_000, 900_000, 900_000]);
  });
});
