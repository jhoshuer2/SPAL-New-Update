import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { askSPAL, askVision } from "@/lib/ai/chat";
import { todayISO, weekStartISO } from "@/lib/utils/dates";
import { extractMemory, spalChat } from "@/lib/ai/spal";
import { LIMIT_MESSAGE, overBudget } from "@/lib/ai/usage";
import type { DataRef, SpalAction } from "@/lib/engine/spal";

// POST /api/ai/chat — Ask SPAL a question
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { message, conversationId, dryRun, precomputedReply, mode, attachmentUrl } = await req.json();
    if (!message?.trim()) return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    // Daily AI budget (spec §9.1): a friendly message, never an error.
    if (await overBudget(user.id)) {
      return NextResponse.json({ success: true, data: { reply: LIMIT_MESSAGE, limited: true, conversationId } });
    }
    // dryRun   = compute the reply but don't save (speculative prefetch while the user is still talking)
    // precomputedReply = skip the AI call, just persist a reply we already computed during prefetch

    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const admin = createAdminClient();

    // Fetch all context in parallel — these are independent, so don't await
    // them one after another (that was adding round-trips to every voice reply).
    const [
      { data: userData },
      { data: recentRecords },
      { data: summaries },
      conversationRes,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("full_name, business_type, business_name, currency")
        .eq("id", user.id)
        .single(),
      // Actual records for the last 8 days — source of truth, always up to date
      supabase
        .from("records")
        .select("type, amount, description, category, created_at")
        .eq("user_id", user.id)
        .gte("created_at", eightDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),
      // Summaries as a fallback for days not covered by the records window
      supabase
        .from("daily_summaries")
        .select("summary_date, total_sales, total_expenses, profit")
        .eq("user_id", user.id)
        .gte("summary_date", weekAgo.toISOString().split("T")[0])
        .order("summary_date", { ascending: true }),
      // Load conversation (if continuing one)
      conversationId
        ? admin.from("conversations").select("*").eq("id", conversationId).eq("user_id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);

    const conversation = conversationRes?.data ?? null;

    // Compute per-day totals from records
    const dailyMap: Record<string, { sales: number; expenses: number; profit: number }> = {};
    for (const r of (recentRecords ?? [])) {
      const date = r.created_at.split("T")[0]; // YYYY-MM-DD (UTC)
      if (!dailyMap[date]) dailyMap[date] = { sales: 0, expenses: 0, profit: 0 };
      const amt = Number(r.amount);
      if (r.type === "sale") {
        dailyMap[date].sales   += amt;
        dailyMap[date].profit  += amt;
      } else {
        dailyMap[date].expenses += amt;
        dailyMap[date].profit   -= amt;
      }
    }
    const dailyBreakdown = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b)) // oldest first
      .map(([date, totals]) => ({ date, ...totals }));

    const history = conversation?.messages ?? [];
    const newUserMsg = { role: "user" as const, content: message, timestamp: new Date().toISOString() };

    // Graph / Analytics modes: instruct the model to reply as a structured block
    // that the client renders as a chart or metric cards (not plain text).
    const FORMAT: Record<string, string> = {
      graph: "\n\nRespond ONLY with a fenced code block starting with ```chart and containing JSON: " +
        '{"title": string, "chartType": "bar"|"line", "data": [{"label": string, "value": number}], "summary": string}. ' +
        "Use the business's real figures from the data above. Do not write any text outside the code block.",
      analytics: "\n\nRespond ONLY with a fenced code block starting with ```analytics and containing JSON: " +
        '{"title": string, "metrics": [{"label": string, "value": string}], "summary": string}. ' +
        "Use the business's real figures from the data above. Do not write any text outside the code block.",
    };
    const augmentedMessage = mode && FORMAT[mode] ? message + FORMAT[mode] : message;

    // Normal chat goes through Spal's grounded companion. Graph/analytics modes and image
    // attachments keep their specialised paths (structured blocks / vision).
    let dataRefs: DataRef[] = [];
    let actions: SpalAction[] = [];
    let memoryPaused = true;
    let reply: string;
    if (precomputedReply?.trim()) {
      reply = precomputedReply.trim();
    } else if (attachmentUrl) {
      reply = await askVision({ message, imageUrl: attachmentUrl, currency: userData?.currency ?? "NGN" });
    } else if (mode) {
      reply = await askSPAL({
        message: augmentedMessage,
        history,
        user: userData ?? {},
        summaries: summaries ?? [],
        dailyBreakdown,
        recentRecords: (recentRecords ?? []).slice(0, 30).map(r => ({
          type:        r.type,
          amount:      Number(r.amount),
          description: r.description ?? r.category ?? r.type,
          date:        r.created_at.split("T")[0],
        })),
        currency: userData?.currency ?? "NGN",
        brief: false,
      });
    } else {
      const r = await spalChat({
        supabase, userId: user.id, message,
        history: history.slice(-10).map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content })),
        brief: !!dryRun, // spoken replies (voice prefetch) stay to a sentence or two
      });
      reply = r.reply; dataRefs = r.dataRefs; actions = r.actions; memoryPaused = r.memoryPaused;
    }

    // Speculative prefetch: return the reply without saving anything.
    if (dryRun) {
      return NextResponse.json({ success: true, data: { reply, dataRefs, actions } });
    }

    const newAssistantMsg = { role: "assistant" as const, content: reply, timestamp: new Date().toISOString(), ...(dataRefs.length ? { dataRefs } : {}), ...(actions.length ? { actions } : {}) };
    const updatedMessages = [...history, newUserMsg, newAssistantMsg];

    // Save conversation
    let savedConvId = conversationId;
    if (conversation) {
      await admin.from("conversations").update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      }).eq("id", conversationId);
    } else {
      // Live table has no `title` column (predates migration 018) — title is
      // derived from the first message on read, so don't insert it here.
      const { data: newConv } = await admin
        .from("conversations")
        .insert({ user_id: user.id, messages: updatedMessages })
        .select("id")
        .single();
      savedConvId = newConv?.id;
    }

    // Learn from the exchange after the response is sent (skipped if the user paused learning).
    if (!mode && !attachmentUrl && !precomputedReply?.trim() && !memoryPaused) {
      after(() => extractMemory(user.id, message, reply, false));
    }

    return NextResponse.json({
      success: true,
      data: { reply, dataRefs, actions, conversationId: savedConvId },
    });
  } catch (err) {
    console.error("POST /api/ai/chat", err);
    return NextResponse.json({ success: false, error: "Failed to get response" }, { status: 500 });
  }
}
