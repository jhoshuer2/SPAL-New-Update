/**
 * POST /api/advisors/voice
 * Full voice conversation pipeline in one round-trip:
 *   1. Whisper — transcribe user audio
 *   2. GPT-4o-mini — generate advisor reply
 *   3. OpenAI TTS — convert reply to speech
 * Returns: { userText, replyText, audioBase64, conversationId }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdvisor } from "@/lib/advisors/config";
import { isProUser } from "@/lib/paywall/isPro";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import type { Badge } from "@/lib/gamification/badges";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Each advisor has a distinct TTS voice
const VOICE_MAP: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
  ade:    "alloy",    // warm, neutral
  chioma: "shimmer",  // bright, professional
  emeka:  "onyx",     // deep, confident
  fatima: "nova",     // gentle, calm
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const audio        = formData.get("audio")          as File   | null;
    const advisorId    = formData.get("advisorId")      as string | null;
    const convIdRaw    = formData.get("conversationId") as string | null;
    const conversationId = convIdRaw && convIdRaw !== "null" ? convIdRaw : null;

    if (!audio || !advisorId) {
      return NextResponse.json({ success: false, error: "audio and advisorId are required" }, { status: 400 });
    }

    const advisor = getAdvisor(advisorId);
    if (!advisor) return NextResponse.json({ success: false, error: "Unknown advisor" }, { status: 404 });

    // Paywall check
    if (!advisor.isFree) {
      const pro = await isProUser(supabase, user.id);
      if (!pro) {
        return NextResponse.json(
          { success: false, error: "upgrade_required" },
          { status: 403 }
        );
      }
    }

    // ── 1. Transcribe ─────────────────────────────────────────────────────────
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file:  audio,
      response_format: "text",
    });
    const userText = (transcription as unknown as string).trim();
    if (!userText) {
      return NextResponse.json(
        { success: false, error: "no_speech", message: "I didn't catch that. Please try again." },
        { status: 400 }
      );
    }

    // ── 2. Load conversation history ──────────────────────────────────────────
    let history: Array<{ role: string; content: string }> = [];
    let convId = conversationId;

    if (convId) {
      const { data: existing } = await supabase
        .from("advisor_conversations")
        .select("messages")
        .eq("id", convId)
        .eq("user_id", user.id)
        .single();
      if (existing) history = existing.messages ?? [];
    }

    // ── 3. Generate reply ─────────────────────────────────────────────────────
    const historyMsgs = history.slice(-10).map((m) => ({
      role:    m.role    as "user" | "assistant",
      content: m.content,
    }));

    const chatRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          // Append voice-specific instruction: shorter replies, conversational tone
          content: advisor.systemPrompt +
            "\n\nIMPORTANT: You are speaking out loud — the user hears you, not reads you. " +
            "Keep replies SHORT (2-3 sentences max). No bullet points or lists. " +
            "NEVER start by introducing yourself or saying your name/title — the user already knows who you are. " +
            "Jump straight into your response. Speak naturally like you're mid-conversation.",
        },
        ...historyMsgs,
        { role: "user", content: userText },
      ],
      temperature: 0.8,
      max_tokens:  180,
    });

    const replyText = chatRes.choices[0]?.message?.content ??
      "Sorry, I couldn't respond right now. Please try again.";

    // ── 4. TTS — convert reply to speech ─────────────────────────────────────
    const voice = VOICE_MAP[advisorId] ?? "alloy";

    const ttsRes = await openai.audio.speech.create({
      model: "tts-1-hd",   // higher quality, more natural
      voice,
      input: replyText,
      speed: 0.95,          // slightly slower = warmer, more human
    });

    const audioBuf  = await ttsRes.arrayBuffer();
    const audioBase64 = `data:audio/mpeg;base64,${Buffer.from(audioBuf).toString("base64")}`;

    // ── 5. Save conversation ──────────────────────────────────────────────────
    const updatedMessages = [
      ...history,
      { role: "user",      content: userText   },
      { role: "assistant", content: replyText  },
    ];

    if (convId) {
      await supabase
        .from("advisor_conversations")
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq("id", convId)
        .eq("user_id", user.id);
    } else {
      const { data: newConv } = await supabase
        .from("advisor_conversations")
        .insert({
          user_id:    user.id,
          advisor_id: advisorId,
          messages:   updatedMessages,
          title:      userText.slice(0, 60),
        })
        .select("id")
        .single();
      convId = newConv?.id ?? null;
    }

    // ── 6. Badge check ────────────────────────────────────────────────────────
    let newBadges: Badge[] = [];
    try {
      newBadges = await checkAndAwardBadges(supabase, user.id, "advisor_chat");
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      data: { userText, replyText, audioBase64, conversationId: convId, newBadges },
    });
  } catch (err) {
    console.error("POST /api/advisors/voice", err);
    return NextResponse.json({ success: false, error: "Voice processing failed" }, { status: 500 });
  }
}
