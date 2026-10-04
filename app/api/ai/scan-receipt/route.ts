/**
 * POST /api/ai/scan-receipt
 * Accepts a multipart image upload (field: "image"), runs it through
 * GPT-4o vision, and returns extracted { type, amount, description, category }.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptImage } from "@/lib/openai/chat";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const image    = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "File must be an image" }, { status: 400 });
    }
    if (image.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Image too large (max 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const result = await parseReceiptImage(buffer, image.type);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Could not read the receipt. Try a clearer photo." },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("POST /api/ai/scan-receipt", err);
    return NextResponse.json({ success: false, error: "Failed to scan receipt" }, { status: 500 });
  }
}
