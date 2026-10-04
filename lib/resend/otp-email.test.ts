import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOTPviaEmail } from "./index";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("sendOTPviaEmail without an API key", () => {
  it("fails in production and never prints the code", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("RESEND_API_KEY", "");
    const log = vi.spyOn(console, "log").mockImplementation(() => {}); const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await sendOTPviaEmail("a@b.com", "123456");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/can't send verification emails/i);
    const printed = [...log.mock.calls, ...err.mock.calls].flat().join(" ");
    expect(printed).not.toContain("123456");
  });
  it("still works in local development by showing the code in the terminal", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("RESEND_API_KEY", "");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect((await sendOTPviaEmail("a@b.com", "654321")).success).toBe(true);
    expect(log.mock.calls.flat().join(" ")).toContain("654321");
  });
  it("uses the configured sender address", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test"); vi.stubEnv("EMAIL_FROM", "Spal <hi@example.com>");
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await sendOTPviaEmail("a@b.com", "111111");
    expect(JSON.parse(String((f.mock.calls[0][1] as RequestInit).body)).from).toBe("Spal <hi@example.com>");
  });
});
