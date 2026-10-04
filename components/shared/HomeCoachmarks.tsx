"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  id:     string;
  title:  string;
  body:   string;
  target: string | null;
}

const STEPS: Step[] = [
  {
    id:     "welcome",
    title:  "Welcome to SPAL",
    body:   "I'm your business assistant. I'll help you track your sales and expenses so you always know how your business is doing. Let me show you around.",
    target: null,
  },
  {
    id:     "snapshot",
    title:  "Today's numbers",
    body:   "This card shows your sales, expenses, and profit for today. It updates the moment you record anything. Green means money in — orange means money out.",
    target: "summary_card",
  },
  {
    id:     "recent",
    title:  "Your recent records",
    body:   "Every sale and expense you log shows up here instantly. Swipe left on any entry to edit or delete it.",
    target: "recent_activity",
  },
  {
    id:     "tab-home",
    title:  "Home",
    body:   "This is your daily hub. Come here every day to see how your business is performing and take quick actions.",
    target: "tab-home",
  },
  {
    id:     "tab-records",
    title:  "Records",
    body:   "Tap here to see your full history of sales and expenses. You can filter, search, and manage everything from this tab.",
    target: "tab-records",
  },
  {
    id:     "tab-insights",
    title:  "Insights",
    body:   "This tab shows trends and breakdowns — which categories you spend the most on, your best days, and how your profit moves over time.",
    target: "tab-insights",
  },
  {
    id:     "tab-profile",
    title:  "Profile",
    body:   "Update your name, business details, notifications, and currency here. Keep your profile complete so SPAL can give you the best advice.",
    target: "tab-profile",
  },
  {
    id:     "spark",
    title:  "Ask SPAL anytime",
    body:   `That's me — the floating button. Tap me whenever you want to ask something like "how much did I make this week?" or "where am I spending the most?"`,
    target: "spark",
  },
];

const STORAGE_KEY  = "spal_coachmarks_v3_done";
// Any previous version counts as done — don't re-show the tour for existing users
const LEGACY_KEYS  = ["spal_coachmarks_v1_done", "spal_coachmarks_v2_done"];
const SP          = 8;   // spotlight outset px
const GAP         = 14;  // gap between spotlight and card px
const MARGIN      = 16;  // min distance from screen edge px

// Per-step estimated card height (title + body chars ÷ ~52 chars/line × 20px + chrome ~140px)
// Generous estimates so card never overlaps spotlight
const CARD_H: Record<string, number> = {
  welcome:       200,
  snapshot:      195,
  recent:        185,
  "tab-home":    185,
  "tab-records": 195,
  "tab-insights":195,
  "tab-profile": 195,
  spark:         195,
};

// ── Geometry ──────────────────────────────────────────────────────────────────

interface TargetRect {
  top: number; left: number; right: number; bottom: number;
  width: number; height: number; centerX: number;
}

