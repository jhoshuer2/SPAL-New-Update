"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon, Tick01Icon } from "hugeicons-react";
import { useSPALStore, type TrackingMethod } from "@/store";

const fontFamily = "var(--font-satoshi)";
const BG = "#EEF3E9";

const METHODS: { method: TrackingMethod; label: string; icon: string }[] = [
  { method: "notebook",      label: "Notebook",      icon: "📓" },
  { method: "whatsapp",      label: "WhatsApp",      icon: "💬" },
  { method: "excel",         label: "Excel",         icon: "📊" },
  { method: "google_sheets", label: "Google Sheets", icon: "📋" },
  { method: "notes_app",     label: "Notes app",     icon: "📝" },
  { method: "receipts",      label: "Receipts",      icon: "🧾" },
  { method: "nothing",       label: "Nothing / other", icon: "❓" },
];

function TrackingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { activeBusiness } = useSPALStore();

  const name     = params.get("name") ?? "";
  const currency = params.get("currency") ?? "NGN";
  const type     = params.get("type") ?? "other";

  const sameAsExisting = activeBusiness?.tracking_methods ?? [];
  const [useSame,   setUseSame]   = useState(false);
  const [selected,  setSelected]  = useState<TrackingMethod[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  function toggle(m: TrackingMethod) {
    setUseSame(false);
    setSelected(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const methods = useSame ? sameAsExisting : selected;
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name:    name,
          business_type:    type,
          currency,
          tracking_methods: methods,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push(`/home?newBusiness=${encodeURIComponent(name)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full pb-44" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <Step step={3} total={3} />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[26px] font-bold text-spal-navy leading-tight">
            How do you track<br />{name || "this business"}?
          </h1>
          <p className="text-[13px] text-neutral-400 mt-2">Select all that apply.</p>
        </motion.div>
      </div>

      <div className="px-5 mt-8 space-y-3">
        {/* Same as existing option */}
        {activeBusiness && sameAsExisting.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => { setUseSame(true); setSelected([]); }}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all"
            style={{
              border: useSame ? "1.5px solid #22C55E" : "1.5px solid #E5E7EB",
              boxShadow: useSame ? "0 0 0 3px #22C55E18" : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Tick01Icon size={20} color="#22C55E" className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-spal-navy">Same as {activeBusiness.business_name}</p>
              <p className="text-[12px] text-neutral-400 mt-0.5">Carry over your existing tracking method</p>
            </div>
            {useSame && (
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#22C55E" }}>
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6.5l3 3 5-5" />
                </svg>
              </div>
            )}
          </motion.button>
        )}

        {/* Individual method chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {METHODS.map((item, i) => {
            const isOn = selected.includes(item.method);
            return (
              <motion.button
                key={item.method}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 + 0.1 }}
                onClick={() => toggle(item.method)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  background: isOn ? "#0F172A" : "#fff",
                  color:      isOn ? "#fff" : "#374151",
                  border:     isOn ? "1.5px solid #0F172A" : "1.5px solid #E5E7EB",
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: `linear-gradient(to top, ${BG} 60%, transparent)` }}
      >
        {error && (
          <p className="text-[12px] text-red-600 text-center font-medium mb-2">{error}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-full font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "#22C55E", fontFamily }}
        >
          {saving ? "Creating…" : "Create business"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-2 h-10 text-[13px] text-neutral-400 font-medium"
        >
          Skip — I&apos;ll track it differently
        </button>
      </div>
    </div>
  );
}

export default function AddBusinessTrackingPage() {
  return (
    <Suspense>
      <TrackingContent />
    </Suspense>
  );
}

function Step({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 flex-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < step ? "#22C55E" : "#E4E4E7" }} />
      ))}
    </div>
  );
}
