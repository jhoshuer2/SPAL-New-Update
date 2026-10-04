"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon, Store01Icon, PlusSignIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const fontFamily = "var(--font-satoshi)";
const BG = "#EEF3E9";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  food_seller:    "Food Seller",
  bar_owner:      "Bar / Drinks",
  fashion_vendor: "Fashion & Clothing",
  salon:          "Salon / Barber",
  kiosk:          "Kiosk / Shop",
  market_trader:  "Market Trader",
  other:          "Other Business",
};

export default function AddBusinessEntryPage() {
  const router = useRouter();
  const { activeBusiness, setOnboardingData } = useSPALStore();

  // Clear any stale new-business onboarding state
  useEffect(() => {
    setOnboardingData({ businessType: undefined, trackingMethods: undefined, goals: undefined });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startSameType() {
    // Pre-fill business type from active business, skip type screen
    if (activeBusiness) {
      setOnboardingData({ businessType: activeBusiness.business_type as never });
    }
    router.push("/add-business/details");
  }

  function startDifferentType() {
    router.push("/add-business/type");
  }

  const existingTypeLabel = activeBusiness
    ? (BUSINESS_TYPE_LABELS[activeBusiness.business_type] ?? "your current business")
    : null;

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.push("/profile")}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy">Add Business</span>
      </div>

      <div className="px-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "#E8F5E9" }}
          >
            <Store01Icon size={26} color="#22C55E" />
          </div>

          <h1 className="text-[26px] font-bold text-spal-navy leading-tight">
            Add another<br />business
          </h1>
          <p className="text-[14px] text-neutral-400 mt-2">
            Switch between businesses like switching accounts on Instagram.
          </p>
        </motion.div>

        {existingTypeLabel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-8"
          >
            <p className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
              What kind of business is it?
            </p>

            {/* Same type */}
            <button
              onClick={startSameType}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 text-left active:scale-[0.98] transition-all mb-3"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)", border: "1.5px solid transparent" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                <Store01Icon size={20} color="#22C55E" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-spal-navy">Same type — {existingTypeLabel}</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">Same business type as {activeBusiness?.business_name}</p>
              </div>
              <span className="text-neutral-300 text-lg">›</span>
            </button>

            {/* Different type */}
            <button
              onClick={startDifferentType}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 text-left active:scale-[0.98] transition-all"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)", border: "1.5px solid transparent" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                <PlusSignIcon size={20} color="#2563EB" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-spal-navy">Different type of business</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">Choose from our business categories</p>
              </div>
              <span className="text-neutral-300 text-lg">›</span>
            </button>
          </motion.div>
        )}

        {/* No existing business — go straight to type */}
        {!existingTypeLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <button
              onClick={startDifferentType}
              className="w-full h-14 rounded-full font-bold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all"
              style={{ background: "#22C55E", fontFamily }}
            >
              Get started
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
