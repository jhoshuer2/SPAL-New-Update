import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 1024 * 1024; // 1MB, matching the form hint
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// POST /api/upload — multipart form with `file`; returns a public image URL.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No file" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Use a JPG, PNG or WebP image" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Image must be less than 1MB" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const admin = createAdminClient();
    const doUpload = () => admin.storage.from("inventory").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

    let { error } = await doUpload();
    // First upload on a fresh project: the bucket may not exist yet — create it and retry.
    if (error && /bucket not found/i.test(error.message)) {
      await admin.storage.createBucket("inventory", { public: true, fileSizeLimit: MAX_BYTES });
      ({ error } = await doUpload());
    }
    if (error) throw error;

    const { data } = admin.storage.from("inventory").getPublicUrl(path);
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (err) {
    console.error("POST /api/upload", err);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
