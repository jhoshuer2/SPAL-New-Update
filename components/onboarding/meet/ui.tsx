"use client";
// Small UI pieces for the Meet Spal flow (B01-B10). Flow, never bounce: easeOut entrances, tactile press.
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export const FF = "var(--font-satoshi)";
const EASE = [0.22, 1, 0.36, 1] as const;

export function Rise({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 style={{ fontFamily: FF }} className="text-[28px] leading-[1.1] font-bold text-spal-navy tracking-tight">{children}</h1>
      {sub ? <p className="mt-2 text-[15px] text-neutral-600 leading-snug">{sub}</p> : null}
    </div>
  );
}

export function Choice({ label, hint, selected, onClick }: { label: string; hint?: string; selected?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={!!selected}
      className={`w-full min-h-14 text-left rounded-2xl px-4 py-3 border transition-colors duration-200 ${
        selected ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200/80 shadow-[var(--shadow-card)]"
      }`}
    >
      <span style={{ fontFamily: FF }} className="block text-[16px] font-bold leading-tight">{label}</span>
      {hint ? <span className={`block mt-0.5 text-[13px] leading-snug ${selected ? "text-white/70" : "text-neutral-500"}`}>{hint}</span> : null}
    </motion.button>
  );
}

export function Chip({ label, selected, onClick }: { label: string; selected?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={!!selected}
      className={`min-h-11 px-4 rounded-full text-[14px] font-medium border transition-colors duration-200 ${
        selected ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"
      }`}
    >
      {label}
    </motion.button>
  );
}

export function Field({ label, value, onChange, placeholder, autoComplete }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-medium text-neutral-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full h-13 min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy transition-colors"
      />
    </label>
  );
}

export function PrimaryButton({ children, onClick, disabled, loading }: { children: ReactNode; onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ fontFamily: FF }}
      className="w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none transition-colors"
    >
      {loading ? "One moment…" : children}
    </motion.button>
  );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full h-12 text-[15px] font-medium text-neutral-600 active:opacity-60">
      {children}
    </button>
  );
}
