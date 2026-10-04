import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/tts — convert text to speech (returns audio/mpeg stream)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ success: false, error: "text required" }, { status: 400 });

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",        // warm, friendly female voice
      input: text.trim(),
      speed: 1.05,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":  "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control":  "no-store",
      },
    });
  } catch (err) {
    console.error("POST /api/ai/tts", err);
    return NextResponse.json({ success: false, error: "TTS failed" }, { status: 500 });
  }
}
