"use client";

import { motion } from "framer-motion";
import { ArrowLeft01Icon, ArrowRight01Icon, Target01Icon, PlusSignIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import type { CoachGoal } from "@/lib/types";

const BG = "#EEF3E9";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(diff / 86400000);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function groupOf(iso: string): "Today" | "Yesterday" | "Earlier" {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startToday) return "Today";
  if (t >= startToday - 86400000) return "Yesterday";
  return "Earlier";
}

function GoalCard({ goal, onClick }: { goal: CoachGoal; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.99] transition-transform text-left"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E0F4E9" }}>
        <Target01Icon size={20} color="#16A34A" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
          {goal.title}
        </p>
        <p className="text-[12px] text-neutral-400 mt-0.5">{relativeTime(goal.createdAt)}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {goal.status === "completed" ? (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>
              Achieved
            </span>
          ) : goal.progress > 0 ? (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#E0F4E9", color: "#15803D" }}>
              {goal.progress}% done
            </span>
          ) : !goal.dueDate ? (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#E0F4E9", color: "#15803D" }}>
              Choose a Due Date
            </span>
          ) : null}
        </div>
      </div>
      <ArrowRight01Icon size={18} className="text-neutral-300 flex-shrink-0" />
    </motion.button>
  );
}

export default function GoalsListPage() {
  const { coachGoals } = useSPALStore();

  const groups: ("Today" | "Yesterday" | "Earlier")[] = ["Today", "Yesterday", "Earlier"];
  const byGroup = groups
    .map((g) => ({ group: g, items: coachGoals.filter((goal) => groupOf(goal.createdAt) === g) }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="min-h-full" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => { window.location.href = "/home"; }}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} color="#0F172A" />
        </button>
        <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          All Goals
        </h1>
      </div>

      {coachGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 text-center" style={{ minHeight: "60vh" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#E0F4E9" }}>
            <Target01Icon size={30} color="#16A34A" />
          </div>
          <p className="text-[17px] font-bold text-spal-navy mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>No goals yet</p>
          <p className="text-[14px] text-neutral-400 max-w-[240px] mb-5">Tell SPAL your goals for today and it&apos;ll break them into simple steps.</p>
          <button
            onClick={() => { window.location.href = "/set-goals/capture"; }}
            className="h-11 px-6 rounded-full text-white font-bold text-[14px] active:scale-95 transition-transform"
            style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}
          >
            Set a goal
          </button>
        </div>
      ) : (
        <div className="px-5 pb-28 space-y-6">
          {byGroup.map((section) => (
            <div key={section.group}>
              <p className="text-[16px] font-black text-spal-navy mb-3" style={{ fontFamily: "var(--font-satoshi)" }}>
                {section.group}
              </p>
              <div className="space-y-3">
                {section.items.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onClick={() => { window.location.href = `/set-goals/${goal.id}`; }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add goal FAB */}
      <button
        onClick={() => { window.location.href = "/set-goals/capture"; }}
        aria-label="Set a new goal"
        className="fixed z-50 w-14 h-14 rounded-full bg-spal-green flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", right: "20px", boxShadow: "0 8px 24px rgba(34,197,94,0.45)" }}
      >
        <PlusSignIcon size={24} color="#fff" />
      </button>
    </div>
  );
}
