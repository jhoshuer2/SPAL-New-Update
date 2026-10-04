/**
 * SPAL OpenAI functions — GPT-4o calls
 */
import OpenAI from "openai";
import {
  PARSE_RECORD_PROMPT,
  IMPORT_RECORDS_PROMPT,
  buildDailyInsightPrompt,
  buildChatSystemPrompt,
} from "./prompts";
import type { ChatMessage } from "@/lib/types";
import { normalizeCategory } from "@/lib/utils/category";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Parse records from natural language ──────────────────────────────────────
export async function parseRecordsFromText(text: string): Promise<
  Array<{ type: "sale" | "expense"; qty: number; unit_price: number; amount: number; description: string; category: string; payment_status: "paid" | "owing"; customer_name: string | null }>
> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PARSE_RECORD_PROMPT },
      { role: "user",   content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed  = JSON.parse(content);
  return parsed.records ?? [];
}

// ─── Import records: parse from text (batch import flow) ─────────────────────
export interface ImportedRecord {
  type:           "sale" | "expense";
  amount:         number;
  description:    string;
  category:       string;
  record_date:    string | null;
  confidence:     "high" | "low";
  payment_status: "paid" | "owing";
  customer_name:  string | null;
}

export async function parseImportFromText(text: string): Promise<ImportedRecord[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: IMPORT_RECORDS_PROMPT },
      { role: "user",   content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 2000,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  return (JSON.parse(content).records ?? []) as ImportedRecord[];
}

export async function parseImportFromImage(base64: string, mimeType: string): Promise<ImportedRecord[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: IMPORT_RECORDS_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
          },
          {
            type: "text",
            text: "Read all the records from this image and extract them as structured JSON.",
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 2000,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  return (JSON.parse(content).records ?? []) as ImportedRecord[];
}

