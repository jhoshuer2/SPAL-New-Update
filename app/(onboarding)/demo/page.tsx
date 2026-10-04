"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";

const STEPS = [
  {
    step: 1,
    label: "Record",
    headline: "Just say what\nhappened today.",
    body: "Voice or text. \"Sold jollof for ₦8k, bought gas for ₦2k.\" That's all.",
    visual: <RecordVisual />,
    accent: "#22C55E",
  },
  {
    step: 2,
    label: "Understand",
    headline: "SPAL does\nthe maths.",
    body: "No spreadsheets. No formulas. SPAL reads your words and calculates your profit instantly.",
    visual: <UnderstandVisual />,
    accent: "#2563EB",
  },
  {
    step: 3,
    label: "Grow",
    headline: "See your business\nclearly.",
    body: "Daily summaries, patterns, and simple advice. All in plain language you understand.",
    visual: <GrowVisual />,
    accent: "#8B5CF6",
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (!isLast) setStep(step + 1);
    else router.push("/preview");
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#EEF3E9" }}>

      {/* Progress */}
      <div className="px-5 pt-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : router.push("/onboard-goals")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <div className="flex-1"><OnboardProgress step={3} total={4} /></div>
        </div>
      </div>

      {/* Content — animates per step */}
      <div className="flex-1 flex flex-col px-5 pt-8 pb-0 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col"
          >
            {/* Step label */}
            <p
              className="text-[11px] font-semibold tracking-widest uppercase mb-4"
              style={{ fontFamily: "var(--font-satoshi)", color: current.accent }}
            >
              {current.label}
            </p>

            {/* Headline */}
            <h1
              className="text-spal-navy font-bold leading-[1.1] mb-3 whitespace-pre-line"
              style={{ fontSize: "clamp(28px, 8vw, 34px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
            >
              {current.headline}
            </h1>
            <p
              className="text-neutral-400 text-[14px] leading-relaxed mb-8"
              style={{ fontFamily: "var(--font-satoshi)", maxWidth: "300px" }}
            >
              {current.body}
            </p>

            {/* Visual — takes remaining space */}
            <div className="flex-1 min-h-0">
              {current.visual}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="px-5 pb-10 pt-6">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === step ? "24px" : "8px",
                height: "8px",
                background: i === step ? current.accent : "#D4D4D8",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full h-14 rounded-full font-bold text-[15px] text-white transition-all duration-300"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: current.accent,
            boxShadow: `0 4px 20px ${current.accent}35`,
          }}
        >
          {isLast ? "See SPAL in action" : "Next"}
        </button>

        <button
          onClick={() => router.push("/preview")}
          className="w-full mt-3 text-center text-[13px] text-neutral-400 py-1"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Skip
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

/* ── Step visuals ── */

function RecordVisual() {
  return (
    <div className="h-full max-h-56 rounded-2xl p-5 flex flex-col justify-between overflow-hidden" style={{ background: "#0F172A" }}>
      {/* Waveform */}
      <div className="flex items-center gap-1 h-10">
        {[3, 7, 5, 10, 8, 12, 6, 9, 5, 11, 7, 4, 8, 6, 10].map((h, i) => (
          <div
            key={i}
            className="wave-bar rounded-full flex-1"
            style={{ height: `${h * 3}px`, background: "#22C55E", minWidth: "4px", maxWidth: "8px" }}
          />
        ))}
      </div>

      {/* Transcript bubble */}
      <div
        className="rounded-xl px-4 py-3 mt-3"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
          SPAL heard
        </p>
        <p className="text-white text-[13px] leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
          &ldquo;Sold jollof for ₦8,000, bought gas for ₦2,000&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div className="w-2 h-2 rounded-full bg-spal-green animate-pulse" />
        <p className="text-white/35 text-[11px]" style={{ fontFamily: "var(--font-satoshi)" }}>SPAL is listening</p>
      </div>
    </div>
  );
}

function UnderstandVisual() {
  return (
    <div className="h-full max-h-56 rounded-2xl p-5 bg-white border border-neutral-100 flex flex-col justify-between"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
        Parsed instantly
      </p>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-spal-green-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Jollof Rice</p>
              <p className="text-[11px] text-neutral-400">Sale</p>
            </div>
          </div>
          <p className="text-[14px] font-bold text-spal-green" style={{ fontFamily: "var(--font-satoshi)" }}>+₦8,000</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FFF7ED" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Gas</p>
              <p className="text-[11px] text-neutral-400">Expense</p>
            </div>
          </div>
          <p className="text-[14px] font-bold text-spal-orange" style={{ fontFamily: "var(--font-satoshi)" }}>-₦2,000</p>
        </div>
        <div className="border-t border-neutral-100 pt-3 flex justify-between items-center">
          <p className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Profit</p>
          <p className="text-[16px] font-bold text-spal-blue" style={{ fontFamily: "var(--font-satoshi)" }}>₦6,000</p>
        </div>
      </div>
    </div>
  );
}

function GrowVisual() {
  return (
    <div className="h-full max-h-56 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1a1f35 100%)" }}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
        This week
      </p>

      {/* Bars chart */}
      <div className="flex items-end gap-2 h-20">
        {[45, 60, 35, 80, 65, 90, 55].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md transition-all" style={{
            height: `${h}%`,
            background: i === 5 ? "#22C55E" : "rgba(255,255,255,0.12)",
          }} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <p key={i} className="flex-1 text-center text-[10px]"
            style={{ fontFamily: "var(--font-satoshi)", color: i === 5 ? "#22C55E" : "rgba(255,255,255,0.25)" }}>
            {d}
          </p>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-white/50 text-[12px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
          Saturday was your best day. Your sales peak on weekends.
        </p>
      </div>
    </div>
  );
}
