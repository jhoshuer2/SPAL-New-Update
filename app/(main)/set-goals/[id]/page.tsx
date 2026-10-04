"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { ArrowLeft01Icon, Tick01Icon, Target01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const BG = "#EEF3E9";

function groupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startToday) return "Today";
  if (t >= startToday - 86400000) return "Yesterday";
  return "Earlier";
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { coachGoals, toggleBreakdown, markGoalAchieved } = useSPALStore();

  const goal = useMemo(() => coachGoals.find((g) => g.id === id), [coachGoals, id]);

  if (!goal) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-8 text-center" style={{ background: BG }}>
        <p className="text-[16px] font-bold text-spal-navy mb-4" style={{ fontFamily: "var(--font-satoshi)" }}>
          This goal isn&apos;t here anymore
        </p>
        <button
          onClick={() => { window.location.href = "/set-goals/list"; }}
          className="h-11 px-6 rounded-full text-white font-bold text-[14px]"
          style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}
        >
          Back to goals
        </button>
      </div>
    );
  }

  const allDone = goal.progress === 100;

  return (
    <div className="min-h-full" style={{ background: BG }}>
      {/* Header — back + goal title inline */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => { window.location.href = "/set-goals/list"; }}
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} color="#0F172A" />
        </button>
        <h1 className="text-[19px] font-black text-spal-navy leading-snug truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
          {goal.title}
        </h1>
      </div>

      {/* Checklist */}
      <div className="px-5 pb-40">
        <p className="text-[18px] font-black text-spal-navy mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
          {groupLabel(goal.createdAt)}
        </p>
        <div className="space-y-3">
          {goal.breakdowns.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleBreakdown(goal.id, b.id)}
              className="w-full flex items-center gap-3.5 bg-white rounded-2xl px-4 py-5 active:scale-[0.99] transition-transform text-left"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: b.completed ? "#22C55E" : "transparent",
                  border: b.completed ? "none" : "2px solid #1F2937",
                }}
              >
                {b.completed && <Tick01Icon size={16} color="#fff" />}
              </span>
              <span
                className="text-[16px] font-semibold"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  color: b.completed ? "#9CA3AF" : "#121212",
                  textDecoration: b.completed ? "line-through" : "none",
                }}
              >
                {b.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mark all as Achieved — centered pill */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 flex justify-center" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => markGoalAchieved(goal.id)}
          disabled={allDone}
          className="inline-flex items-center justify-center gap-2.5 px-10 h-14 rounded-2xl text-white font-bold text-[16px] disabled:opacity-70"
          style={{ background: allDone ? "#16A34A" : "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.4)", fontFamily: "var(--font-satoshi)" }}
        >
          <Target01Icon size={20} color="#fff" />
          {allDone ? "All steps achieved" : "Mark all as Achieved"}
        </motion.button>
      </div>
    </div>
  );
}
