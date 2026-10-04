"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const fontFamily = "var(--font-satoshi)";
const BG = "#EEF3E9";

const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi",  symbol: "₵" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "USD", label: "US Dollar",      symbol: "$" },
  { code: "GBP", label: "British Pound",  symbol: "£" },
];

export default function AddBusinessDetailsPage() {
  const router = useRouter();
  const { onboardingData, activeBusiness } = useSPALStore();

  const [name,     setName]     = useState("");
  const [currency, setCurrency] = useState(activeBusiness?.currency ?? "NGN");

  const canContinue = name.trim().length >= 2;

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
          <Step step={2} total={3} />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[26px] font-bold text-spal-navy leading-tight">
            Name this<br />business
          </h1>
          <p className="text-[13px] text-neutral-400 mt-2">Give it a name you&apos;ll recognise easily.</p>
        </motion.div>
      </div>

      <div className="px-5 mt-8 space-y-5">
        {/* Business name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Business name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mama Ngozi Kitchen"
            autoFocus
            className="w-full h-14 px-4 rounded-2xl text-[15px] font-medium text-spal-navy bg-white outline-none"
            style={{
              border: name.trim() ? "1.5px solid #22C55E" : "1.5px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              fontFamily,
            }}
          />
        </motion.div>

        {/* Currency */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Currency
          </label>
          <div className="space-y-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 text-left active:scale-[0.98] transition-all"
                style={{
                  border: currency === c.code ? "1.5px solid #22C55E" : "1.5px solid transparent",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <span className="text-[15px] font-bold text-neutral-500 w-8">{c.symbol}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-spal-navy">{c.label}</p>
                  <p className="text-[11px] text-neutral-400">{c.code}</p>
                </div>
                {currency === c.code && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                    <svg width="10" height="10" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5l3 3 5-5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: `linear-gradient(to top, ${BG} 60%, transparent)` }}
      >
        <button
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue) return;
            router.push(`/add-business/tracking?name=${encodeURIComponent(name.trim())}&currency=${currency}&type=${onboardingData.businessType ?? "other"}`);
          }}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all"
          style={{ background: canContinue ? "#22C55E" : "#E4E4E7", color: canContinue ? "#fff" : "#A1A1AA", fontFamily }}
        >
          Continue
        </button>
      </div>
    </div>
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
