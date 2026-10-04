import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chat-folders — list folders with chat counts
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: folders, error } = await supabase
      .from("chat_folders").select("id, name, created_at").eq("user_id", user.id).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ success: true, data: [] }); // table not created yet

    // Count conversations per folder (best-effort; folder_id may not exist yet).
    let counts: Record<string, number> = {};
    try {
      const { data: convs } = await supabase.from("conversations").select("folder_id").eq("user_id", user.id);
      counts = (convs ?? []).reduce((acc: Record<string, number>, c: { folder_id?: string | null }) => {
        if (c.folder_id) acc[c.folder_id] = (acc[c.folder_id] ?? 0) + 1;
        return acc;
      }, {});
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, data: (folders ?? []).map((f) => ({ ...f, count: counts[f.id] ?? 0 })) });
  } catch (err) {
    console.error("GET /api/chat-folders", err);
    return NextResponse.json({ success: false, error: "Failed to load folders" }, { status: 500 });
  }
}

// POST /api/chat-folders — create a folder
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });

    const { data, error } = await supabase
      .from("chat_folders").insert({ user_id: user.id, name: name.trim() }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: { ...data, count: 0 } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat-folders", err);
    return NextResponse.json({ success: false, error: "Failed to create folder" }, { status: 500 });
  }
}
