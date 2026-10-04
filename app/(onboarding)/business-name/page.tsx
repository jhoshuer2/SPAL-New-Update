"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useSPALStore, type BusinessType } from "@/store";

const MAX_CHARS = 40;

const SUGGESTIONS: Record<BusinessType | "default", string[]> = {
  food_seller:    ["Mama's Kitchen", "My Food Business", "Daily Bites", "Mama Tola Eats"],
  bar_owner:      ["My Bar & Drinks", "Cold Corner", "The Spot", "Chill Zone Bar"],
  fashion_vendor: ["My Fashion Store", "Style By Me", "The Boutique", "Fabric & Fits"],
  salon:          ["My Salon", "Glam Studio", "Cut & Style", "Beauty By Me"],
  kiosk:          ["My Kiosk", "Corner Shop", "Daily Needs Store", "Quick Stop"],
  market_trader:  ["My Market Stall", "Daily Trader", "Open Market Store", "Stall No. 1"],
  other:          ["My Business", "My Store", "Side Hustle", "My Shop"],
  default:        ["My Business", "My Store", "Side Hustle", "My Shop"],
};

export default function BusinessNamePage() {
  const router = useRouter();
  const { user, setUser, onboardingData } = useSPALStore();
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const suggestions = useMemo(() => {
    const type = onboardingData.businessType ?? "default";
    return SUGGESTIONS[type] ?? SUGGESTIONS.default;
  }, [onboardingData.businessType]);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 2;

  function handleChange(val: string) {
    if (val.length > MAX_CHARS) return;
    setName(val);
    setError("");
  }

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: trimmed, onboarding_completed: true }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Could not save. Please try again.");
        return;
      }

      if (user) setUser({ ...user, business_name: trimmed });
      window.location.href = "/walkthrough";
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#EEF3E9" }}>

      {/* Header — back + progress */}
      <div className="px-5 pt-12">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <div className="flex-1"><OnboardProgress step={7} total={7} /></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <p
            className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Step 7 of 7
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(28px, 8vw, 34px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            What&apos;s your business<br />called?
          </h1>
          <p className="mt-2 text-neutral-400 text-[13px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            You can change it later
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <label
            className="text-[13px] font-bold text-spal-navy mb-2 block"
            style={{ fontFamily: "var(--font-satoshi)" }}
            htmlFor="biz-name"
          >
            Business Name
          </label>

          <input
            id="biz-name"
            type="text"
            placeholder="Enter Business Name"
            value={name}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isValid && handleSave()}
            className="w-full h-[52px] rounded-2xl px-4 text-[15px] text-spal-navy outline-none transition-all duration-150"
            style={{
              fontFamily: "var(--font-satoshi)",
              background: "#fff",
              border: "1.5px solid #E4E4E7",
            }}
            autoCapitalize="words"
            autoFocus
            maxLength={MAX_CHARS}
          />

          {/* Char counter */}
          <div className="flex justify-end mt-1.5">
            <span
              className="text-[12px] text-neutral-400"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              {name.length} / {MAX_CHARS}
            </span>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-red-500 font-medium"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="mt-6"
        >
          <p
            className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleChange(s)}
                className="px-4 py-2 rounded-full text-[13px] font-medium border active:scale-95 transition-all duration-150"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  background: name === s ? "#22C55E" : "#fff",
                  color: name === s ? "#fff" : "#0F172A",
                  borderColor: name === s ? "#22C55E" : "#E4E4E7",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <div
        className="px-5 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}
      >
        <button
          onClick={handleSave}
          disabled={!isValid || loading}
          className="w-full h-[54px] rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: isValid && !loading ? "#22C55E" : "#E4E4E7",
            color: isValid && !loading ? "#fff" : "#A1A1AA",
          }}
        >
          {loading ? "Saving…" : "Finish Setup"}
        </button>
      </div>
    </div>
  );
}

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
