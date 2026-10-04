import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/profile — fetch current user profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/user/profile", err);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/user/profile — update editable profile fields
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { full_name, business_name, business_type, whatsapp_number, currency, tax_rate, table_count, avatar_url, tracking_methods } = body;

    const updates: Record<string, unknown> = {};
    if (full_name        !== undefined) updates.full_name        = full_name?.trim()       || null;
    if (business_name    !== undefined) updates.business_name    = business_name?.trim()   || null;
    if (business_type    !== undefined) updates.business_type    = business_type           || null;
    if (whatsapp_number  !== undefined) updates.whatsapp_number  = whatsapp_number?.trim() || null;
    if (currency         !== undefined) updates.currency         = currency                || "NGN";
    if (tax_rate         !== undefined) updates.tax_rate         = tax_rate != null && tax_rate !== "" ? parseFloat(tax_rate) : null;
    if (table_count      !== undefined) updates.table_count      = table_count != null && table_count !== "" ? Math.max(0, Math.round(Number(table_count))) : null;
    if (avatar_url       !== undefined) updates.avatar_url       = avatar_url              || null;
    if (tracking_methods !== undefined) updates.tracking_methods = Array.isArray(tracking_methods) ? tracking_methods : [];

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    // tax_rate column may not exist yet (migration 022) — retry without it.
    async function runUpdate(payload: Record<string, unknown>) {
      return supabase.from("users").update(payload).eq("id", user!.id).select().single();
    }
    let { data, error } = await runUpdate(updates);
    if (error && /tax_rate/.test(error.message)) {
      const { tax_rate: _omit, ...rest } = updates;
      void _omit;
      ({ data, error } = await runUpdate(rest));
    }
    // table_count column may not exist yet (migration 025) — retry without it.
    if (error && /table_count/.test(error.message)) {
      const { table_count: _omit, ...rest } = updates;
      void _omit;
      ({ data, error } = await runUpdate(rest));
    }

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/user/profile", err);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
