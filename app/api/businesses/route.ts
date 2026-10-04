import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/businesses — list all non-archived businesses for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/businesses", err);
    return NextResponse.json({ success: false, error: "Failed to fetch businesses" }, { status: 500 });
  }
}

// POST /api/businesses — create a new business and set it as active
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { business_name, business_type, currency, tracking_methods, business_goals } = await req.json();

    if (!business_name?.trim() || !business_type) {
      return NextResponse.json({ success: false, error: "business_name and business_type are required" }, { status: 400 });
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .insert({
        user_id:         user.id,
        business_name:   business_name.trim(),
        business_type,
        currency:        currency ?? "NGN",
        tracking_methods: tracking_methods ?? [],
        business_goals:   business_goals ?? [],
      })
      .select()
      .single();

    if (error) throw error;

    // Set as active business
    await supabase
      .from("users")
      .update({ active_business_id: business.id })
      .eq("id", user.id);

    return NextResponse.json({ success: true, data: business }, { status: 201 });
  } catch (err) {
    console.error("POST /api/businesses", err);
    return NextResponse.json({ success: false, error: "Failed to create business" }, { status: 500 });
  }
}
