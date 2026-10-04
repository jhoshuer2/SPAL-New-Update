"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Cancel01Icon, ChartIncreaseIcon, ChartDecreaseIcon, ChatIcon, ArrowRight01Icon, ScanIcon, Folder01Icon } from "hugeicons-react";

const SLIDE_DURATION = 4500; // ms each slide auto-advances

// ── Slide definitions ─────────────────────────────────────────────────────────

const SLIDES = [
  { id: "intro",    bg: "#0F172A", dark: true  },
  { id: "record",   bg: "#FFFFFF", dark: false },
  { id: "numbers",  bg: "#0F172A", dark: true  },
  { id: "ask",      bg: "#0F172A", dark: true  },
  { id: "loop",     bg: "#FFFFFF", dark: false },
  { id: "ready",    bg: "#FFFFFF", dark: false },
] as const;

type SlideId = typeof SLIDES[number]["id"];

// ── Shared animation presets ─────────────────────────────────────────────────

const EASE      = [0.34, 1.1, 0.64, 1] as [number,number,number,number];
const EASE_TILE = [0.34, 1.2, 0.64, 1] as [number,number,number,number];
const EASE_SLIDE= [0.4,  0,   0.2,  1] as [number,number,number,number];

const fadeUp = {
  initial:    { opacity: 0, y: 22 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.55, ease: EASE },
};

// ── Individual slide contents ─────────────────────────────────────────────────

function SlideIntro() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 gap-6">
      <motion.div {...fadeUp}>
        <Image
          src="/spal-ai.webp"
          alt="SPAL"
          width={120}
          height={120}
          style={{ objectFit: "contain",
                   filter: "drop-shadow(0 8px 24px rgba(34,197,94,0.5))" }}
        />
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.15, ...fadeUp.transition }}>
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-spal-green mb-2"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Welcome to
        </p>
        <h1 className="text-[38px] font-black text-white leading-none"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          SPAL
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-[15px] text-white/60 leading-relaxed max-w-[260px]"
        style={{ fontFamily: "var(--font-satoshi)" }}
      >
        Your AI business companion for everyday entrepreneurs.
      </motion.p>
    </div>
  );
}

