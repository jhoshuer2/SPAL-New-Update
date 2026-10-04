import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { assertCron } from "./send";

const req = (auth?: string) => ({ headers: { get: (k: string) => (k.toLowerCase() === "authorization" ? auth ?? null : null) } }) as unknown as NextRequest;
afterEach(() => vi.unstubAllEnvs());

describe("assertCron", () => {
  it("accepts only the exact secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(assertCron(req("Bearer s3cret"))).toBe(true);
    expect(assertCron(req("Bearer nope"))).toBe(false);
    expect(assertCron(req())).toBe(false);
  });
  it("fails closed when no secret is configured, including the 'Bearer undefined' trick", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(assertCron(req("Bearer undefined"))).toBe(false);
    expect(assertCron(req("Bearer "))).toBe(false);
    expect(assertCron(req())).toBe(false);
  });
});
