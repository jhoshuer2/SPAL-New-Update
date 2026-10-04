import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations/[id] — fetch a single conversation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/conversations/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch conversation" }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] — rename title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Move a chat into (or out of) a folder when folder_id is provided.
    if (body.folder_id !== undefined) {
      const { error } = await supabase
        .from("conversations")
        .update({ folder_id: body.folder_id, updated_at: new Date().toISOString() })
        .eq("id", id).eq("user_id", user.id);
      if (error) return NextResponse.json({ success: false, error: "Folders not enabled yet" }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    // Rename/title columns predate migration 019; touch updated_at only.
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/conversations/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to update conversation" }, { status: 500 });
  }
}

// DELETE /api/conversations/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/conversations/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to delete conversation" }, { status: 500 });
  }
}
