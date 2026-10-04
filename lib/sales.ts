import type { BusinessRecord } from "@/lib/types";

export interface PayInfo { key: string; label: string; bg: string; color: string }

const PAY_MAP: Record<string, PayInfo> = {
  cash:   { key: "cash",   label: "Cash",          bg: "#E7F6EC", color: "#16A34A" },
  card:   { key: "card",   label: "POS",           bg: "#FDECDD", color: "#F97316" },
  pos:    { key: "pos",    label: "POS",           bg: "#FDECDD", color: "#F97316" },
  bank:   { key: "bank",   label: "Bank Transfer", bg: "#EEE7FB", color: "#8B5CF6" },
  debt:   { key: "debt",   label: "Debt",          bg: "#EEF0EC", color: "#6B7280" },
  link:   { key: "link",   label: "Payment Link",  bg: "#EAF0FC", color: "#2563EB" },
  manual: { key: "manual", label: "Manual",        bg: "#EEF0EC", color: "#6B7280" },
};

/** Derive a sale's payment method (from raw_input) or fall back to its status. */
export function payInfo(record: BusinessRecord): PayInfo {
  let method: string | null = null;
  try { method = record.raw_input ? JSON.parse(record.raw_input)?.payment_method ?? null : null; } catch { /* ignore */ }
  const status = record.payment_status as string | undefined;
  if (!method) method = (status === "owing" || status === "owed") ? "debt" : "cash";
  return PAY_MAP[method] ?? PAY_MAP.cash;
}

/** A stable, human-friendly order id derived from the record id. */
export function orderId(id: string): string {
  return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;
}

const TINTS = [
  { bg: "#FDECDD", color: "#F97316" },
  { bg: "#E7F6EC", color: "#16A34A" },
  { bg: "#EAF0FC", color: "#2563EB" },
  { bg: "#EEE7FB", color: "#8B5CF6" },
];

/** Consistent icon tint for a product name so rows look varied but stable. */
export function iconTint(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return TINTS[h % TINTS.length];
}

/** Parsed VAT / subtotal from a POS sale's raw_input, if present. */
export function saleBreakdown(record: BusinessRecord): { subtotal: number | null; vat: number | null } {
  try {
    const r = record.raw_input ? JSON.parse(record.raw_input) : null;
    if (r && (r.subtotal != null || r.vat != null)) return { subtotal: r.subtotal ?? null, vat: r.vat ?? null };
  } catch { /* ignore */ }
  return { subtotal: null, vat: null };
}
