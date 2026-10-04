"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore, type BusinessGoal } from "@/store";
import { ArrowLeft01Icon, Tick01Icon, ChartIncreaseIcon, Scissor01Icon, Search01Icon, Dollar01Icon } from "hugeicons-react";

const GOALS: {
  goal: BusinessGoal;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  nudge: string;
}[] = [
  {
    goal: "track_sales",
    label: "Track my sales daily",
    sub: "Know exactly how much I make each day",
    icon: <ChartIncreaseIcon size={20} />,
    accent: "#22C55E",
    nudge: "SPAL records every sale in seconds. Just tap or speak. No forms.",
  },
  {
    goal: "know_profit",
    label: "Know my real profit",
    sub: "See what I actually keep after expenses",
    icon: <Dollar01Icon size={20} />,
    accent: "#2563EB",
    nudge: "SPAL shows you exactly what you keep after every sale. Not just what you make.",
  },
  {
    goal: "reduce_expenses",
    label: "Reduce my expenses",
    sub: "Find where money is leaking out",
    icon: <Scissor01Icon size={20} />,
    accent: "#F97316",
    nudge: "SPAL spots your biggest spending patterns and shows you where money is quietly leaving.",
  },
  {
    goal: "grow_business",
    label: "Grow my business",
    sub: "Make better decisions to grow",
    icon: <ChartIncreaseIcon size={20} />,
    accent: "#8B5CF6",
    nudge: "SPAL tracks your best days, best products, and patterns so you know what to do more of.",
  },
  {
    goal: "understand_spending",
    label: "Understand my spending",
    sub: "See patterns in how I spend money",
    icon: <Search01Icon size={20} />,
    accent: "#2563EB",
    nudge: "SPAL gives you a simple breakdown of where your money goes every week. No guesswork.",
  },
];

function buildNudge(goals: Set<BusinessGoal>): string {
  if (goals.size === 0) return "";
  // Priority order for nudge copy
  if (goals.has("know_profit")) return GOALS.find(g => g.goal === "know_profit")!.nudge;
  if (goals.has("track_sales")) return GOALS.find(g => g.goal === "track_sales")!.nudge;
  if (goals.has("reduce_expenses")) return GOALS.find(g => g.goal === "reduce_expenses")!.nudge;
  if (goals.has("grow_business")) return GOALS.find(g => g.goal === "grow_business")!.nudge;
  return GOALS.find(g => g.goal === "understand_spending")!.nudge;
}

export default function GoalsPage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<Set<BusinessGoal>>(new Set());

  function toggle(goal: BusinessGoal) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(goal)) next.delete(goal);
      else next.add(goal);
      return next;
    });
  }

  function handleContinue() {
    setOnboardingData({ goals: Array.from(selected) });
    router.push("/signup");
  }

  const nudge = buildNudge(selected);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#EEF3E9" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/tracking-methods")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <div className="flex-1"><OnboardProgress step={3} total={3} /></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-7"
        >
          <p
            className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Step 3 of 3
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(28px, 8vw, 34px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            What do you want<br />to achieve?
          </h1>
          <p className="mt-2 text-neutral-400 text-[13px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            Choose all that apply. SPAL will focus on what matters to you.
          </p>
        </motion.div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-container px-5 pt-6 pb-52">
        <div className="space-y-2.5">
          {GOALS.map((item, i) => {
            const isSelected = selected.has(item.goal);
            return (
              <motion.button
                key={item.goal}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.12, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => toggle(item.goal)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all duration-150"
                style={{
                  border: isSelected ? `1.5px solid ${item.accent}` : "1.5px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${item.accent}14, 0 2px 8px rgba(0,0,0,0.06)`
                    : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.accent}12`, color: item.accent }}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {item.label}
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {item.sub}
                  </p>
                </div>

                <AnimatePresence>
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.18, ease: [0.34, 1.4, 0.64, 1] }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.accent }}
                    >
                      <Tick01Icon size={13} color="white" />
                    </motion.div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg border-2 border-neutral-200 flex-shrink-0" />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom — nudge + CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-6"
        style={{ background: "linear-gradient(to top, #EEF3E9 65%, transparent)" }}
      >
        {/* Nudge */}
        <AnimatePresence>
          {nudge && (
            <motion.div
              key={nudge}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="mb-4 rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}
            >
              <span className="text-[18px] mt-0.5" role="img" aria-label="spark">✦</span>
              <p className="text-[13px] text-spal-navy leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                {nudge}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: selected.size > 0 ? "#22C55E" : "#E4E4E7",
            color: selected.size > 0 ? "#fff" : "#A1A1AA",
          }}
        >
          Continue{selected.size > 0 ? ` (${selected.size} selected)` : ""}
        </button>
        <button
          onClick={() => { setOnboardingData({ goals: [] }); router.push("/signup"); }}
          className="w-full mt-3 text-center text-[13px] text-neutral-400 py-1"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Skip for now
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