function measureTarget(id: string): TargetRect | null {
  if (typeof window === "undefined") return null;
  const el = document.querySelector(`[data-coachmark="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, right: r.right, bottom: r.bottom,
           width: r.width, height: r.height, centerX: r.left + r.width / 2 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HomeCoachmarks() {
  const [stepIdx, setStepIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [target,  setTarget]  = useState<TargetRect | null>(null);

  useEffect(() => {
    const alreadyDone = [STORAGE_KEY, ...LEGACY_KEYS].some(k => localStorage.getItem(k));
    if (!alreadyDone) setVisible(true);
  }, []);

  const step = STEPS[stepIdx];

  const measureStep = useCallback(() => {
    if (!step.target) { setTarget(null); return; }
    let tries = 0;
    const attempt = () => {
      const r = measureTarget(step.target!);
      if (r) { setTarget(r); return; }
      if (++tries < 15) setTimeout(attempt, 80);
    };
    attempt();
  }, [step.target]);

  useEffect(() => {
    if (!visible) return;
    setTarget(null);
    measureStep();
    window.addEventListener("resize", measureStep);
    return () => window.removeEventListener("resize", measureStep);
  }, [stepIdx, visible, measureStep]);

  function advance() { setStepIdx(s => Math.min(s + 1, STEPS.length - 1)); }
  function back()    { setStepIdx(s => Math.max(s - 1, 1)); }
  function dismiss() { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); }

  if (!visible) return null;

  const isWelcome = stepIdx === 0;
  const isLast    = stepIdx === STEPS.length - 1;
  const hasPrev   = stepIdx > 1;

  const vw = typeof window !== "undefined" ? window.innerWidth  : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  const cardW    = Math.min(308, vw - MARGIN * 2);
  const cardLeft = (vw - cardW) / 2;
  const estH     = CARD_H[step.id] ?? 195;

  // Spotlight border-radius
  const spotR = step.id.startsWith("tab-") ? 12 : 18;

  // ── Card vertical position ─────────────────────────────────────────────────
  let cardTop     = (vh - estH) / 2;
  let tailSide: "up" | "down" | null = null;
  let tailX       = cardW / 2 - 9; // default: centred

  if (target) {
    const spotTop    = target.top    - SP;
    const spotBottom = target.bottom + SP;
    const spaceAbove = spotTop - GAP - MARGIN;
    const spaceBelow = vh - spotBottom - GAP - MARGIN;

    if (spaceBelow >= estH || spaceBelow >= spaceAbove) {
      // Place card below spotlight
      cardTop  = Math.min(spotBottom + GAP, vh - estH - MARGIN);
      tailSide = "up";
    } else {
      // Place card above spotlight
      cardTop  = Math.max(spotTop - GAP - estH, MARGIN);
      tailSide = "down";
    }
    cardTop = Math.max(MARGIN, Math.min(cardTop, vh - estH - MARGIN));

    // Tail X points at target centre
    tailX = Math.max(16, Math.min(target.centerX - cardLeft - 9, cardW - 34));
  }

  const TAIL = (
    <div style={{
      width: 0, height: 0, flexShrink: 0,
      borderLeft:  "9px solid transparent",
      borderRight: "9px solid transparent",
      ...(tailSide === "up"
        ? { borderBottom: "10px solid #fff", marginLeft: tailX, marginBottom: -1 }
        : { borderTop:    "10px solid #fff", marginLeft: tailX, marginTop:    -1 }),
    }} />
  );

  return (
    <AnimatePresence>
      {/* Dark overlay */}
      <motion.div
        key="cm-overlay"
        className="fixed inset-0 z-[100] cursor-pointer"
        style={{ background: "rgba(10,14,26,0.80)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={dismiss}
      />

      {/* Spotlight */}
      {target && (
        <motion.div
          key={`cm-spot-${stepIdx}`}
          className="fixed z-[101] pointer-events-none"
          style={{
            top:    target.top    - SP,
            left:   target.left   - SP,
            width:  target.width  + SP * 2,
            height: target.height + SP * 2,
            borderRadius: spotR,
            boxShadow:
              "0 0 0 9999px rgba(10,14,26,0.80)," +
              "0 0 0 2px rgba(34,197,94,0.9)," +
              "0 0 20px 4px rgba(34,197,94,0.22)",
            background: "transparent",
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      {/* Card */}
      <motion.div
        key={`cm-card-${stepIdx}`}
        className="fixed z-[102] pointer-events-auto"
        style={{ top: cardTop, left: cardLeft, width: cardW }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1,  y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.26, ease: [0.34, 1.1, 0.64, 1] }}
      >
        {tailSide === "up" && TAIL}

        <div
          className="rounded-3xl px-5 py-5"
          style={{ background: "#fff", boxShadow: "0 16px 48px rgba(0,0,0,0.22)" }}
        >
          {/* Avatar row */}
          <div className="flex items-center gap-2.5 mb-3">
            <Image
              src="/spal-ai.webp"
              alt="SPAL"
              width={isWelcome ? 52 : 26}
              height={isWelcome ? 52 : 26}
              style={{ width: isWelcome ? 52 : 26, height: isWelcome ? 52 : 26,
                       objectFit: "contain", flexShrink: 0,
                       filter: "drop-shadow(0 2px 6px rgba(34,197,94,0.35))" }}
            />
            {!isWelcome && (
              <span className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}>
                SPAL Guide
              </span>
            )}
          </div>

          {/* Progress bar (steps 1+) */}
          {!isWelcome && (
            <div className="flex gap-1.5 mb-3">
              {STEPS.slice(1).map((_, i) => (
                <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                  style={{ background: i < stepIdx ? "#22C55E" : "#E5E7EB" }} />
              ))}
            </div>
          )}

          <h3 className="font-bold leading-snug mb-1.5"
            style={{ fontSize: isWelcome ? "16px" : "14.5px",
                     fontFamily: "var(--font-satoshi)", color: "#0F172A" }}>
            {step.title}
          </h3>

          <p className="leading-relaxed"
            style={{ fontSize: "12.5px", fontFamily: "var(--font-satoshi)", color: "#6B7280" }}>
            {step.body}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            {isWelcome ? (
              <>
                <button onClick={dismiss}
                  className="text-[12.5px] font-semibold py-2 active:opacity-60"
                  style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}>
                  Skip tour
                </button>
                <button onClick={advance}
                  className="h-10 px-5 rounded-full font-bold text-[12.5px] text-white active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E" }}>
                  Show me around
                </button>
              </>
            ) : (
              <>
                {hasPrev
                  ? <button onClick={back}
                      className="text-[12.5px] font-semibold py-2 active:opacity-60"
                      style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}>Back</button>
                  : <button onClick={dismiss}
                      className="text-[12.5px] font-semibold py-2 active:opacity-60"
                      style={{ fontFamily: "var(--font-satoshi)", color: "#9CA3AF" }}>Skip</button>
                }
                <button onClick={isLast ? dismiss : advance}
                  className="h-10 px-5 rounded-full font-bold text-[12.5px] text-white active:scale-95 transition-transform"
                  style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E" }}>
                  {isLast ? "Got it!" : "Next"}
                </button>
              </>
            )}
          </div>
        </div>

        {tailSide === "down" && TAIL}
      </motion.div>
    </AnimatePresence>
  );
}
