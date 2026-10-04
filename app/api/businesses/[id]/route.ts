import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/businesses/[id] — update name/type/currency or archive a business
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const allowed = ["business_name", "business_type", "currency", "tracking_methods", "business_goals", "is_archived"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.business_name) updates.business_name = String(updates.business_name).trim();

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/businesses/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to update business" }, { status: 500 });
  }
}
