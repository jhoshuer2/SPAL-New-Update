"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useSPALStore, type BusinessType } from "@/store";

const fontFamily = "var(--font-satoshi)";
const BG = "#EEF3E9";

const BUSINESS_TYPES: { type: BusinessType; label: string; sub: string; accent: string }[] = [
  { type: "food_seller",    label: "Food Seller",         sub: "Restaurant, buuka, food stall",       accent: "#22C55E" },
  { type: "bar_owner",      label: "Bar / Drinks",        sub: "Bar, beer parlour, cold store",       accent: "#F97316" },
  { type: "fashion_vendor", label: "Fashion & Clothing",  sub: "Boutique, tailoring, shoes",          accent: "#8B5CF6" },
  { type: "salon",          label: "Salon / Barber",      sub: "Hair salon, barbing, beauty",         accent: "#2563EB" },
  { type: "kiosk",          label: "Kiosk / Shop",        sub: "General store, provision, pharmacy",  accent: "#22C55E" },
  { type: "market_trader",  label: "Market Trader",       sub: "Open market, stall, agro",            accent: "#F97316" },
  { type: "other",          label: "Something else",      sub: "Any other type of business",          accent: "#A1A1AA" },
];

export default function AddBusinessTypePage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<BusinessType | null>(null);

  function handleContinue() {
    if (!selected) return;
    setOnboardingData({ businessType: selected });
    router.push("/add-business/details");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <Step step={1} total={3} />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[26px] font-bold text-spal-navy leading-tight">
            What kind of<br />business is this?
          </h1>
          <p className="text-[13px] text-neutral-400 mt-2">Pick the one that fits best.</p>
        </motion.div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-44">
        <div className="space-y-2.5">
          {BUSINESS_TYPES.map((item, i) => (
            <motion.button
              key={item.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 + 0.1 }}
              onClick={() => setSelected(item.type)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all"
              style={{
                border: selected === item.type ? `1.5px solid ${item.accent}` : "1.5px solid transparent",
                boxShadow: selected === item.type
                  ? `0 0 0 3px ${item.accent}18, 0 2px 8px rgba(0,0,0,0.06)`
                  : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[18px]"
                style={{ background: `${item.accent}15`, color: item.accent }}
              >
                {item.label[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-spal-navy">{item.label}</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">{item.sub}</p>
              </div>
              <AnimatePresence>
                {selected === item.type ? (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: item.accent }}
                  >
                    <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5l3 3 5-5" />
                    </svg>
                  </motion.div>
                ) : (
                  <div className="w-6 h-6 rounded-lg border-2 border-neutral-200 flex-shrink-0" />
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: `linear-gradient(to top, ${BG} 60%, transparent)` }}
      >
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all"
          style={{ background: selected ? "#22C55E" : "#E4E4E7", color: selected ? "#fff" : "#A1A1AA", fontFamily }}
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
