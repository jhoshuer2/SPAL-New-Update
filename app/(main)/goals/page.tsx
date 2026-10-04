"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight01Icon, PlusSignIcon, Cancel01Icon, SparklesIcon, Tick01Icon,
  ChartIncreaseIcon, Award01Icon, Calendar01Icon, Target01Icon,
} from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GoalType = "daily_sales" | "weekly_profit" | "monthly_sales" | "yearly_revenue";

interface GoalData {
  id:        string;
  goal_type: GoalType;
  target:    number;
  current:   number;
  progress:  number;
  completed: boolean;
}

interface GoalMeta {
  label:   string;
  period:  string;
  hint:    string;
  icon:    React.ReactNode;
  accent:  string; // hex
  tintBg:  string; // pastel bg
}

const GOAL_META: Record<GoalType, GoalMeta> = {
  daily_sales: {
    label: "Daily sales",   period: "today",      hint: "What sales do you want to hit today?",
    icon: <ChartIncreaseIcon size={20} color="#16A34A" />,
    accent: "#16A34A", tintBg: "#E0F4E9",
  },
  weekly_profit: {
    label: "Weekly profit", period: "this week",  hint: "How much profit do you want this week?",
    icon: <Target01Icon size={20} color="#2563EB" />,
    accent: "#2563EB", tintBg: "#E3E9F8",
  },
  monthly_sales: {
    label: "Monthly sales", period: "this month", hint: "Total sales target for this month?",
    icon: <Calendar01Icon size={20} color="#EA580C" />,
    accent: "#EA580C", tintBg: "#F3E5DD",
  },
  yearly_revenue: {
    label: "Yearly revenue",period: "this year",  hint: "Big yearly revenue ambition?",
    icon: <Award01Icon size={20} color="#8B5CF6" />,
    accent: "#8B5CF6", tintBg: "#ECE5F9",
  },
};

const GOAL_ORDER: GoalType[] = ["daily_sales", "weekly_profit", "monthly_sales", "yearly_revenue"];

// localStorage key for "intention" text per goal type
function intentionKey(type: GoalType) { return `spal_goal_why_${type}`; }

