import { NextRequest, NextResponse } from "next/server";
import { askJSON, MODEL_FAST } from "@/lib/ai/claude";

const SYSTEM_PROMPT = `You are SPAL, a friendly business coach for small business owners in Africa (food sellers, market traders, salon owners, fashion vendors, kiosk owners).

A user just spoke their business goals for the day. Turn what they said into clear, practical goals — each broken into a few simple action steps.

Rules:
- Extract every distinct goal the user mentioned.
- Give each goal a short, encouraging title (max ~6 words). No jargon.
- Break each goal into 3–5 short, practical steps a small business owner can actually do today.
- Keep every step under ~7 words.
- Use simple everyday language. Never use words like revenue, expenditure, ledger, reconcile.
- Never invent goals or unrealistic tasks the user did not imply.
- If a money amount is mentioned, keep it in the title (e.g. "Sell over ₦25,000").

Respond ONLY with JSON in this exact shape:
{
  "goals": [
    { "title": "Record all sales today", "breakdowns": ["Record morning sales", "Record afternoon sales", "Record evening sales", "Verify total before closing"] }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript?.trim()) {
      return NextResponse.json({ success: false, error: "Transcript required" }, { status: 400 });
    }

    const parsed = await askJSON<{ goals?: { title?: string; breakdowns?: string[] }[] }>({
      model: MODEL_FAST(),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript }],
      maxTokens: 1500,
    });

    const goals = (parsed.goals ?? [])
      .filter((g) => g.title?.trim())
      .map((g) => ({
        title: g.title!.trim(),
        breakdowns: (g.breakdowns ?? [])
          .filter((b) => b?.trim())
          .slice(0, 5)
          .map((b) => b.trim()),
      }))
      .filter((g) => g.breakdowns.length > 0);

    return NextResponse.json({ success: true, data: { goals } });
  } catch (err) {
    console.error("POST /api/ai/extract-goals", err);
    return NextResponse.json({ success: false, error: "Failed to plan goals" }, { status: 500 });
  }
}
