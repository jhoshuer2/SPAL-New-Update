import { describe, it, expect } from "vitest";
import { aggregate, dedupeFacts, describeDataRefs, isSensitiveFact, parseSpalReply, pickQuestion, rankMemories, rhythm, suggestedPrompts, warmReply, type MemoryFact } from "./spal";

describe("memory", () => {
  it("rejects sensitive facts", () => {
    expect(isSensitiveFact("Goes to church every Sunday")).toBe(true);
    expect(isSensitiveFact("Has diabetes")).toBe(true);
    expect(isSensitiveFact("Sells jollof rice near the market")).toBe(false);
  });
  it("dedupes against existing and within the batch, and drops junk", () => {
    const out = dedupeFacts(["Sells jollof rice near the market"], [
      { fact: "Sells jollof rice near the market.", category: "business" },
      { fact: "Wants to open a second shop in Ikeja", category: "goal" },
      { fact: "wants to open a second shop in ikeja", category: "goal" },
      { fact: "Votes APC", category: "preference" },
      { fact: "hi", category: "person" },
    ]);
    expect(out.map((f) => f.fact)).toEqual(["Wants to open a second shop in Ikeja"]);
  });
  it("ranks by relevance first, then recency", () => {
    const f = (id: string, fact: string, days: number): MemoryFact => ({ id, fact, category: "business", created_at: new Date(Date.UTC(2026, 9, 4) - days * 86_400_000).toISOString() });
    const now = Date.UTC(2026, 9, 4);
    const r = rankMemories([f("a", "Sells shoes online", 1), f("b", "Struggles with pricing her shoes", 200), f("c", "Lives in Lagos", 1)], "how should I price my shoes", 2, now);
    expect(r[0].id).toBe("b");
    expect(r).toHaveLength(2);
  });
});

describe("aggregate", () => {
  it("sums windows and owing, never raw rows", () => {
    const rows = [
      { type: "sale" as const, amount: 1000, record_date: "2026-10-04" },
      { type: "expense" as const, amount: 400, record_date: "2026-10-03" },
      { type: "sale" as const, amount: 500, record_date: "2026-09-10", payment_status: "owing" },
      { type: "sale" as const, amount: 9999, record_date: "2026-05-01" },
    ];
    const a = aggregate(rows, "2026-10-04");
    expect(a.last7).toEqual({ moneyIn: 1000, moneyOut: 400, profit: 600 });
    expect(a.last30.moneyIn).toBe(1500);
    expect(a.last90.moneyIn).toBe(1500);
    expect(a.owing).toBe(500);
  });
});

describe("parseSpalReply", () => {
  it("keeps valid actions and refs, drops invented ones", () => {
    const r = parseSpalReply({
      reply: "Try raising your price by ₦200.",
      data_refs: [{ type: "sales", range: "last_30_days" }, { type: "bank", range: "x" }],
      actions: [
        { type: "save_goal", label: "Save goal", goal_type: "monthly_sales", target_amount: 300000 },
        { type: "send_sms", label: "Text customers" },
        { type: "save_moment", label: "Save", moment_type: "lesson", text: "Prices matter" },
        { type: "save_goal", goal_type: "nonsense", target_amount: 5 },
      ],
    }, "fallback");
    expect(r.dataRefs).toEqual([{ type: "sales", range: "last_30_days" }]);
    expect(r.actions.map((a) => a.type)).toEqual(["save_goal", "save_moment"]);
  });
  it("falls back to plain text", () => {
    expect(parseSpalReply(null, "  hello  ").reply).toBe("hello");
  });
  it("describes data used", () => {
    expect(describeDataRefs([{ type: "sales", range: "last_30_days" }])).toBe("Based on your sales from the last 30 days");
    expect(describeDataRefs([])).toBeNull();
  });
});

describe("check-ins", () => {
  const ctx = { hasEverRecorded: true, salesToday: 0, hardSeason: false };
  it("is deterministic for a seed and skips recent questions", () => {
    const q1 = pickQuestion(1, ctx, [], 0);
    const q2 = pickQuestion(1, ctx, [q1.question], 0);
    expect(q2.question).not.toBe(q1.question);
  });
  it("hard season gets gentle questions only, and never asks about sales", () => {
    const q = pickQuestion(1, { ...ctx, hardSeason: true }, [], 3);
    expect(q.key.startsWith("hard_")).toBe(true);
  });
  it("does not ask about today's sales before the first record", () => {
    for (let s = 0; s < 8; s++) expect(pickQuestion(1, { ...ctx, hasEverRecorded: false }, [], s).key.endsWith("_sales")).toBe(false);
  });
  it("counts rhythm without ever 'breaking'", () => {
    expect(rhythm(["2026-10-04", "2026-10-02", "2026-09-01"], "2026-10-04")).toBe(2);
  });
  it("replies warmly and never shames a slow day", () => {
    expect(warmReply("Slow", false)).toMatch(/every business/);
    expect(warmReply("No sales", false)).not.toMatch(/fail|bad|should have/i);
  });
});

describe("suggested prompts", () => {
  it("softens in hard season", () => {
    expect(suggestedPrompts(2, { hasEverRecorded: true, hardSeason: true })[0]).toMatch(/slow month/);
  });
});

describe("findQuestion", () => {
  it("finds choices by text and returns undefined for unknown", async () => {
    const { findQuestion } = await import("./spal");
    expect(findQuestion("How did sales go today?")?.choices).toEqual(["Great", "OK", "Slow", "No sales"]);
    expect(findQuestion("nope")).toBeUndefined();
  });
});
