/**
 * PATCH /api/records/category
 * Renames all records from one category to another for the current user.
 * Used for merging duplicate/similar categories from the insights UI.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeCategory } from "@/lib/utils/category";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { from: fromCategory, to: toCategory } = await req.json();
    if (!fromCategory || !toCategory) {
      return NextResponse.json({ success: false, error: "from and to are required" }, { status: 400 });
    }

    const normalized = normalizeCategory(toCategory) === "Other" && toCategory.trim()
      ? toCategory.trim()
      : normalizeCategory(toCategory);

    const { error, count } = await supabase
      .from("records")
      .update({ category: normalized })
      .eq("user_id", user.id)
      .eq("category", fromCategory);

    if (error) throw error;

    return NextResponse.json({ success: true, updated: count });
  } catch (err) {
    console.error("PATCH /api/records/category", err);
    return NextResponse.json({ success: false, error: "Failed to rename category" }, { status: 500 });
  }
}
