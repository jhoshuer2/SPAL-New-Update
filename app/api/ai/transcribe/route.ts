import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/transcribe — audio blob → text via Whisper
// Expects FormData with an "audio" field (Blob/File)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ success: false, error: "Audio file required" }, { status: 400 });
    }

    // File size guard — Whisper limit is 25 MB
    if (audioFile.size > 24 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Recording too long. Please keep it under 2 minutes." }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      // Language hint for Nigerian English / code-switching
      language: "en",
      prompt:
        "Business record from a small Nigerian business. May include amounts like '15k', '2,000', sales, expenses, fuel, food, drinks.",
    });

    const text = transcription.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ success: false, error: "Could not hear anything. Please try again." }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { text } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    console.error("[transcribe]", msg);
    return NextResponse.json({ success: false, error: "Could not transcribe audio. Please try again." }, { status: 500 });
  }
}
