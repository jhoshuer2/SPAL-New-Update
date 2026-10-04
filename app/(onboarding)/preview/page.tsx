"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, Mic01Icon, ChartIncreaseIcon, ChatIcon, BulbIcon } from "hugeicons-react";

const FEATURES = [
  { icon: <VoiceIcon />,    label: "Record by voice",       sub: "Say it, SPAL writes it down" },
  { icon: <ProfitIcon />,   label: "See your real profit",   sub: "Every day, automatically" },
  { icon: <AskIcon />,      label: "Ask any question",       sub: "Plain answers about your money" },
  { icon: <InsightIcon />,  label: "Get smart insights",     sub: "Patterns and advice, weekly" },
];

export default function PreviewPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#EEF3E9" }}>

      {/* Progress */}
      <div className="px-5 pt-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/demo")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <div className="flex-1"><OnboardProgress step={4} total={4} /></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-5 pt-7 pb-0 overflow-y-auto scroll-container">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}>
            You&apos;re almost in
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(30px, 8.5vw, 36px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            Here&apos;s what<br />you&apos;re getting.
          </h1>
        </motion.div>

        {/* Dark preview card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.16, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mt-6 rounded-2xl p-5"
          style={{ background: "#0F172A" }}
        >
          <p className="text-white/30 text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
            Sample — your view
          </p>

          <div className="mb-4">
            <p className="text-white/30 text-xs mb-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>Today&apos;s profit</p>
            <p className="font-bold" style={{ fontSize: "32px", color: "#22C55E", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}>
              ₦16,500
            </p>
          </div>

          <div className="flex gap-5 mb-4">
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-satoshi)" }}>Sales</p>
              <p className="text-white/70 font-semibold text-sm mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>₦24,500</p>
            </div>
            <div className="w-px bg-white/8" />
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-satoshi)" }}>Expenses</p>
              <p className="font-semibold text-sm mt-0.5" style={{ fontFamily: "var(--font-satoshi)", color: "#F97316" }}>₦8,000</p>
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-white/40 text-[12px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
              Your Jollof Rice sold best this week. Try stocking more on Thursdays.
            </p>
          </div>
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-5 space-y-2.5"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="w-9 h-9 rounded-xl bg-spal-green-50 flex items-center justify-center flex-shrink-0 text-spal-green">
                {f.icon}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>{f.label}</p>
                <p className="text-[11px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>{f.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="h-36" />
      </div>

      {/* Fixed CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: "linear-gradient(to top, #EEF3E9 60%, transparent)" }}
      >
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          onClick={() => router.push("/signup")}
          className="w-full h-14 rounded-full font-bold text-[15px] text-white"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: "#0F172A",
            boxShadow: "0 4px 20px rgba(15,23,42,0.25)",
          }}
        >
          Create my free account
        </motion.button>
        <p className="text-center text-neutral-400 text-[12px] mt-3" style={{ fontFamily: "var(--font-satoshi)" }}>
          Free to start · No credit card needed
        </p>
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

function VoiceIcon()  { return <Mic01Icon        size={18} />; }
function ProfitIcon() { return <ChartIncreaseIcon size={18} />; }
function AskIcon()    { return <ChatIcon          size={18} />; }
function InsightIcon(){ return <BulbIcon          size={18} />; }
