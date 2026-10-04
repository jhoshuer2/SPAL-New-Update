/**
 * GET /api/records/items?type=sale|expense&limit=12
 *
 * Aggregates the user's past records into a list of "items" they've sold/bought before.
 * Used by the Add Record sheet to power one-tap quick-add chips + type-ahead suggestions.
 *
 * Returns: { success: true, data: [{ name, default_price, category, count, last_used }] }
 * Sorted by usage count DESC, then by recency.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Item {
  name:          string;   // description, lowercased+trimmed key  → human name
  default_price: number;   // latest amount used for this item
  category:      string | null;
  count:         number;
  last_used:     string;   // ISO
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url   = new URL(req.url);
    const type  = url.searchParams.get("type");
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 12)));

    if (type !== "sale" && type !== "expense") {
      return NextResponse.json({ success: false, error: "type must be 'sale' or 'expense'" }, { status: 400 });
    }

    // Pull the last 500 records of that type — enough signal for frequent items.
    const { data: records, error } = await supabase
      .from("records")
      .select("description, category, amount, created_at")
      .eq("user_id", user.id)
      .eq("type", type)
      .not("description", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[items] query error:", error);
      return NextResponse.json({ success: false, error: "Failed to load items" }, { status: 500 });
    }

    // Group by lowercased description — first occurrence is the most-recent (records sorted DESC).
    const map = new Map<string, Item>();
    for (const r of records ?? []) {
      const raw = (r.description ?? "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase();

      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          name:          raw,                    // preserve original casing of latest entry
          default_price: Number(r.amount) || 0,  // latest price = most useful default
          category:      r.category ?? null,
          count:         1,
          last_used:     r.created_at,
        });
      }
    }

    // Sort by count DESC, tie-break by last_used DESC
    const items = [...map.values()]
      .sort((a, b) => (b.count - a.count) || (a.last_used < b.last_used ? 1 : -1))
      .slice(0, limit);

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("[items] unexpected error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
