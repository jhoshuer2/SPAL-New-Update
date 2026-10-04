import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/user/active-business — switch the active business
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { business_id } = await req.json();
    if (!business_id) return NextResponse.json({ success: false, error: "business_id required" }, { status: 400 });

    // Verify the user owns this business
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("user_id", user.id)
      .single();

    if (!business) return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });

    await supabase
      .from("users")
      .update({ active_business_id: business_id })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/user/active-business", err);
    return NextResponse.json({ success: false, error: "Failed to switch business" }, { status: 500 });
  }
}