function SlideRecord() {
  const tiles = [
    { icon: <ChartIncreaseIcon size={22} color="#fff" />, label: "Add Sale",    bg: "#22C55E", delay: 0     },
    { icon: <ChartDecreaseIcon size={22} color="#fff" />, label: "Add Expense", bg: "#F97316", delay: 0.08  },
    { icon: <ScanIcon          size={22} color="#0F172A" />, label: "Scan",    bg: "#F1F5F9", delay: 0.16  },
    { icon: <Folder01Icon      size={22} color="#0F172A" />, label: "Import",  bg: "#F1F5F9", delay: 0.24  },
  ];

  return (
    <div className="flex flex-col justify-center flex-1 px-6 gap-8">
      <motion.div {...fadeUp} className="text-center">
        <h2 className="text-[26px] font-black text-spal-navy leading-tight"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Record in seconds
        </h2>
        <p className="text-[14px] text-neutral-500 mt-2 leading-relaxed"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Log sales, expenses, receipts, and imports — all in one tap.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1,  scale: 1,    y: 0  }}
            transition={{ delay: t.delay + 0.2, duration: 0.45, ease: EASE_TILE }}
            className="rounded-2xl flex flex-col items-center justify-center py-5 gap-2"
            style={{ background: t.bg }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.08)" }}>
              {t.icon}
            </div>
            <span className="text-[13px] font-bold"
              style={{
                fontFamily: "var(--font-satoshi)",
                color: t.bg === "#F1F5F9" ? "#0F172A" : "#fff",
              }}>
              {t.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideNumbers() {
  const [sales,    setSales]    = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    const targets = { sales: 43700, expenses: 13000 };
    const steps   = 40;
    let i = 0;
    const id = setInterval(() => {
      i++;
      const p = i / steps;
      const ease = 1 - Math.pow(1 - p, 3);
      setSales(Math.round(targets.sales * ease));
      setExpenses(Math.round(targets.expenses * ease));
      if (i >= steps) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, []);

  const profit = sales - expenses;

  return (
    <div className="flex flex-col justify-center flex-1 px-6 gap-6">
      <motion.div {...fadeUp} className="text-center">
        <h2 className="text-[26px] font-black text-white leading-tight"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Know your numbers
        </h2>
        <p className="text-[14px] text-white/50 mt-2"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Live profit, sales, and expenses — updated as you record.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1,  y: 0,  scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-3xl p-5"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Today's Record
        </p>
        <p className="text-[13px] font-bold text-spal-green mb-1"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Profit
        </p>
        <p className="text-[36px] font-black text-white leading-none mb-4"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          ₦{profit.toLocaleString()}
        </p>

        <div className="flex gap-0 border-t border-white/10 pt-4">
          <div className="flex-1 pr-4 border-r border-white/10">
            <p className="text-[11px] text-white/40 mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>Sales</p>
            <p className="text-[18px] font-bold text-spal-green" style={{ fontFamily: "var(--font-satoshi)" }}>
              ₦{sales.toLocaleString()}
            </p>
          </div>
          <div className="flex-1 pl-4">
            <p className="text-[11px] text-white/40 mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>Expenses</p>
            <p className="text-[18px] font-bold" style={{ color: "#F97316", fontFamily: "var(--font-satoshi)" }}>
              ₦{expenses.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SlideAsk() {
  const bubbles = [
    { role: "user",  text: "How much did I make this week?",      delay: 0.2  },
    { role: "spal",  text: "You made ₦43,700 in sales — profit of ₦30,700. Great week! 🎉", delay: 0.8  },
    { role: "user",  text: "Where am I spending the most?",       delay: 1.5  },
    { role: "spal",  text: "Stock is your biggest cost at ₦8,000. Consider bulk buying to reduce it.", delay: 2.1 },
  ];

  return (
    <div className="flex flex-col justify-center flex-1 px-6 gap-5">
      <motion.div {...fadeUp} className="flex items-center gap-3">
        <Image src="/spal-ai.webp" alt="SPAL" width={40} height={40}
          style={{ objectFit: "contain",
                   filter: "drop-shadow(0 4px 12px rgba(34,197,94,0.45))" }} />
        <div>
          <h2 className="text-[22px] font-black text-white leading-tight"
            style={{ fontFamily: "var(--font-satoshi)" }}>
            Ask SPAL anything
          </h2>
          <p className="text-[12px] text-white/50 mt-0.5"
            style={{ fontFamily: "var(--font-satoshi)" }}>
            Your AI business companion
          </p>
        </div>
      </motion.div>

      <div className="space-y-2.5">
        {bubbles.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: b.role === "user" ? 20 : -20, scale: 0.95 }}
            animate={{ opacity: 1,  x: 0,                            scale: 1    }}
            transition={{ delay: b.delay, duration: 0.4, ease: EASE }}
            className={`flex ${b.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
              style={{
                fontFamily: "var(--font-satoshi)",
                background: b.role === "user"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(34,197,94,0.15)",
                color: "#fff",
                borderRadius: b.role === "user"
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
                border: b.role === "spal"
                  ? "1px solid rgba(34,197,94,0.25)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {b.text}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideLoop() {
  const steps = [
    { letter: "S", word: "Spending",  color: "#F97316", desc: "Track what goes out" },
    { letter: "P", word: "Profiting", color: "#22C55E", desc: "See what you keep"   },
    { letter: "A", word: "Analysing", color: "#2563EB", desc: "Understand patterns"  },
    { letter: "L", word: "Looping",   color: "#8B5CF6", desc: "Improve every cycle"  },
  ];

  return (
    <div className="flex flex-col justify-center flex-1 px-6 gap-6">
      <motion.div {...fadeUp} className="text-center">
        <h2 className="text-[26px] font-black text-spal-navy leading-tight"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          The SPAL loop
        </h2>
        <p className="text-[13.5px] text-neutral-500 mt-2 leading-relaxed"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Every record makes your business smarter.
        </p>
      </motion.div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.letter}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1,  x: 0   }}
            transition={{ delay: i * 0.12 + 0.2, duration: 0.45, ease: EASE }}
            className="flex items-center gap-4"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18` }}
            >
              <span className="text-[18px] font-black" style={{ color: s.color, fontFamily: "var(--font-satoshi)" }}>
                {s.letter}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                {s.word}
              </p>
              <p className="text-[12px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
                {s.desc}
              </p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight01Icon size={14} className="text-neutral-200 flex-shrink-0" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Loop arrow */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="flex justify-center"
      >
        <div className="h-px w-32 rounded-full" style={{ background: "linear-gradient(to right, #F97316, #22C55E, #2563EB, #8B5CF6)" }} />
      </motion.div>
    </div>
  );
}

function SlideReady({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 gap-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="w-20 h-20 rounded-full bg-spal-green flex items-center justify-center mx-auto">
          <ChatIcon size={34} color="#fff" />
        </div>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.2, ...fadeUp.transition }}>
        <h2 className="text-[28px] font-black text-spal-navy leading-tight"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          You&apos;re all set
        </h2>
        <p className="text-[14px] text-neutral-500 mt-2 leading-relaxed"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          Start recording and let SPAL help you understand your business better every day.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ delay: 0.35, duration: 0.45 }}
        onClick={onDone}
        className="w-full max-w-[280px] h-14 rounded-2xl font-bold text-[15px] text-white active:scale-[0.97] transition-transform"
        style={{
          fontFamily: "var(--font-satoshi)",
          background: "#22C55E",
          boxShadow: "0 6px 20px rgba(34,197,94,0.38)",
        }}
      >
        Get started
      </motion.button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WalkthroughPage() {
  const [idx,      setIdx]      = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef  = useRef<number | null>(null);
  const startTs = useRef<number>(0);

  const isLast = idx === SLIDES.length - 1;

  const goTo = useCallback((i: number) => {
    setIdx(i);
    setProgress(0);
    startTs.current = 0;
  }, []);

  const advance = useCallback(() => {
    setIdx(prev => {
      if (prev >= SLIDES.length - 1) return prev;
      return prev + 1;
    });
    setProgress(0);
    startTs.current = 0;
  }, []);

  const dismiss = useCallback(() => {
    window.location.href = "/home";
  }, []);

  // Auto-advance timer with progress bar
  useEffect(() => {
    if (isLast) return; // last slide: user must tap CTA

    const tick = (ts: number) => {
      if (!startTs.current) startTs.current = ts;
      const elapsed = ts - startTs.current;
      const p = Math.min(elapsed / SLIDE_DURATION, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        advance();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [idx, isLast, advance]);

  const slide = SLIDES[idx];

  const slideContent = {
    intro:   <SlideIntro />,
    record:  <SlideRecord />,
    numbers: <SlideNumbers />,
    ask:     <SlideAsk />,
    loop:    <SlideLoop />,
    ready:   <SlideReady onDone={dismiss} />,
  }[slide.id as SlideId];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: slide.bg, transition: "background 0.4s ease" }}
      onClick={() => { if (!isLast) advance(); }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0 pointer-events-none">
        {/* Progress bars */}
        <div className="flex gap-1.5 flex-1 mr-4">
          {SLIDES.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden"
              style={{ background: slide.dark ? "rgba(255,255,255,0.15)" : "#E5E7EB" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#22C55E" }}
                animate={{
                  width: i < idx ? "100%" : i === idx && !isLast ? `${progress * 100}%` : "0%",
                }}
                transition={{ duration: 0, ease: "linear" }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 pointer-events-auto active:scale-90 transition-transform"
          style={{ background: slide.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)" }}
          aria-label="Skip and close"
        >
          <Cancel01Icon size={16} color={slide.dark ? "#fff" : "#0F172A"} />
        </button>
      </div>

      {/* ── Slide content ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="flex flex-col flex-1"
            initial={{ opacity: 0, x: 40  }}
            animate={{ opacity: 1, x: 0   }}
            exit={{    opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: EASE_SLIDE }}
          >
            {slideContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Dot nav ── */}
      <div
        className="flex justify-center gap-2 pb-12 pt-4 flex-shrink-0 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); goTo(i); }}
            className="pointer-events-auto transition-all duration-300"
            style={{
              width:        i === idx ? 20 : 6,
              height:       6,
              borderRadius: 3,
              background:   i === idx
                ? "#22C55E"
                : slide.dark ? "rgba(255,255,255,0.25)" : "#D1D5DB",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
