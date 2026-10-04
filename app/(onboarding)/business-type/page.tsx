"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useSPALStore, type BusinessType } from "@/store";

const BUSINESS_TYPES: {
  type: BusinessType;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    type: "food_seller",
    label: "Food Seller",
    sub: "Restaurant, buuka, food stall",
    icon: <FoodIcon />,
    accent: "#22C55E",
  },
  {
    type: "bar_owner",
    label: "Bar / Drinks",
    sub: "Bar, beer parlour, cold store",
    icon: <BarIcon />,
    accent: "#F97316",
  },
  {
    type: "fashion_vendor",
    label: "Fashion & Clothing",
    sub: "Boutique, tailoring, shoes",
    icon: <FashionIcon />,
    accent: "#8B5CF6",
  },
  {
    type: "salon",
    label: "Salon / Barber",
    sub: "Hair salon, barbing, beauty",
    icon: <SalonIcon />,
    accent: "#2563EB",
  },
  {
    type: "kiosk",
    label: "Kiosk / Shop",
    sub: "General store, provision, pharmacy",
    icon: <KioskIcon />,
    accent: "#22C55E",
  },
  {
    type: "market_trader",
    label: "Market Trader",
    sub: "Open market, stall, agro",
    icon: <MarketIcon />,
    accent: "#F97316",
  },
  {
    type: "other",
    label: "Something else",
    sub: "Any other type of business",
    icon: <OtherIcon />,
    accent: "#A1A1AA",
  },
];

export default function BusinessTypePage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<BusinessType | null>(null);

  function handleSelect(type: BusinessType) {
    setSelected(type);
  }

  function handleContinue() {
    if (!selected) return;
    setOnboardingData({ businessType: selected, mode: "signup" });
    router.push("/tracking-methods");
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#EEF3E9" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        {/* Back + Progress row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/welcome")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <div className="flex-1">
            <OnboardProgress step={1} total={3} />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-7"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}>
            Step 1 of 3
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(30px, 8.5vw, 36px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            What kind of<br />business do you run?
          </h1>
          <p className="mt-2 text-neutral-400 text-[13px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            Pick the one that fits best.
          </p>
        </motion.div>
      </div>

      {/* List — min-h-0 is essential on iOS: without it flex children can't shrink,
           the whole page scrolls instead of this div, and iOS bounces it back */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-container px-5 pt-6 pb-44">
        <div className="space-y-2.5">
          {BUSINESS_TYPES.map((item, i) => (
            <motion.button
              key={item.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.045 + 0.12, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => handleSelect(item.type)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all duration-150"
              style={{
                border: selected === item.type ? `1.5px solid ${item.accent}` : "1.5px solid transparent",
                boxShadow: selected === item.type
                  ? `0 0 0 3px ${item.accent}18, 0 2px 8px rgba(0,0,0,0.06)`
                  : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.accent}12`, color: item.accent }}
              >
                {item.icon}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {item.label}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {item.sub}
                </p>
              </div>

              {/* Check */}
              <AnimatePresence>
                {selected === item.type ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.18, ease: [0.34, 1.4, 0.64, 1] }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: item.accent }}
                  >
                    <CheckIcon />
                  </motion.div>
                ) : (
                  <div className="w-6 h-6 rounded-lg border-2 border-neutral-200 flex-shrink-0" />
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom gradient + Continue button */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: "linear-gradient(to top, #EEF3E9 60%, transparent)" }}
      >
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: selected ? "#22C55E" : "#E4E4E7",
            color: selected ? "#fff" : "#A1A1AA",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ── Navigation ── */
/* ── Progress bar ── */
function OnboardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-400"
          style={{ background: i < step ? "#22C55E" : "#E4E4E7" }}
        />
      ))}
    </div>
  );
}

/* ── Bespoke business icons ── */
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5l3 3 5-5" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function BarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22V12M16 22V12" />
      <path d="M5 12h14" />
      <path d="M7 4h10l1 8H6L7 4z" />
    </svg>
  );
}

function FashionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

function SalonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function KioskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function OtherIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
