"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, ArrowReloadHorizontalIcon, PlusSignIcon, ReceiptDollarIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { DateTimePicker } from "@/components/shared/DateTimePicker";

const BG = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

interface ExtractedItem {
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
  category: string;
}

export default function PictureExpenseConfirmPage() {
  const router = useRouter();
  const { bumpRecordSaved } = useSPALStore();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b64 = sessionStorage.getItem("spal_expense_receipt_b64");
    const fileType = sessionStorage.getItem("spal_expense_receipt_file_type") ?? "image/jpeg";
    if (!b64) { router.replace("/records/add-expense/picture"); return; }
    setPreview(`data:${fileType};base64,${b64}`);

    async function scan() {
      try {
        const byteChars = atob(b64!);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: fileType });

        const fd = new FormData();
        fd.append("image", blob, "receipt.jpg");
        const res = await fetch("/api/ai/scan-receipt", { method: "POST", body: fd });
        const data = await res.json();
        const raw = data.data ?? data;
        const extracted = Array.isArray(raw) ? raw : [raw];
        setItems(
          extracted.map((r: { description?: string; amount?: number; category?: string }) => ({
            name: r.description ?? "Item",
            qty: 1,
            unitPrice: r.amount ?? 0,
            amount: r.amount ?? 0,
            category: r.category ?? "Expenses",
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read receipt. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    scan();
  }, [router]);

  const totalAmount = items.reduce((s, it) => s + it.amount, 0);
  const totalUnits = items.reduce((s, it) => s + it.qty, 0);

  async function handleSave() {
    if (items.length === 0 || saving) return;
    setSaving(true);
    try {
      const responses = await Promise.all(
        items.map((it) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "expense",
              amount: it.amount,
              description: it.name,
              category: it.category ?? "Expenses",
              input_method: "picture",
              record_date: date,
            }),
          })
        )
      );
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const err = await failed.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${failed.status}`);
      }
      sessionStorage.removeItem("spal_expense_receipt_b64");
      sessionStorage.removeItem("spal_expense_receipt_file_type");
      bumpRecordSaved();
      window.location.href = "/home"; // hard nav — avoids the soft-nav chunk-load failure
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full pb-36" style={{ background: BG, fontFamily }}>
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
          Picture Upload Confirmation
        </span>
      </div>

      <div className="px-5">
        {/* Cropped image — shown in full so nothing is hidden */}
        {preview && (
          <>
            <div className="rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "#0F172A" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Captured receipt" className="w-full object-contain" style={{ maxHeight: 360 }} />
            </div>
            {/* Separate action buttons — not overlaid on the image */}
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => router.back()}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                style={{ background: "#F1F5F9" }}
                aria-label="Retake photo"
              >
                <ArrowReloadHorizontalIcon size={16} color="#334155" />
                <span className="text-[13px] font-semibold" style={{ fontFamily, color: "#334155" }}>Retake</span>
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                style={{ background: "#fff", border: "1.5px solid #F97316" }}
                aria-label="Add another photo"
              >
                <PlusSignIcon size={16} color="#EA580C" />
                <span className="text-[13px] font-semibold" style={{ fontFamily, color: "#EA580C" }}>Add Photo</span>
              </button>
            </div>
          </>
        )}

        {/* Date picker */}
        <DateTimePicker date={date} onDateChange={setDate} className="mt-4" />

        {/* Loading */}
        {loading && (
          <div className="mt-4 rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: "#FFF3E0" }}>
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F97316", borderTopColor: "transparent" }} />
            <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#B45309" }}>
              SPAL is reading your receipt...
            </p>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-2xl px-4 py-3.5"
              style={{ background: "#FEF2F2" }}
            >
              <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#B91C1C" }}>
                ⚠️ {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {!loading && items.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mt-4 rounded-2xl px-4 py-3.5" style={{ background: "#FFF3E0" }}>
                <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#B45309" }}>
                  💡 SPAL found {items.length} {items.length === 1 ? "expense" : "expenses"}. Check the details below.
                </p>
              </div>

              <p className="mt-3 text-right text-[11px] text-neutral-400" style={{ fontFamily }}>
                Tap any item to edit or remove it
              </p>

              <div className="mt-2 space-y-2.5">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3"
                    style={{
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      border: i === 0 ? "1.5px solid #F97316" : "1.5px solid transparent",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFF3E0" }}>
                      <ReceiptDollarIcon size={18} color="#F97316" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{item.name}</p>
                      <span
                        className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "#FFF7ED", color: "#C2410C" }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold flex-shrink-0" style={{ fontFamily, color: "#F97316" }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Another Item */}
              <button
                className="mt-3 w-full h-11 rounded-xl bg-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ border: "1.5px dashed #E5E7EB" }}
              >
                <PlusSignIcon size={15} color="#F97316" />
                <span className="text-[13px] font-semibold" style={{ fontFamily, color: "#F97316" }}>+ Add Another Item</span>
              </button>

              {/* Summary */}
              <div className="mt-4 rounded-2xl px-4 py-4 flex items-center justify-between" style={{ background: "#FFF3E0" }}>
                <div>
                  <p className="text-[12px] font-medium" style={{ fontFamily, color: "#B45309" }}>
                    {items.length} {items.length === 1 ? "item" : "items"} · {totalUnits} units
                  </p>
                  <p className="text-[13px] font-semibold mt-0.5" style={{ fontFamily, color: "#92400E" }}>Total Expense</p>
                </div>
                <p className="text-[20px] font-bold" style={{ fontFamily, color: "#F97316" }}>
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed CTA */}
      {!loading && items.length > 0 && (
        <div
          className="fixed cta-bottom left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-4 pt-3"
          style={{ background: "linear-gradient(to top, #F7F9F5 80%, transparent)" }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
            style={{ fontFamily, background: "#F97316" }}
          >
            {saving ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      )}
    </div>
  );
}
