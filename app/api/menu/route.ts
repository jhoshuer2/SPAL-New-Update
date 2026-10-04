import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MenuType } from "@/lib/types";

// GET /api/menu — the user's menu. An unmigrated table reads as an empty menu.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ success: true, data: { items: [], ready: false } });

    return NextResponse.json({ success: true, data: { items: data ?? [], ready: true } });
  } catch (err) {
    console.error("GET /api/menu", err);
    return NextResponse.json({ success: false, error: "Failed to fetch menu" }, { status: 500 });
  }
}

// POST /api/menu — add a dish or drink
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const price = parseFloat(body.price);
    const quantity = parseFloat(body.quantity);
    if (!name || !(price >= 0) || !(quantity >= 0)) {
      return NextResponse.json({ success: false, error: "name, price and quantity are required" }, { status: 400 });
    }
    const images: string[] = Array.isArray(body.images) ? body.images : [];
    const menuType: MenuType = body.menu_type === "drinks" ? "drinks" : "food";

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        user_id:   user.id,
        name,
        menu_type: menuType,
        category:  body.category?.trim() || null,
        unit:      (body.unit || "plates").trim(),
        quantity,
        price,
        image_url: images[0] ?? null,
        images:    images.length ? images : null,
      })
      .select()
      .single();
    if (error) {
      const notReady = /menu_items/i.test(error.message);
      return NextResponse.json({ success: false, error: notReady ? "Menu isn't set up yet. Please try again shortly." : error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/menu", err);
    return NextResponse.json({ success: false, error: "Failed to add menu item" }, { status: 500 });
  }
}
