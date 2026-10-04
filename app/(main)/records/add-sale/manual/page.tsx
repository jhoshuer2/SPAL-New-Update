"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, PlusSignIcon, MinusSignIcon, Clock01Icon, Calendar03Icon, Tick01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";

const BG = "#EEF3E9";
const fontFamily = "var(--font-satoshi)";

interface Item {
  name: string;
  qty: string;
  unitPrice: string;
  payment: "paid" | "owing";
  customerName: string;
  partPaid: string; // amount paid now on an owing item (optional partial payment)
}

const emptyItem = (): Item => ({ name: "", qty: "", unitPrice: "", payment: "paid", customerName: "", partPaid: "" });

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ManualEntryPage() {
  const router = useRouter();
  const { bumpRecordSaved } = useSPALStore();

  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateItem = useCallback((idx: number, field: keyof Item, val: string) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }, []);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const validItems = items.filter((it) => it.name.trim() && parseFloat(it.qty) > 0 && parseFloat(it.unitPrice) > 0);
  const totalUnits = validItems.reduce((s, it) => s + parseFloat(it.qty), 0);
  const totalAmount = validItems.reduce((s, it) => s + parseFloat(it.qty) * parseFloat(it.unitPrice), 0);

  // How much of this batch is still owed (owing total minus any part paid now)
  const owedAmount = validItems.reduce((s, it) => {
    if (it.payment !== "owing") return s;
    const itemTotal = parseFloat(it.qty) * parseFloat(it.unitPrice);
    const part = Math.min(itemTotal, Math.max(0, parseFloat(it.partPaid) || 0));
    return s + (itemTotal - part);
  }, 0);

  async function handleSave() {
    if (validItems.length === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Build one or two records per item. An owing item with a part paid now
      // splits into a paid record (received today) + an owing record (the rest).
      type Payload = { type: string; amount: number; description: string; category: string; input_method: string; record_date: string; payment_status: string; customer_name?: string };
      const payloads: Payload[] = [];
      for (const it of validItems) {
        const itemTotal = parseFloat(it.qty) * parseFloat(it.unitPrice);
        const base = { type: "sale", description: it.name.trim(), category: "Other", input_method: "manual", record_date: date };
        if (it.payment === "paid") {
          payloads.push({ ...base, amount: itemTotal, payment_status: "paid" });
        } else {
          const customer = it.customerName.trim() || undefined;
          const part = Math.min(itemTotal, Math.max(0, parseFloat(it.partPaid) || 0));
          if (part > 0) {
            payloads.push({ ...base, amount: part, payment_status: "paid", customer_name: customer });
          }
          const owed = itemTotal - part;
          if (owed > 0) {
            payloads.push({ ...base, amount: owed, payment_status: "owing", customer_name: customer });
          }
        }
      }

      const responses = await Promise.all(
        payloads.map((p) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          })
        )
      );
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const err = await failed.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${failed.status}`);
      }
      bumpRecordSaved();
      router.refresh();
      window.location.href = "/home";
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily }}>
          Manual Entry
        </span>
      </div>

      <div className="px-5">
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily }}>Type Your Sales</h1>
        <p className="text-[13px] text-neutral-500 mt-1" style={{ fontFamily }}>Enter your items, quantity and price</p>

        {/* Date + Time */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl px-3.5 py-3 flex items-center gap-2.5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Calendar03Icon size={17} color="#6B7280" className="flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-[12.5px] text-spal-navy font-medium bg-transparent outline-none w-full"
              style={{ fontFamily }}
            />
          </div>
          <div className="bg-white rounded-2xl px-3.5 py-3 flex items-center gap-2.5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <Clock01Icon size={17} color="#6B7280" className="flex-shrink-0" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-[12.5px] text-spal-navy font-medium bg-transparent outline-none w-full"
              style={{ fontFamily }}
            />
          </div>
        </div>

        {/* Section divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase" style={{ fontFamily }}>
            Items Sold
          </span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Column headers */}
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "1fr 64px 96px 24px" }}>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide px-1" style={{ fontFamily }}>Item Name</span>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-center" style={{ fontFamily }}>Qty</span>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-center" style={{ fontFamily }}>Unit Price</span>
          <div />
        </div>

        {/* Item rows */}
        <div className="mt-1.5 space-y-2.5">
          {items.map((item, idx) => {
            const itemTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
            const owing = item.payment === "owing";
            return (
            <div key={idx} className="space-y-2">
              <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 64px 96px 24px" }}>
                {/* Name */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                  placeholder="Item name"
                  className="h-11 rounded-xl px-3 text-[13px] text-spal-navy bg-white outline-none transition-all"
                  style={{
                    fontFamily,
                    border: item.name ? "1.5px solid #22C55E" : "1.5px solid #E5E7EB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                />
                {/* Qty */}
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  placeholder="1"
                  min="0"
                  className="h-11 rounded-xl px-2 text-[13px] text-spal-navy bg-white outline-none text-center"
                  style={{ fontFamily, border: "1.5px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                />
                {/* Unit price */}
                <div
                  className="h-11 rounded-xl bg-white flex items-center overflow-hidden"
                  style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <span className="pl-2 text-[11px] text-neutral-400 font-medium" style={{ fontFamily }}>₦</span>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    placeholder="0"
                    min="0"
                    className="flex-1 h-full px-1 text-[12.5px] text-spal-navy bg-transparent outline-none"
                    style={{ fontFamily }}
                  />
                </div>
                {/* Delete */}
                {idx >= 1 ? (
                  <button
                    onClick={() => removeItem(idx)}
                    className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "#FEE2E2" }}
                    aria-label="Remove item"
                  >
                    <MinusSignIcon size={12} color="#EF4444" />
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Per-item payment — only shown once the item has a name */}
              <AnimatePresence>
                {item.name.trim() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 pl-0.5">
                      <span className="text-[11px] text-neutral-400 font-medium mr-0.5" style={{ fontFamily }}>Payment:</span>
                      {(["paid", "owing"] as const).map((s) => {
                        const active = item.payment === s;
                        const activeBg = s === "paid" ? "#22C55E" : "#F97316";
                        return (
                          <button
                            key={s}
                            onClick={() => updateItem(idx, "payment", s)}
                            className="h-7 px-3 rounded-full text-[11.5px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                            style={{
                              background: active ? activeBg : "#fff",
                              color: active ? "#fff" : "#6B7280",
                              border: active ? "none" : "1.5px solid #E5E7EB",
                            }}
                          >
                            {s === "paid" ? <Tick01Icon size={11} /> : <Clock01Icon size={11} />}
                            {s === "paid" ? "Paid" : "Owes me"}
                          </button>
                        );
                      })}
                    </div>

                    {/* Owing details: who owes + optional part paid now */}
                    <AnimatePresence>
                      {owing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={item.customerName}
                              onChange={(e) => updateItem(idx, "customerName", e.target.value)}
                              placeholder="Who owes? (optional)"
                              className="flex-1 h-10 px-3 rounded-xl text-[12.5px] text-spal-navy outline-none"
                              style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", fontFamily }}
                            />
                            <div className="h-10 rounded-xl flex items-center overflow-hidden" style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", width: 122 }}>
                              <span className="pl-2.5 text-[11px] font-medium" style={{ color: "#C2410C", fontFamily }}>₦</span>
                              <input
                                type="number"
                                value={item.partPaid}
                                onChange={(e) => updateItem(idx, "partPaid", e.target.value)}
                                placeholder="Paid part"
                                min="0"
                                max={itemTotal || undefined}
                                className="flex-1 w-full h-full px-1.5 text-[12px] text-spal-navy bg-transparent outline-none"
                                style={{ fontFamily }}
                              />
                            </div>
                          </div>
                          {parseFloat(item.partPaid) > 0 && itemTotal > 0 && (
                            <p className="text-[11px] mt-1.5 pl-0.5" style={{ fontFamily, color: "#C2410C" }}>
                              {formatCurrency(Math.min(itemTotal, parseFloat(item.partPaid)))} paid now ·{" "}
                              {formatCurrency(Math.max(0, itemTotal - parseFloat(item.partPaid)))} still owed
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            );
          })}
        </div>

        {/* Add another item */}
        <button
          onClick={addItem}
          className="mt-3 w-full h-11 rounded-xl bg-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ border: "1.5px dashed #E5E7EB" }}
        >
          <PlusSignIcon size={15} color="#22C55E" />
          <span className="text-[13px] font-semibold" style={{ fontFamily, color: "#22C55E" }}>Add Another Item</span>
        </button>

        {/* Note */}
        <div className="mt-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add a note (optional)"
            className="w-full bg-white rounded-2xl px-4 py-3 text-[13px] text-spal-navy outline-none resize-none"
            style={{
              fontFamily,
              border: "1.5px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          />
        </div>

        {/* Summary card */}
        <AnimatePresence>
          {validItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="mt-4 rounded-2xl px-4 py-4 flex items-center justify-between"
              style={{ background: "#E8F5E9" }}
            >
              <div>
                <p className="text-[12px] text-green-700 font-medium" style={{ fontFamily }}>
                  {validItems.length} {validItems.length === 1 ? "item" : "items"} · {totalUnits} units sold
                </p>
                <p className="text-[13px] text-green-800 font-semibold mt-0.5" style={{ fontFamily }}>Total Sale</p>
              </div>
              <p className="text-[20px] font-bold" style={{ fontFamily, color: "#16A34A" }}>
                {formatCurrency(totalAmount)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed CTA */}
      <div
        className="fixed cta-bottom left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-4 pt-3"
        style={{ background: "linear-gradient(to top, #EEF3E9 80%, transparent)" }}
      >
        {/* Owed summary — payment is set per item above */}
        <AnimatePresence>
          {owedAmount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[12px] font-semibold text-center mb-2.5" style={{ fontFamily, color: "#C2410C" }}
            >
              {formatCurrency(owedAmount)} will be owed to you
            </motion.p>
          )}
        </AnimatePresence>

        {saveError && (
          <p className="text-[12px] text-red-600 font-medium text-center mb-2" style={{ fontFamily }}>
            ⚠️ {saveError}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={validItems.length === 0 || saving}
          className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
          style={{ fontFamily, background: "#22C55E" }}
        >
          {saving ? "Saving..." : "Save Sale"}
        </button>
      </div>
    </div>
  );
}
