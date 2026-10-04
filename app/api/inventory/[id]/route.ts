import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/inventory/[id] — update item (quantity, name, unit, threshold, cost)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const num = (v: unknown) => v != null && v !== "" ? parseFloat(v as string) : null;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name                !== undefined) updates.name                = body.name.trim();
    if (body.quantity            !== undefined) updates.quantity            = parseFloat(body.quantity);
    if (body.unit                !== undefined) updates.unit                = body.unit.trim();
    if (body.low_stock_threshold !== undefined) updates.low_stock_threshold = num(body.low_stock_threshold) ?? 5;
    if (body.cost_price          !== undefined) updates.cost_price          = num(body.cost_price);
    if (body.selling_price       !== undefined) updates.selling_price       = num(body.selling_price);
    if (body.category            !== undefined) updates.category            = body.category?.trim() || null;
    if (body.image_url           !== undefined) updates.image_url           = body.image_url || null;
    if (body.images              !== undefined) updates.images              = Array.isArray(body.images) && body.images.length ? body.images : null;
    if (body.sku                 !== undefined) updates.sku                 = body.sku?.trim() || null;
    if (body.gtin                !== undefined) updates.gtin                = body.gtin?.trim() || null;
    if (body.discount            !== undefined) updates.discount            = num(body.discount);
    if (body.discount_eligible   !== undefined) updates.discount_eligible   = !!body.discount_eligible;
    if (body.variations          !== undefined) updates.variations          = Array.isArray(body.variations) && body.variations.length ? body.variations : null;

    // Strip columns the DB doesn't have yet and retry, so newer fields degrade gracefully.
    async function runUpdate(payload: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> {
      let p = { ...payload };
      for (let i = 0; i < 15; i++) {
        const { data, error } = await supabase
          .from("inventory_items").update(p).eq("id", id).eq("user_id", user!.id).select().single();
        if (!error) return { data, error: null };
        const m =
          /Could not find the '([^']+)' column/i.exec(error.message) ||
          /column "([^"]+)" .*does not exist/i.exec(error.message) ||
          /'([^']+)' column/i.exec(error.message);
        const col = m?.[1];
        if (col && col in p) { delete p[col]; continue; }
        return { data: null, error };
      }
      return { data: null, error: { message: "update failed after stripping columns" } };
    }

    const { data, error } = await runUpdate(updates);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/inventory/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/inventory/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/inventory/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to delete item" }, { status: 500 });
  }
}
