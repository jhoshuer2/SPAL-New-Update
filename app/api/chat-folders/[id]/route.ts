import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/chat-folders/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await supabase.from("chat_folders").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/chat-folders/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to delete folder" }, { status: 500 });
  }
}
