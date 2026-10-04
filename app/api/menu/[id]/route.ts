import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/menu/[id] — edit an item, or record orders with { sell: n }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name      !== undefined) updates.name      = String(body.name).trim();
    if (body.menu_type !== undefined) updates.menu_type = body.menu_type === "drinks" ? "drinks" : "food";
    if (body.category  !== undefined) updates.category  = body.category?.trim() || null;
    if (body.unit      !== undefined) updates.unit      = String(body.unit).trim();
    if (body.quantity  !== undefined) updates.quantity  = Math.max(0, parseFloat(body.quantity));
    if (body.price     !== undefined) updates.price     = Math.max(0, parseFloat(body.price));
    if (body.images    !== undefined) {
      const images: string[] = Array.isArray(body.images) ? body.images : [];
      updates.images = images.length ? images : null;
      updates.image_url = images[0] ?? null;
    }

    // Orders: add to `sold` on the server so two devices can't overwrite each other.
    if (body.sell !== undefined) {
      const { data: cur } = await supabase.from("menu_items").select("sold").eq("id", id).eq("user_id", user.id).single();
      updates.sold = (cur?.sold ?? 0) + Math.max(0, parseFloat(body.sell) || 0);
    }

    const { data, error } = await supabase
      .from("menu_items").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/menu/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to update menu item" }, { status: 500 });
  }
}

// DELETE /api/menu/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/menu/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to delete menu item" }, { status: 500 });
  }
}
