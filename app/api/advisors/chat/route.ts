import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdvisor } from "@/lib/advisors/config";
import { isProUser } from "@/lib/paywall/isPro";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import OpenAI from "openai";
import type { Badge } from "@/lib/gamification/badges";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { advisorId, message, conversationId } = await req.json();
    if (!advisorId || !message?.trim()) {
      return NextResponse.json({ success: false, error: "advisorId and message required" }, { status: 400 });
    }

    const advisor = getAdvisor(advisorId);
    if (!advisor) {
      return NextResponse.json({ success: false, error: "Unknown advisor" }, { status: 404 });
    }

    // Paywall check — free users can only talk to Ade
    if (!advisor.isFree) {
      const pro = await isProUser(supabase, user.id);
      if (!pro) {
        return NextResponse.json(
          { success: false, error: "upgrade_required", message: "This advisor requires SPAL Pro." },
          { status: 403 }
        );
      }
    }

    // Load or create conversation
    let convId = conversationId;
    let history: Array<{ role: string; content: string }> = [];

    if (convId) {
      const { data: existing } = await supabase
        .from("advisor_conversations")
        .select("messages")
        .eq("id", convId)
        .eq("user_id", user.id)
        .single();
      if (existing) history = existing.messages ?? [];
    }

    // Build messages for OpenAI
    const historyMessages = history.slice(-12).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: advisor.systemPrompt },
        ...historyMessages,
        { role: "user", content: message.trim() },
      ],
      temperature: 0.75,
      max_tokens: 300,
    });

    const reply = response.choices[0]?.message?.content ?? "Sorry, I could not respond. Please try again.";

    // Update conversation
    const updatedMessages = [
      ...history,
      { role: "user", content: message.trim() },
      { role: "assistant", content: reply },
    ];

    if (convId) {
      await supabase
        .from("advisor_conversations")
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq("id", convId)
        .eq("user_id", user.id);
    } else {
      const title = message.trim().slice(0, 60);
      const { data: newConv } = await supabase
        .from("advisor_conversations")
        .insert({
          user_id: user.id,
          advisor_id: advisorId,
          messages: updatedMessages,
          title,
        })
        .select("id")
        .single();
      convId = newConv?.id ?? null;
    }

    // Badge check — first ever advisor chat
    let newBadges: Badge[] = [];
    try {
      newBadges = await checkAndAwardBadges(supabase, user.id, "advisor_chat");
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, data: { reply, conversationId: convId, newBadges } });
  } catch (err) {
    console.error("POST /api/advisors/chat", err);
    return NextResponse.json({ success: false, error: "Failed to get response" }, { status: 500 });
  }
}
