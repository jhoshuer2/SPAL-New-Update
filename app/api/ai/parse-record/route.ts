import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRecordsFromText } from "@/lib/openai/chat";

// POST /api/ai/parse-record — parse natural language into structured records
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ success: false, error: "text required" }, { status: 400 });

    const records = await parseRecordsFromText(text);
    return NextResponse.json({ success: true, data: records });
  } catch (err) {
    console.error("POST /api/ai/parse-record", err);
    return NextResponse.json({ success: false, error: "Failed to parse" }, { status: 500 });
  }
}