// ─────────────────────────────────────────────────────────────────────────────
// Main Goals page
// ─────────────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const router = useRouter();
  const [goals,   setGoals]   = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GoalType | null>(null);
  // Toast state — appears after saving a goal
  const [coachToast, setCoachToast] = useState<{ type: GoalType; target: number } | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res  = await fetch("/api/goals");
      const data = await res.json();
      if (data.success) setGoals(data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function handleSave(goalType: GoalType, amount: number, intention: string) {
    await fetch("/api/goals", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ goal_type: goalType, target_amount: amount }),
    });
    // Save intention locally
    if (intention.trim()) {
      try { localStorage.setItem(intentionKey(goalType), intention.trim()); } catch {}
    } else {
      try { localStorage.removeItem(intentionKey(goalType)); } catch {}
    }
    setEditing(null);
    setCoachToast({ type: goalType, target: amount });
    fetchGoals();
    // Auto-dismiss after 10s if user doesn't act
    setTimeout(() => setCoachToast((t) => (t?.type === goalType ? null : t)), 10000);
  }

  async function handleDelete(goalType: GoalType) {
    await fetch("/api/goals", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ goal_type: goalType }),
    });
    try { localStorage.removeItem(intentionKey(goalType)); } catch {}
    setEditing(null);
    fetchGoals();
  }

  function openCoachWithGoal(type: GoalType, target: number) {
    const meta = GOAL_META[type];
    let intention = "";
    try { intention = localStorage.getItem(intentionKey(type)) ?? ""; } catch {}
    const params = new URLSearchParams({
      goal:      meta.label,
      target:    String(target),
      period:    meta.period,
      ...(intention ? { intention } : {}),
    });
    router.push(`/ask?${params.toString()}`);
    setCoachToast(null);
  }

  const goalsMap = Object.fromEntries(goals.map((g) => [g.goal_type, g])) as Partial<Record<GoalType, GoalData>>;
  const anyGoal  = goals.length > 0;
  const avgPct   = anyGoal
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="px-5 pt-6 pb-6 space-y-5 relative" style={{ background: "#EEF3E9", minHeight: "100%" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Goals
        </h1>
        <p className="text-[13px] text-neutral-500 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
          Where do you want to take your business?
        </p>
      </motion.div>

      {/* Motivation banner — only shows if user has at least one goal */}
      {!loading && anyGoal && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{ background: "#0F172A" }}
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34,197,94,0.25), transparent 70%)" }} />

          <p className="text-white/55 text-[11.5px] font-medium uppercase tracking-widest" style={{ fontFamily: "var(--font-satoshi)" }}>
            Overall progress
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-white text-[34px] font-bold leading-none" style={{ fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}>
              {avgPct}%
            </p>
            <p className="text-white/50 text-[13px] font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
              across {goals.length} goal{goals.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-spal-green"
              initial={{ width: 0 }}
              animate={{ width: `${avgPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <p className="mt-3 text-white/55 text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
            {avgPct < 25  ? "Just getting started — keep recording sales, the chart climbs every entry." :
             avgPct < 50  ? "Building momentum. Stay consistent." :
             avgPct < 75  ? "You're past the middle — push through." :
             avgPct < 100 ? "Almost there. One more push." :
                            "Goal crushed! Set the next mountain."}
          </p>
        </motion.div>
      )}

      {/* Goal cards */}
      {loading ? (
        <GoalsSkeleton />
      ) : (
        <div className="space-y-3">
          {GOAL_ORDER.map((type) => {
            const goal = goalsMap[type];
            return goal
              ? <GoalCard key={type} type={type} goal={goal} onEdit={() => setEditing(type)} onAskCoach={() => openCoachWithGoal(type, goal.target)} />
              : <EmptyGoalCard key={type} type={type} onSet={() => setEditing(type)} />;
          })}
        </div>
      )}

      {/* Empty-all helper text */}
      {!loading && !anyGoal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-6">
          <p className="text-[13px] text-neutral-400 leading-relaxed">
            Pick one goal above to start. SPAL tracks your progress from every sale and expense you record.
          </p>
        </motion.div>
      )}

      <div className="h-6" />

      {/* ── Edit/Set goal sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <SetGoalSheet
            goalType={editing}
            existing={goalsMap[editing]?.target ?? null}
            onSave={(amount, intention) => handleSave(editing, amount, intention)}
            onClose={() => setEditing(null)}
            onDelete={goalsMap[editing] ? () => handleDelete(editing) : undefined}
          />
        )}
      </AnimatePresence>

      {/* ── Coach toast — appears after saving ─────────────────────── */}
      <AnimatePresence>
        {coachToast && (
          <CoachToast
            label={GOAL_META[coachToast.type].label}
            target={coachToast.target}
            onAccept={() => openCoachWithGoal(coachToast.type, coachToast.target)}
            onDismiss={() => setCoachToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal card (active)
// ─────────────────────────────────────────────────────────────────────────────

function GoalCard({
  type, goal, onEdit, onAskCoach,
}: {
  type: GoalType;
  goal: GoalData;
  onEdit: () => void;
  onAskCoach: () => void;
}) {
  const meta = GOAL_META[type];
  const pct  = Math.min(100, goal.progress);
  const [intention, setIntention] = useState<string>("");

  useEffect(() => {
    try { setIntention(localStorage.getItem(intentionKey(type)) ?? ""); } catch {}
  }, [type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[20px] p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: meta.tintBg }}>
            {meta.icon}
          </div>
          <div>
            <p className="text-[13px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
              {meta.label}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">{meta.period}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="text-[11.5px] font-semibold text-spal-navy/60 hover:text-spal-navy"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Edit
        </button>
      </div>

      {/* Amount + progress */}
      <div className="flex items-baseline justify-between gap-2 mb-2 min-w-0">
        <p className="font-bold truncate min-w-0" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(18px, 5.5vw, 22px)", color: meta.accent, letterSpacing: "-0.02em" }}>
          {formatCurrency(goal.current)}
        </p>
        <p className="text-[12px] text-neutral-400 flex-shrink-0 whitespace-nowrap" style={{ fontFamily: "var(--font-satoshi)" }}>
          of {formatCurrency(goal.target)}
        </p>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: meta.accent }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
        />
      </div>
      <p className="text-[11px] mt-1.5 font-semibold" style={{ fontFamily: "var(--font-satoshi)", color: meta.accent }}>
        {pct}% {goal.completed ? "· Crushed!" : ""}
      </p>

      {/* User's "why" */}
      {intention && (
        <div className="mt-4 rounded-xl p-3" style={{ background: meta.tintBg, border: `1px solid ${meta.accent}22` }}>
          <p className="text-[11px] font-bold mb-0.5 uppercase tracking-wider" style={{ fontFamily: "var(--font-satoshi)", color: meta.accent }}>
            Your why
          </p>
          <p className="text-[13px] text-spal-navy leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
            {intention}
          </p>
        </div>
      )}

      {/* Soft CTA to coach */}
      <button
        onClick={onAskCoach}
        className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-full bg-neutral-50 hover:bg-neutral-100 active:scale-[0.99] transition-all"
        style={{ border: "1px solid rgba(15,23,42,0.08)" }}
      >
        <SparklesIcon size={14} className="text-spal-navy" />
        <span className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Ask a coach how to hit this
        </span>
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty goal card (not set)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyGoalCard({ type, onSet }: { type: GoalType; onSet: () => void }) {
  const meta = GOAL_META[type];
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSet}
      className="w-full bg-white rounded-[20px] p-4 flex items-center gap-3 text-left active:bg-neutral-50 transition-colors"
      style={{ border: "1px dashed rgba(15,23,42,0.12)" }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: meta.tintBg }}>
        {meta.icon}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          {meta.label}
        </p>
        <p className="text-[11.5px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
          {meta.hint}
        </p>
      </div>
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: meta.accent }}>
        <PlusSignIcon size={15} color="#fff" />
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Set Goal Sheet
// ─────────────────────────────────────────────────────────────────────────────

function SetGoalSheet({
  goalType, existing, onSave, onClose, onDelete,
}: {
  goalType: GoalType;
  existing: number | null;
  onSave: (amount: number, intention: string) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const meta = GOAL_META[goalType];
  const [raw,        setRaw]        = useState(existing ? String(existing) : "");
  const [intention,  setIntention]  = useState("");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    try { setIntention(localStorage.getItem(intentionKey(goalType)) ?? ""); } catch {}
  }, [goalType]);

  async function save() {
    const val = Number(raw.replace(/,/g, ""));
    if (!val || val <= 0) return;
    setSaving(true);
    await onSave(val, intention);
    setSaving(false);
  }

  const valid = Number(raw) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-spal-navy/40 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-neutral-200 rounded-full" />
        </div>

        {/* Scroll zone */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-3"
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: meta.tintBg }}>
                {meta.icon}
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {meta.label}
                </h2>
                <p className="text-[12px] text-neutral-400 mt-0.5">{meta.hint}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100"
              aria-label="Close"
            >
              <Cancel01Icon size={15} className="text-neutral-500" />
            </button>
          </div>

          {/* Target amount */}
          <label className="block text-[11.5px] font-bold text-neutral-500 uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
            Target amount
          </label>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400">₦</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-spal-navy rounded-2xl border-2 border-neutral-100 focus:border-spal-green outline-none bg-neutral-50 transition-colors"
              style={{ fontFamily: "var(--font-satoshi)" }}
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[5000, 10000, 20000, 50000, 100000, 500000].map((v) => (
              <button
                key={v}
                onClick={() => setRaw(String(v))}
                className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  background:  Number(raw) === v ? meta.tintBg : "#FAFAFA",
                  color:       Number(raw) === v ? meta.accent : "#67738F",
                  border:      `1px solid ${Number(raw) === v ? meta.accent + "33" : "#F1F5F9"}`,
                }}
              >
                ₦{v >= 1000 ? `${v / 1000}k` : v}
              </button>
            ))}
          </div>

          {/* Why text */}
          <label className="block text-[11.5px] font-bold text-neutral-500 uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
            Why does this matter? <span className="text-neutral-300 font-medium normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="e.g. I want to open a second shop by December"
            rows={3}
            className="w-full px-4 py-3 text-[14px] text-spal-navy rounded-2xl border-2 border-neutral-100 focus:border-spal-green outline-none bg-neutral-50 transition-colors resize-none"
            style={{ fontFamily: "var(--font-satoshi)" }}
          />
          <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
            A clear &ldquo;why&rdquo; helps you stay motivated — and gives the AI coach context.
          </p>

          {/* Save button */}
          <button
            onClick={save}
            disabled={!valid || saving}
            className="mt-6 w-full h-14 rounded-full font-bold text-[15px] transition-all duration-200"
            style={{
              fontFamily: "var(--font-satoshi)",
              background: valid && !saving ? "#22C55E" : "#E4E4E7",
              color:      valid && !saving ? "#fff" : "#A1A1AA",
            }}
          >
            {saving ? "Saving…" : existing ? "Update goal" : "Set goal"}
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full py-3 mt-2 text-sm text-red-500 font-medium"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              Remove this goal
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Coach toast — soft prompt after saving a goal
// ─────────────────────────────────────────────────────────────────────────────

function CoachToast({
  label, target, onAccept, onDismiss,
}: {
  label: string;
  target: number;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  void target;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[420px] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "#0F172A", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
      >
        <div className="w-9 h-9 rounded-full bg-spal-green/15 flex items-center justify-center flex-shrink-0">
          <SparklesIcon size={16} className="text-spal-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13.5px] font-bold leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
            Goal saved — nice one
          </p>
          <p className="text-white/60 text-[12.5px] mt-0.5 leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
            Want a coach to help you plan how to hit your {label.toLowerCase()}?
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAccept}
              className="flex-1 h-9 rounded-full bg-spal-green text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              Talk to a coach <ArrowRight01Icon size={13} />
            </button>
            <button
              onClick={onDismiss}
              className="px-4 h-9 rounded-full text-white/70 text-[12.5px] font-semibold"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-white/40 -mt-1 -mr-1" aria-label="Dismiss">
          <Cancel01Icon size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function GoalsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-[20px] bg-white animate-pulse h-[120px]" />
      ))}
    </div>
  );
}

// Unused but kept for tree-shaking signals
void Tick01Icon;
