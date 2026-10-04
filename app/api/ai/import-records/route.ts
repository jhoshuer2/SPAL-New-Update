import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseImportFromText, parseImportFromImage } from "@/lib/openai/chat";
import * as XLSX from "xlsx";

// POST /api/ai/import-records
// Multipart: "image" (jpg/png) → vision parse
//            "file"  (xlsx/csv/pdf/txt) → SheetJS or text → GPT parse
// JSON: { text } → GPT parse

function xlsxToText(buffer: ArrayBuffer): string {
  // cellDates: true ensures date cells are returned as JS Date objects, not serials
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  return wb.SheetNames.map(name => {
    // dateNF forces date cells to render as YYYY-MM-DD in the CSV output
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false, dateNF: "YYYY-MM-DD" });
    return `=== ${name} ===\n${csv}`;
  }).join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      // ── Image (scan page or visual upload) ────────────────────────────
      const imageFile = form.get("image") as File | null;
      if (imageFile) {
        const buffer   = await imageFile.arrayBuffer();
        const base64   = Buffer.from(buffer).toString("base64");
        const mimeType = imageFile.type || "image/jpeg";
        const records  = await parseImportFromImage(base64, mimeType);
        return NextResponse.json({ success: true, data: records });
      }

      // ── Spreadsheet / document file ───────────────────────────────────
      const docFile = form.get("file") as File | null;
      if (!docFile) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

      const name = docFile.name.toLowerCase();
      let text = "";

      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".ods")) {
        const buffer = await docFile.arrayBuffer();
        text = xlsxToText(buffer);
      } else {
        // csv / txt / pdf — read as plain text
        text = await docFile.text();
      }

      if (!text.trim()) return NextResponse.json({ success: false, error: "File appears empty" }, { status: 400 });

      const records = await parseImportFromText(text);
      return NextResponse.json({ success: true, data: records });

    } else {
      // ── Plain JSON text paste ──────────────────────────────────────────
      const body = await req.json();
      const text: string = body?.text ?? "";
      if (!text.trim()) return NextResponse.json({ success: false, error: "text required" }, { status: 400 });

      const records = await parseImportFromText(text);
      return NextResponse.json({ success: true, data: records });
    }
  } catch (err) {
    console.error("POST /api/ai/import-records", err);
    return NextResponse.json({ success: false, error: "Failed to parse records" }, { status: 500 });
  }
}
