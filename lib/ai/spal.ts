// spal-chat and spal-memory-extract (spec §9.2). Server-only.
import type { SupabaseClient } from "@supabase/supabase-js";
import { askTextFull, extractJSON, MODEL_FAST, MODEL_MAIN } from "./claude";
import { buildContext } from "./context";
import { buildSystemPrompt, MEMORY_SYSTEM } from "./spal-prompt";
import { dedupeFacts, parseSpalReply, type DataRef, type MemoryCategory, type SpalAction } from "@/lib/engine/spal";
import { recordUsage } from "./usage";
import { createAdminClient } from "@/lib/supabase/admin";

export type SpalReply = { reply: string; dataRefs: DataRef[]; actions: SpalAction[]; memoryPaused: boolean };

const CHAT_FALLBACK = "Sorry, I couldn't answer that just now. Please try again in a moment.";

export async function spalChat(opts: {
  supabase: SupabaseClient;
  userId: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  brief?: boolean;
}): Promise<SpalReply> {
  const ctx = await buildContext(opts.supabase, opts.userId, opts.message);
  const system = `${buildSystemPrompt({ level: ctx.level, language: ctx.language, hardSeason: ctx.hardSeason, brief: !!opts.brief, today: new Date().toISOString().slice(0, 10) })}\n\nBUSINESS DATA\n${ctx.text}`;

  const out = await askTextFull({
    model: MODEL_MAIN(),
    system,
    messages: [...opts.history.slice(-10), { role: "user", content: opts.message }],
    maxTokens: 3000, // adaptive thinking shares this budget
    effort: "low",
  });
  await recordUsage(opts.userId, "spal-chat", out.usage);
  if (out.refused || !out.text) return { reply: CHAT_FALLBACK, dataRefs: [], actions: [], memoryPaused: ctx.memoryPaused };

  const json = extractJSON<{ reply?: string; data_refs?: unknown; actions?: unknown }>(out.text);
  // If the model ignored the JSON format, show its text rather than raw braces.
  const plain = out.text.trim().startsWith("{") ? CHAT_FALLBACK : out.text;
  return { ...parseSpalReply(json, plain), memoryPaused: ctx.memoryPaused };
}

/** Pull durable facts out of one exchange. Skipped when the user paused learning. Never throws. */
export async function extractMemory(userId: string, userMessage: string, spalReply: string, paused: boolean): Promise<number> {
  if (paused || userMessage.trim().split(/\s+/).length < 4) return 0;
  try {
    const admin = createAdminClient();
    const out = await askTextFull({
      model: MODEL_FAST(),
      system: MEMORY_SYSTEM,
      messages: [{ role: "user", content: `USER SAID: ${userMessage.slice(0, 1500)}\nCOMPANION REPLIED: ${spalReply.slice(0, 800)}` }],
      maxTokens: 600,
    });
    await recordUsage(userId, "spal-memory-extract", out.usage);
    const parsed = extractJSON<{ facts?: { fact?: string; category?: string }[] }>(out.text);
    const cats: MemoryCategory[] = ["person", "business", "goal", "struggle", "preference", "history"];
    const candidates = (parsed.facts ?? []).flatMap((f) => (f.fact && cats.includes(f.category as MemoryCategory) ? [{ fact: f.fact, category: f.category as MemoryCategory }] : [])).slice(0, 4);
    if (!candidates.length) return 0;
    const { data: existing } = await admin.from("spal_memory").select("fact").eq("user_id", userId).is("deleted_at", null).limit(300);
    const fresh = dedupeFacts((existing ?? []).map((e) => e.fact as string), candidates);
    if (!fresh.length) return 0;
    const { error } = await admin.from("spal_memory").insert(fresh.map((f) => ({ user_id: userId, fact: f.fact, category: f.category, source: "chat", confidence: 0.7 })));
    return error ? 0 : fresh.length;
  } catch { return 0; }
}

// ── spal-draft: structured drafting for the planning studio (spec §9.2) ───────
import { overBudget } from "./usage";

/** Ask Claude for a JSON draft. Returns null when over budget, refused, unparsable or unavailable, so callers fall back. */
export async function spalDraft<T>(userId: string, system: string, content: string, language: "en" | "pcm" = "en"): Promise<T | null> {
  if (!process.env.ANTHROPIC_API_KEY || (await overBudget(userId))) return null;
  try {
    const out = await askTextFull({
      model: MODEL_MAIN(),
      system: `${system}\nWrite in ${language === "pcm" ? "light Nigerian Pidgin" : "plain, warm English"}. Short and concrete. Never invent facts the user didn't give. Return ONLY one JSON object.`,
      messages: [{ role: "user", content }],
      maxTokens: 3000,
      effort: "low",
    });
    await recordUsage(userId, "spal-draft", out.usage);
    if (out.refused || !out.text) return null;
    const json = extractJSON<T>(out.text);
    return Object.keys(json as object).length ? json : null;
  } catch { return null; }
}
