import type { BusinessRecord } from "@/lib/types";

export type OrderType = "online" | "walkin" | "table";
export type OrderStatus = "preparing" | "delivered";

export interface OrderMeta {
  type: OrderType | null;
  table: number | null;
  status: OrderStatus;
  instructions: string;
}

export const ORDER_TYPES: { key: OrderType; label: string; hint: string }[] = [
  { key: "online", label: "Online",            hint: "Customer orders online" },
  { key: "walkin", label: "Walk-in Customer",  hint: "Customer buys and leaves the restaurant" },
  { key: "table",  label: "Table",             hint: "Customer sits on one of the tables to eat" },
];

export const STATUS_STYLE: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  preparing: { label: "Preparing", bg: "#FFF3EC", color: "#F97316" },
  delivered: { label: "Delivered", bg: "#E7F6EC", color: "#16A34A" },
};

/** Order details a POS sale carries in raw_input. Older sales without them read as delivered. */
export function orderMeta(record: BusinessRecord): OrderMeta {
  try {
    const r = record.raw_input ? JSON.parse(record.raw_input) : null;
    return {
      type: (["online", "walkin", "table"] as string[]).includes(r?.order_type) ? r.order_type : null,
      table: typeof r?.table === "number" ? r.table : null,
      status: r?.status === "preparing" ? "preparing" : "delivered",
      instructions: typeof r?.instructions === "string" ? r.instructions : "",
    };
  } catch {
    return { type: null, table: null, status: "delivered", instructions: "" };
  }
}

/** The raw_input string with its status changed (everything else kept). */
export function withStatus(record: BusinessRecord, status: OrderStatus): string {
  let base: Record<string, unknown> = {};
  try { base = record.raw_input ? JSON.parse(record.raw_input) : {}; } catch { /* start fresh */ }
  return JSON.stringify({ ...base, status });
}

/** Tables that still have an order being prepared. */
export function busyTables(sales: BusinessRecord[]): Set<number> {
  const busy = new Set<number>();
  sales.forEach((r) => {
    const m = orderMeta(r);
    if (m.type === "table" && m.table != null && m.status === "preparing") busy.add(m.table);
  });
  return busy;
}
