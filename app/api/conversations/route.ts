import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/conversations — list all conversations for user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // NOTE: the live `conversations` table predates migration 018, so it only
    // has id/user_id/messages/created_at/updated_at — no title/duration columns.
    // Select only guaranteed columns and derive the title from the first message
    // so history works regardless of whether 019 has been applied yet.
    // Try to include folder_id (migration 023); fall back if the column is absent.
    let data: Record<string, unknown>[] = [];
    const withFolder = await supabase
      .from("conversations")
      .select("id, messages, created_at, updated_at, folder_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (withFolder.error) {
      const basic = await supabase
        .from("conversations")
        .select("id, messages, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (basic.error) throw basic.error;
      data = basic.data ?? [];
    } else {
      data = withFolder.data ?? [];
    }

    const withTitles = (data ?? []).map((c) => {
      const msgs = Array.isArray(c.messages) ? c.messages : [];
      const firstUser = msgs.find((m: { role: string; content: string }) => m.role === "user");
      const title = firstUser
        ? firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? "…" : "")
        : "Chat";
      return { ...c, title, duration: 0 };
    });

    return NextResponse.json({ success: true, data: withTitles });
  } catch (err) {
    console.error("GET /api/conversations", err);
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations — create a new conversation (called when session ends)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { messages, duration } = await req.json();
    if (!messages?.length) return NextResponse.json({ success: false, error: "messages required" }, { status: 400 });

    const admin = createAdminClient();
    // Live table has no title/duration columns yet — title is derived on read.
    void duration;
    const { data, error } = await admin
      .from("conversations")
      .insert({ user_id: user.id, messages })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/conversations", err);
    return NextResponse.json({ success: false, error: "Failed to save conversation" }, { status: 500 });
  }
}
