// E03 · log customer conversations, tick the checklist, get Spal's recap.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, cleanText, missingTable, notReady, saveFailed, unauthorized } from "@/lib/planning/server";
import { CONVERSATIONS_NEEDED, validationProgress, type Checklist, type Conversation } from "@/lib/engine/planning";
import { spalDraft } from "@/lib/ai/spal";

const KEYS = ["competitors", "price", "pilot"] as const;

export async function PUT(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { checklist?: Record<string, { done?: boolean; note?: string }>; conversations?: Partial<Conversation>[]; recap?: boolean };

  const checklist = Object.fromEntries(KEYS.map((k) => [k, { done: !!b.checklist?.[k]?.done, note: cleanText(b.checklist?.[k]?.note, 300) }])) as Checklist;
  const conversations: Conversation[] = (b.conversations ?? []).slice(0, 50).map((c) => ({
    id: cleanText(c.id, 40) || crypto.randomUUID(),
    name: cleanText(c.name, 60),
    date: /^\d{4}-\d{2}-\d{2}$/.test(c.date ?? "") ? c.date! : new Date().toISOString().slice(0, 10),
    said: cleanText(c.said, 500),
  })).filter((c) => c.name && c.said);
  if (b.conversations && b.conversations.length && !conversations.length) return bad("Add who you spoke to and what they said.");

  const progress = validationProgress(conversations.length, checklist);
  let summary: string | null = null;
  if (b.recap && conversations.length) {
    const drafted = await spalDraft<{ summary?: string }>(user.id,
      `Summarise what a would-be entrepreneur learned from talking to potential customers. Return JSON: {"summary": string} in 3 short sentences: what people liked, what worried them, and one thing to try next. Use only what they said.`,
      JSON.stringify(conversations.map((c) => ({ who: c.name, said: c.said }))));
    summary = cleanText(drafted?.summary, 600) ||
      `You've spoken to ${conversations.length} ${conversations.length === 1 ? "person" : "people"}${progress.talkedEnough ? ", which is enough to start seeing a pattern" : `. ${CONVERSATIONS_NEEDED - conversations.length} more will give you a clearer picture`}. Read their words again and pick one thing to change.`;
  }

  const { error } = await supabase.from("validations").upsert({ user_id: user.id, checklist, customer_conversations: conversations, ...(summary ? { summary } : {}) }, { onConflict: "user_id" });
  if (missingTable(error)) return notReady();
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { progress, summary } });
}
