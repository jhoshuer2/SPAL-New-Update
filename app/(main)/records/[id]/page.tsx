"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, Delete02Icon, ShoppingBag01Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useSPALStore } from "@/store";
import { payInfo, iconTint, orderId, saleBreakdown } from "@/lib/sales";
import { orderMeta, withStatus, STATUS_STYLE } from "@/lib/orders";
import type { BusinessRecord } from "@/lib/types";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSPALStore();
  const [record, setRecord] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [customer, setCustomer] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/records?limit=500").then((r) => r.json()).then((d) => {
      if (d.success) {
        const rec = (d.data as BusinessRecord[]).find((r) => r.id === id) ?? null;
        setRecord(rec);
        if (rec?.customer_name) setCustomer(rec.customer_name);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function del() {
    if (deleting) return;
    setDeleting(true);
    await fetch(`/api/records?id=${id}`, { method: "DELETE" }).catch(() => {});
    window.location.href = "/records";
  }

  // Restaurant/bar orders: mark a prepared order as delivered (frees its table).
  async function markDelivered() {
    if (!record || updating) return;
    setUpdating(true);
    const raw = withStatus(record, "delivered");
    const res = await fetch("/api/records", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, raw_input: raw }),
    }).then((r) => r.json()).catch(() => null);
    if (res?.success) setRecord((r) => (r ? { ...r, raw_input: raw } : r));
    setUpdating(false);
  }

  async function saveCustomer() {
    const name = customer.trim();
    setAddingCustomer(false);
    if (!name) return;
    setRecord((r) => r ? { ...r, customer_name: name } : r);
    await fetch("/api/records", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, customer_name: name }),
    }).catch(() => {});
  }

  if (loading) {
    return <div className="min-h-full flex items-center justify-center" style={{ background: BG }}>
      <div className="w-6 h-6 rounded-full border-2 border-spal-green border-t-transparent animate-spin" />
    </div>;
  }
  if (!record) {
    return <div className="min-h-full flex flex-col items-center justify-center px-8 text-center" style={{ background: BG, fontFamily: FF }}>
      <p className="text-[16px] font-bold text-spal-navy">Order not found</p>
      <button onClick={() => router.push("/records")} className="mt-4 h-12 px-6 rounded-full text-white font-bold" style={{ background: "#22C55E" }}>Back to Sales</button>
    </div>;
  }

  const pay = payInfo(record);
  const meta = orderMeta(record);
  const isOrder = meta.type !== null; // placed through the restaurant/bar order flow
  const status = STATUS_STYLE[meta.status];
  const tint = iconTint(record.description ?? record.category ?? "sale");
  const name = record.description ?? record.category ?? "Sale";
  const { subtotal, vat } = saleBreakdown(record);
  const taxRate = user?.tax_rate ?? 7.5;
  const amountDue = subtotal ?? record.amount;
  const vatShown = vat ?? 0;
  const paid = !(record.payment_status === "owing" || (record.payment_status as string) === "owed");
  const dateStr = (() => {
    const [y, m, d] = record.record_date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  })();
  const timeStr = new Date(record.created_at).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  return (
    <div className="min-h-full pb-16" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
            <ArrowLeft01Icon size={20} color="#0F172A" />
          </button>
          <h1 className="text-[24px] font-black text-spal-navy" style={{ fontFamily: FF }}>Order Detail</h1>
        </div>
        <button onClick={del} disabled={deleting}
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50" aria-label="Delete order">
          <Delete02Icon size={19} color="#DC2626" />
        </button>
      </div>

      {/* Product summary */}
      <div className="px-5 mt-5 flex items-center gap-4">
        <span className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
          <ShoppingBag01Icon size={28} color={tint.color} />
        </span>
        <div className="min-w-0">
          <p className="text-[26px] font-black text-spal-navy leading-tight truncate" style={{ fontFamily: FF }}>{name}</p>
          <p className="text-[15px] text-neutral-400" style={{ fontFamily: FF }}>order id: {orderId(record.id)}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 mt-3 flex items-center gap-2 flex-wrap">
        <span className="px-3.5 py-1.5 rounded-full text-[13.5px] font-bold" style={{ background: pay.bg, color: pay.color, fontFamily: FF }}>{pay.label}</span>
        {isOrder && (
          <>
            <span className="text-neutral-400">*</span>
            <span className="px-3.5 py-1.5 rounded-full text-[13.5px] font-bold" style={{ background: status.bg, color: status.color, fontFamily: FF }}>{status.label}</span>
          </>
        )}
        {meta.table != null && (
          <>
            <span className="text-neutral-400">*</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white text-[13.5px] font-semibold text-spal-navy" style={{ fontFamily: FF }}>Table {meta.table}</span>
          </>
        )}
        {record.category && (
          <>
            <span className="text-neutral-400">*</span>
            <span className="px-3.5 py-1.5 rounded-full bg-white text-[13.5px] font-semibold text-spal-navy" style={{ fontFamily: FF }}>{record.category}</span>
          </>
        )}
      </div>

      {/* Amounts */}
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl px-4 py-4" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <Row label="Amount Due" value={formatCurrency(amountDue)} />
          <Row label={`VAT (${taxRate}%)`} value={formatCurrency(vatShown)} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[20px] font-black text-spal-navy" style={{ fontFamily: FF }}>Total</span>
            <span className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(record.amount)}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[15px] text-neutral-500" style={{ fontFamily: FF }}>Payment</span>
            <span className="px-3 py-1 rounded-full text-[13px] font-bold" style={{ fontFamily: FF, background: paid ? "#E7F6EC" : "#FDECDD", color: paid ? "#16A34A" : "#F97316" }}>
              {paid ? "Paid" : "Owing"}
            </span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl px-4 py-4 space-y-3.5" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <Row label="Date of Order" value={dateStr} strong />
          <Row label="Time of Order" value={timeStr} strong />
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-neutral-500" style={{ fontFamily: FF }}>Customer</span>
            {record.customer_name && !addingCustomer ? (
              <button onClick={() => setAddingCustomer(true)} className="min-h-12 text-[15px] font-black text-spal-navy" style={{ fontFamily: FF }}>{record.customer_name}</button>
            ) : addingCustomer ? (
              <input autoFocus value={customer} onChange={(e) => setCustomer(e.target.value)} onBlur={saveCustomer}
                onKeyDown={(e) => { if (e.key === "Enter") saveCustomer(); }}
                placeholder="Customer name" className="min-h-12 text-[15px] font-bold text-spal-navy text-right bg-transparent outline-none max-w-[180px]" style={{ fontFamily: FF }} />
            ) : (
              <button onClick={() => setAddingCustomer(true)} className="min-h-12 text-[15px] font-black" style={{ color: "#22C55E", fontFamily: FF }}>+ Add a Customer</button>
            )}
          </div>
        </div>
      </div>

      {/* Special instructions */}
      {meta.instructions && (
        <div className="px-5 mt-4">
          <div className="bg-white/70 rounded-2xl px-4 py-4 text-[16px] text-neutral-500 leading-relaxed" style={{ fontFamily: FF, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            {meta.instructions}
          </div>
        </div>
      )}

      {/* Serve it */}
      {isOrder && meta.status === "preparing" && (
        <div className="px-5 mt-6">
          <button onClick={markDelivered} disabled={updating} aria-label="Mark as delivered"
            className="w-full h-14 rounded-full text-white font-black text-[17px] active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{ background: "#22C55E", fontFamily: FF }}>
            {updating ? "Updating..." : "Mark as Delivered"}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[15px] text-neutral-500" style={{ fontFamily: FF }}>{label}</span>
      <span className={`text-[15px] text-spal-navy ${strong ? "font-black" : "font-bold"}`} style={{ fontFamily: FF }}>{value}</span>
    </div>
  );
}