// ─── Generate daily insight ───────────────────────────────────────────────────
export async function generateDailyInsight(data: {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  records: Array<{ type: string; amount: number; description?: string; category?: string }>;
  businessType: string;
  currency: string;
  businessGoals?: string[];
}): Promise<{ insight: string; message: string }> {
  // Find top expense and top sale
  const sales    = data.records.filter(r => r.type === "sale");
  const expenses = data.records.filter(r => r.type === "expense");
  const topSale    = sales.sort((a, b) => b.amount - a.amount)[0];
  const topExpense = expenses.sort((a, b) => b.amount - a.amount)[0];

  const prompt = buildDailyInsightPrompt({
    sales:         data.totalSales,
    expenses:      data.totalExpenses,
    profit:        data.profit,
    businessType:  data.businessType,
    recordCount:   data.records.length,
    topSale:       topSale?.description ?? undefined,
    topExpense:    topExpense?.description ?? undefined,
    businessGoals: data.businessGoals,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const result  = JSON.parse(content);

  return {
    insight: result.insight ?? "You tracked your business today. Keep it up!",
    message: result.message ?? "Nice work recording today!",
  };
}

// ─── Parse a receipt / invoice image via GPT-4o vision ───────────────────────
export async function parseReceiptImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<Array<{
  type: "sale" | "expense";
  amount: number;
  description: string;
  category: string;
}> | null> {
  const base64   = imageBuffer.toString("base64");
  const imageUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            // "high" detail is essential for reading handwritten line-item lists accurately
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
          {
            type: "text",
            text: `You are helping a small business owner in Nigeria record their sales and expenses.
This image may be a receipt, an invoice, or a hand-written list of items with prices.

Read EVERY line and extract EACH item as its own entry — never merge separate lines into one total.
For example, a list like:
  Rice and Beans = ₦2,000
  Fish stew and Rice = ₦4,000
  Indomie and Egg = ₦2,500
must return THREE separate items (2000, 4000, 2500), NOT one combined "Food sales" of 8500.

Return ONLY valid JSON in this exact shape:
{
  "items": [
    { "type": "sale" or "expense", "amount": number, "description": "the item name", "category": "best match" }
  ]
}

Rules:
- One object per written line that has a price. Preserve the order.
- "description" is the item exactly as written, e.g. "Rice and Beans", "Fish stew and Rice", "Fuel 20 litres".
- "amount" is that line's price as a plain number (no ₦ symbol, no commas). Convert shorthand: 15k=15000, 2.5m=2500000.
- "type" is "sale" if money was RECEIVED (goods/services sold), "expense" if money was PAID (stock, fuel, etc.). A price list of food/products a vendor sells is "sale".
- "category" must be EXACTLY one of: Food, Drinks, Clothing, Services, Products, Stock, Fuel, Transport, Rent, Salary, Utilities, Other. Never invent variations like "Food Sales" or "Groceries".
- Read carefully — hand-written amounts can be faint. Do not skip any line.
- If the image is truly unreadable or has no prices, return {"items":[]}.
Do NOT include any text outside the JSON.`,
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed  = JSON.parse(content);
  const rawItems: unknown[] = Array.isArray(parsed.items) ? parsed.items : [];

  const items = rawItems
    .map((it) => {
      const r = it as { type?: string; amount?: unknown; description?: unknown; category?: unknown };
      return {
        type: (r.type === "expense" ? "expense" : "sale") as "sale" | "expense",
        amount: Number(r.amount),
        description: String(r.description ?? "").slice(0, 100),
        category: normalizeCategory(String(r.category ?? "Other")),
      };
    })
    .filter((it) => it.amount > 0 && it.description.trim());

  return items.length > 0 ? items : null;
}

// ─── Ask SPAL chat ────────────────────────────────────────────────────────────
export async function askSPAL(data: {
  message: string;
  history: ChatMessage[];
  user: { full_name?: string; business_type?: string; business_name?: string };
  summaries: Array<{
    summary_date: string;
    total_sales: number;
    total_expenses: number;
    profit: number;
  }>;
  dailyBreakdown?: Array<{ date: string; sales: number; expenses: number; profit: number }>;
  recentRecords?: Array<{ type: string; amount: number; description: string; date: string }>;
  currency: string;
  brief?: boolean; // voice mode — keep the reply short so speech is fast & consistent
}): Promise<string> {
  // Prefer live records-based breakdown; fall back to summaries if no records
  const breakdown = (data.dailyBreakdown && data.dailyBreakdown.length > 0)
    ? data.dailyBreakdown
    : data.summaries.map(s => ({
        date:     s.summary_date,
        sales:    Number(s.total_sales),
        expenses: Number(s.total_expenses),
        profit:   Number(s.profit),
      }));

  const latest    = breakdown[breakdown.length - 1];
  const weekSales = breakdown.reduce((s, d) => s + d.sales,    0);
  const weekExp   = breakdown.reduce((s, d) => s + d.expenses, 0);
  const weekProfit = weekSales - weekExp;

  const systemPrompt = buildChatSystemPrompt({
    userName:     data.user.full_name,
    businessType: data.user.business_type ?? "other",
    businessName: data.user.business_name,
    recentSummary: latest
      ? {
          sales:    latest.sales,
          expenses: latest.expenses,
          profit:   latest.profit,
          date:     latest.date,
        }
      : undefined,
    weekSales,
    weekExpenses: weekExp,
    weekProfit,
    dailyBreakdown: breakdown,
    recentRecords:  data.recentRecords,
  });

  // Convert history to OpenAI messages (last 10 turns)
  const historyMessages = data.history.slice(-10).map(m => ({
    role:    m.role as "user" | "assistant",
    content: m.content,
  }));

  // Voice replies are spoken aloud, so keep them short — this is the biggest
  // lever for fast, consistent TTS (shorter reply = quicker, steadier playback).
  const voiceSuffix = data.brief
    ? "\n\nIMPORTANT: This answer will be spoken out loud. Reply in 1–2 short sentences, straight to the point. No lists, no markdown, no long explanations."
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt + voiceSuffix },
      ...historyMessages,
      { role: "user",   content: data.message },
    ],
    temperature: 0.7,
    max_tokens: data.brief ? 130 : 300,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I could not answer that. Please try again.";
}

// ─── Vision: read an uploaded image/document and answer in text (OCR + reasoning)
export async function askVision(data: { message: string; imageUrl: string; currency?: string }): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are SPAL, a friendly business assistant for small African businesses. " +
          "Read the attached image or document (receipts, invoices, notes, product photos) using OCR, " +
          "then answer the user's question in clear, simple English. Amounts are in " +
          (data.currency ?? "NGN") + ". Keep it short and practical. Never use jargon like revenue, ledger or reconcile.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: data.message || "What does this show? Summarise the key details for my business." },
          { type: "image_url", image_url: { url: data.imageUrl } },
        ],
      },
    ],
    max_tokens: 600,
    temperature: 0.3,
  });
  return response.choices[0]?.message?.content?.trim() ?? "I couldn't read that clearly. Please try a clearer photo.";
}
