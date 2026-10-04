import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Fakes: Claude and Supabase. The real prompt/parse/memory logic runs on top of them. ──
const claudeCalls: { system?: string; model?: string; messages: { role: string; content: unknown }[] }[] = [];
let claudeText = "";
vi.mock("./claude", async () => {
  const actual = await vi.importActual<typeof import("./claude")>("./claude");
  return {
    ...actual,
    askTextFull: vi.fn(async (o: { system?: string; model?: string; messages: { role: string; content: unknown }[] }) => {
      claudeCalls.push(o);
      return { text: claudeText, usage: { input: 100, output: 50 }, refused: false };
    }),
  };
});

type Tables = Record<string, { data: unknown; error?: { code?: string } | null }>;
let tables: Tables = {};
const inserted: { table: string; rows: unknown }[] = [];
const fake = () => ({
  from: (table: string) => {
    const res = () => tables[table] ?? { data: [], error: null };
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "gte", "is", "not", "order", "limit", "update", "in"]) q[m] = () => q;
    q.single = async () => ({ data: Array.isArray(res().data) ? (res().data as unknown[])[0] ?? null : res().data, error: res().error ?? null });
    q.maybeSingle = q.single;
    q.insert = async (rows: unknown) => { inserted.push({ table, rows }); return { error: null }; };
    q.upsert = async () => ({ error: null });
    q.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: res().data, error: res().error ?? null, count: 0 }).then(ok);
    return q;
  },
});
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fake() }));

import { spalChat, extractMemory } from "./spal";
import { overBudget } from "./usage";

const today = new Date().toISOString().slice(0, 10);
beforeEach(() => {
  claudeCalls.length = 0; inserted.length = 0; claudeText = "";
  tables = {
    users: { data: [{ display_name: "Ada", current_level: 1, language: "en", hard_season: false, memory_paused: false, business_name: "Ada Eats", business_type: "food_seller", state: "Lagos" }] },
    records: { data: [
      { type: "sale", amount: 10000, description: "Jollof rice", record_date: today, payment_status: "paid" },
      { type: "expense", amount: 4000, description: "Rice", record_date: today },
      { type: "sale", amount: 2500, description: "Jollof rice", record_date: today, payment_status: "owing" },
    ] },
    spal_memory: { data: [{ id: "m1", fact: "Sells jollof rice near Yaba market", category: "business", created_at: new Date().toISOString() }] },
    user_goals: { data: [{ goal_type: "monthly_sales", target_amount: 300000 }] },
  };
});

describe("spalChat", () => {
  it("grounds the prompt in aggregated data, never raw rows, and parses a structured reply", async () => {
    claudeText = JSON.stringify({ reply: "You made ₦12,500 this week. Nice.", data_refs: [{ type: "sales", range: "last_7_days" }], actions: [{ type: "save_goal", label: "Save goal", goal_type: "monthly_sales", target_amount: 400000 }, { type: "wire_money", label: "Pay" }] });
    const r = await spalChat({ supabase: fake() as never, userId: "u1", message: "how are my sales this week", history: [] });
    expect(r.reply).toBe("You made ₦12,500 this week. Nice.");
    expect(r.dataRefs).toEqual([{ type: "sales", range: "last_7_days" }]);
    expect(r.actions.map((a) => a.type)).toEqual(["save_goal"]); // invented action dropped
    const system = claudeCalls[0].system!;
    expect(system).toContain("Level 1 (Starter)");
    expect(system).toContain("Sells jollof rice near Yaba market"); // memory included
    expect(system).toMatch(/money in .*12,500/); // aggregate present
    expect(system).not.toContain("4000"); // raw rows are not listed
    expect(system).toContain("monthly sales target");
  });

  it("uses Pidgin and gentle mode from the profile", async () => {
    tables.users = { data: [{ current_level: 2, language: "pcm", hard_season: true }] };
    claudeText = JSON.stringify({ reply: "E go better." });
    await spalChat({ supabase: fake() as never, userId: "u1", message: "things are hard", history: [] });
    const system = claudeCalls[0].system!;
    expect(system).toContain("Nigerian Pidgin");
    expect(system).toContain("hard season");
  });

  it("shows plain text if the model ignores the JSON format, and never leaks raw braces", async () => {
    claudeText = "Try asking three customers what they'd pay.";
    expect((await spalChat({ supabase: fake() as never, userId: "u1", message: "pricing?", history: [] })).reply).toBe("Try asking three customers what they'd pay.");
    claudeText = '{"reply": "cut off';
    const broken = await spalChat({ supabase: fake() as never, userId: "u1", message: "pricing?", history: [] });
    expect(broken.reply).not.toContain("{");
  });

  it("logs token usage", async () => {
    claudeText = JSON.stringify({ reply: "ok" });
    await spalChat({ supabase: fake() as never, userId: "u1", message: "hello there friend", history: [] });
    expect(inserted.find((i) => i.table === "ai_usage")?.rows).toMatchObject({ user_id: "u1", function: "spal-chat", input_tokens: 100, output_tokens: 50 });
  });
});

describe("extractMemory", () => {
  it("saves new durable facts, skipping duplicates and sensitive details", async () => {
    claudeText = JSON.stringify({ facts: [
      { fact: "Sells jollof rice near Yaba market", category: "business" },
      { fact: "Wants to open a second kitchen in Ikeja", category: "goal" },
      { fact: "Goes to church on Sundays", category: "person" },
    ] });
    const n = await extractMemory("u1", "I sell jollof rice and I want to open a second kitchen in Ikeja", "Great plan", false);
    expect(n).toBe(1);
    const row = (inserted.find((i) => i.table === "spal_memory")!.rows as { fact: string; user_id: string }[])[0];
    expect(row.fact).toBe("Wants to open a second kitchen in Ikeja");
    expect(row.user_id).toBe("u1");
  });
  it("does nothing when learning is paused or the message is tiny", async () => {
    claudeText = JSON.stringify({ facts: [{ fact: "Sells shoes in Aba market", category: "business" }] });
    expect(await extractMemory("u1", "I sell shoes in Aba market every day", "ok", true)).toBe(0);
    expect(await extractMemory("u1", "hi", "ok", false)).toBe(0);
    expect(claudeCalls).toHaveLength(0);
  });
});

describe("budget", () => {
  it("blocks only past the daily limit, and never blocks when usage can't be read", async () => {
    process.env.SPAL_DAILY_TOKEN_BUDGET = "1000";
    tables.ai_usage = { data: [{ input_tokens: 400, output_tokens: 200 }] };
    expect(await overBudget("u1")).toBe(false);
    tables.ai_usage = { data: [{ input_tokens: 800, output_tokens: 300 }] };
    expect(await overBudget("u1")).toBe(true);
    tables.ai_usage = { data: null, error: { code: "42P01" } };
    expect(await overBudget("u1")).toBe(false);
    delete process.env.SPAL_DAILY_TOKEN_BUDGET;
  });
});
