"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  ChartIncreaseIcon, ArrowRight01Icon, PencilEdit01Icon, Cancel01Icon, Tick01Icon,
  Award01Icon, Alert01Icon, ChartDecreaseIcon, ShoppingBag01Icon, Tag01Icon,
  HeartCheckIcon, FireIcon, Notification03Icon, User02Icon, Home01Icon,
  Menu01Icon, BarChartIcon, ArrowDown01Icon, ArrowUp01Icon, ArrowLeft01Icon,
} from "hugeicons-react";
import { SALE_CATEGORIES } from "@/lib/utils/category";
import { getGreeting } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/currency";
import { useSPALStore } from "@/store";
import type { BusinessRecord } from "@/lib/types";

const BG = "#EEF3E9";

type Period      = "today" | "week" | "month" | "year";
type HealthState = "healthy" | "even" | "low" | "empty";

interface Bucket { label: string; profit: number; expenses: number; }

const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;
const MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayISODate(): string { return isoDate(new Date()); }
function offsetDate(daysBack: number): Date {
  const d = new Date(); d.setDate(d.getDate() - daysBack); return d;
}
function periodStart(period: Period): string {
  if (period === "today") return todayISODate();
  if (period === "week")  return isoDate(offsetDate(6));
  const now = new Date();
  if (period === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return `${now.getFullYear()}-01-01`;
}
// Start of the period immediately BEFORE the current one (for comparison).
function prevPeriodStart(period: Period): string {
  if (period === "today") return isoDate(offsetDate(1));   // yesterday
  if (period === "week")  return isoDate(offsetDate(13));  // 7 days before the last 7
  const now = new Date();
  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return isoDate(d);
  }
  return `${now.getFullYear() - 1}-01-01`;
}
// Split records into the current period and the previous one.
function splitByPeriod(records: BusinessRecord[], period: Period) {
  const currentStart = periodStart(period);
  const current: BusinessRecord[] = [];
  const previous: BusinessRecord[] = [];
  for (const r of records) {
    if (!r.record_date) continue;
    if (r.record_date >= currentStart) current.push(r);
    else previous.push(r);
  }
  return { current, previous };
}
// Percentage change vs previous period. null = nothing to compare against.
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}
function periodRange(period: Period): string {
  const fmt = (d: Date) => `${MON_SHORT[d.getMonth()]} ${d.getDate()}`;
  const today = new Date();
  if (period === "today") return fmt(today);
  if (period === "week")  return `${fmt(offsetDate(6))} – ${fmt(today)}`;
  if (period === "month") return `${fmt(new Date(today.getFullYear(), today.getMonth(), 1))} – ${fmt(today)}`;
  return `Jan 1 – ${fmt(today)}`;
}
function emptyBuckets(period: Period): Bucket[] {
  if (period === "today") return [{ label: "Today", profit: 0, expenses: 0 }];
  if (period === "week")  return Array.from({ length: 7 }, (_, i) => ({ label: DAY_SHORT[offsetDate(6 - i).getDay()], profit: 0, expenses: 0 }));
  if (period === "month") return [1,2,3,4].map(n => ({ label: `W${n}`, profit: 0, expenses: 0 }));
  return MON_SHORT.map(label => ({ label, profit: 0, expenses: 0 }));
}
function aggregate(records: BusinessRecord[], period: Period): Bucket[] {
  const buckets = emptyBuckets(period);
  if (period === "today") {
    const today = todayISODate();
    for (const r of records) {
      if (!r.record_date || r.record_date !== today) continue;
      if (r.type === "sale") buckets[0].profit += r.amount; else buckets[0].expenses += r.amount;
    }
    buckets[0].profit -= buckets[0].expenses; return buckets;
  }
  if (period === "week") {
    const startMs = offsetDate(6).setHours(0, 0, 0, 0);
    for (const r of records) {
      if (!r.record_date) continue;
      const [ry,rm,rd] = r.record_date.split("-").map(Number);
      const diff = Math.floor((new Date(ry, rm - 1, rd).getTime() - startMs) / 86400000);
      if (diff < 0 || diff > 6) continue;
      if (r.type === "sale") buckets[diff].profit += r.amount; else buckets[diff].expenses += r.amount;
    }
    for (const b of buckets) b.profit -= b.expenses; return buckets;
  }
  if (period === "month") {
    const now = new Date(); const month = now.getMonth(); const year = now.getFullYear();
    for (const r of records) {
      if (!r.record_date) continue;
      const [ry,rm,rd] = r.record_date.split("-").map(Number);
      if (rm - 1 !== month || ry !== year) continue;
      const wi = Math.min(3, Math.floor((rd - 1) / 7));
      if (r.type === "sale") buckets[wi].profit += r.amount; else buckets[wi].expenses += r.amount;
    }
    for (const b of buckets) b.profit -= b.expenses; return buckets;
  }
  const year = new Date().getFullYear();
  for (const r of records) {
    if (!r.record_date) continue;
    const [ry,rm] = r.record_date.split("-").map(Number);
    if (ry !== year) continue;
    if (r.type === "sale") buckets[rm - 1].profit += r.amount; else buckets[rm - 1].expenses += r.amount;
  }
  for (const b of buckets) b.profit -= b.expenses; return buckets;
}
function totals(records: BusinessRecord[]) {
  const sales    = records.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
  const expenses = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { sales, expenses, profit: sales - expenses };
}
function healthFromTotals(sales: number, expenses: number): { fill: number; state: HealthState } {
  const profit = sales - expenses;
  if (sales === 0) return { fill: 0, state: "empty" };
  const margin = profit / sales;
  const fill   = Math.min(100, Math.max(0, ((margin + 0.5) / 0.8) * 100));
  const state: HealthState = fill >= 62 ? "healthy" : fill >= 38 ? "even" : "low";
  return { fill, state };
}

const HEALTH_COLOR = { healthy: "#2D7A3A", even: "#FF7A00", low: "#DF191C", empty: "#CBD5E1" } as const;
const HEALTH_LABEL = { healthy: "Healthy", even: "Breaking even", low: "Needs attention", empty: "No data yet" } as const;
const HEALTH_DESC  = {
  healthy: "Your business is profitable. Keep it going.",
  even:    "You're covering costs but profit is thin.",
  low:     "You spent more than you made. Let's fix that.",
  empty:   "Add some sales and expenses to see your health.",
} as const;

// ── Period selector dropdown ──────────────────────────────────────────────────
function PeriodDropdown({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const OPTS: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week",  label: "Last 7 days" },
    { key: "month", label: "This month" },
    { key: "year",  label: "This year" },
  ];
  const activeLabel = OPTS.find(o => o.key === period)?.label ?? "Today";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white text-[13px] font-semibold text-spal-navy active:scale-95 transition-transform"
        style={{ fontFamily: "var(--font-satoshi)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {activeLabel}
        <ArrowDown01Icon size={13} color="#6B7280" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-[44px] left-0 bg-white rounded-2xl overflow-hidden z-30"
            style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)", minWidth: "160px", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            {OPTS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-neutral-50 transition-colors"
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ fontFamily: "var(--font-satoshi)", color: period === opt.key ? "#22C55E" : "#0F172A" }}
                >
                  {opt.label}
                </span>
                {period === opt.key && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 ml-auto flex-shrink-0">
                    <path d="M3 8l4 4 6-7" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pct badge (matching home page) ───────────────────────────────────────────
function PctBadge({ pct, small, dark, light }: { pct: number | null; small?: boolean; dark?: boolean; light?: boolean }) {
  const noData = pct === null;
  const isUp   = !noData && pct >= 0;
  const bg = light
    ? (noData ? "#F1F3EF" : isUp ? "#E7F6EC" : "#FEE0E1")
    : noData
      ? "rgba(255,255,255,0.16)"
      : dark
        ? (isUp ? "rgba(255,255,255,0.15)" : "rgba(255,80,80,0.22)")
        : (isUp ? "rgba(255,255,255,0.22)" : "rgba(255,80,80,0.28)");
  const color = light
    ? (noData ? "#9CA3AF" : isUp ? "#16A34A" : "#DC2626")
    : noData ? "rgba(255,255,255,0.75)" : isUp ? "#fff" : "#FFBBBB";
  return (
    <div
      className="flex items-center gap-0.5 rounded-full font-bold"
      style={{
        padding:    small ? "3px 7px" : "4px 9px",
        fontSize:   small ? "10px" : "11px",
        background: bg,
        color,
      }}
    >
      {!noData && (isUp
        ? <ArrowUp01Icon size={small ? 10 : 11} />
        : <ArrowDown01Icon size={small ? 10 : 11} />)}
      {noData ? 0 : Math.max(-100, Math.min(100, pct))}%
    </div>
  );
}

// ── Liquid gauge (health) ─────────────────────────────────────────────────────
function LiquidGauge({ fill, state }: { fill: number; state: HealthState }) {
  const color = HEALTH_COLOR[state];
  return (
    <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
      <div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${color}`, background: BG, overflow: "hidden" }}>
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: "0%" }}
          animate={{ height: `${fill}%` }}
          transition={{ duration: 1.4, ease: [0.34, 1.0, 0.64, 1] }}
          style={{ background: color, opacity: 0.18 }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <HeartCheckIcon size={26} color={state === "empty" ? "#CBD5E1" : color} />
      </div>
      {state === "healthy" && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ border: `2px solid ${color}` }}
        />
      )}
    </div>
  );
}

// ── Diagnosis card ────────────────────────────────────────────────────────────
type DiagnosisVariant = "positive" | "warning" | "neutral" | "alert";
interface DiagnosisCardProps {
  icon: React.ReactNode; tag: string; title: string; body: string;
  variant: DiagnosisVariant; askPrompt?: string;
}
const VARIANT_STYLE: Record<DiagnosisVariant, { bg: string; iconBg: string; tagBg: string; tagText: string }> = {
  positive: { bg: "#E7F6EC", iconBg: "#CDEDD8", tagBg: "#CDEDD8", tagText: "#16A34A" },
  warning:  { bg: "#FFF4EF", iconBg: "#FCE0D0", tagBg: "#FCE0D0", tagText: "#F97316" },
  alert:    { bg: "#FEE0E1", iconBg: "#FDCED0", tagBg: "#FDCED0", tagText: "#DC2626" },
  neutral:  { bg: "#EAF0FC", iconBg: "#D7E4FA", tagBg: "#D7E4FA", tagText: "#2563EB" },
};
function DiagnosisCard({ icon, tag, title, body, variant, askPrompt }: DiagnosisCardProps) {
  const router = useRouter();
  const s = VARIANT_STYLE[variant];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4" style={{ background: s.bg }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-spal-navy leading-tight mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>{title}</p>
          <p className="text-[12.5px] text-neutral-600 leading-relaxed">{body}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.tagBg, color: s.tagText }}>{tag}</span>
            {askPrompt && (
              <button onClick={() => { sessionStorage.setItem("spal_ask_prefill", askPrompt); router.push("/ask"); }}
                className="flex items-center gap-1.5 bg-white rounded-full px-3 h-8 text-[12px] font-bold" style={{ color: "#16A34A" }}>
                Ask SPAL <ArrowRight01Icon size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Top sellers ───────────────────────────────────────────────────────────────
function TopSellersCard({ records, periodLabel, onCategoryRenamed }: { records: BusinessRecord[]; periodLabel: string; onCategoryRenamed: () => void }) {
  const router = useRouter();
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [newName,     setNewName]     = useState("");
  const [saving,      setSaving]      = useState(false);

  async function handleRename() {
    if (!renamingCat || !newName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/records/category", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: renamingCat, to: newName.trim() }) });
      setRenamingCat(null); setNewName(""); onCategoryRenamed();
    } finally { setSaving(false); }
  }

  const byItem = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of records) { if (r.type !== "sale" || !r.description) continue; acc[r.description.trim().toLowerCase()] = (acc[r.description.trim().toLowerCase()] ?? 0) + r.amount; }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, amount]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), amount }));
  }, [records]);

  const byCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of records) { if (r.type !== "sale") continue; const key = r.category ?? "Uncategorised"; acc[key] = (acc[key] ?? 0) + r.amount; }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, amount]) => ({ name, amount }));
  }, [records]);

  const totalSales = records.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
  if (byItem.length === 0 && byCategory.length === 0) return null;
  const maxItem = byItem[0]?.amount ?? 1;
  const maxCat  = byCategory[0]?.amount ?? 1;

  return (
    <div className="bg-white rounded-2xl p-4 space-y-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#DCFCE7" }}>
          <FireIcon size={14} color="#2D7A3A" />
        </div>
        <p className="text-[13.5px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          What sold {periodLabel.toLowerCase()}
        </p>
      </div>
      {byItem.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-3">By item</p>
          <div className="space-y-2.5">
            {byItem.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-spal-navy truncate">{item.name}</span>
                    {i === 0 && <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#2563EB" }}>Best</span>}
                  </span>
                  <span className="text-[12px] font-semibold text-spal-navy flex-shrink-0 ml-2">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <motion.div className="h-full rounded-full" initial={{ width: "0%" }}
                    animate={{ width: `${(item.amount / maxItem) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                    style={{ background: "#2563EB" }} />
                </div>
              </div>
            ))}
          </div>
          {byItem.length > 0 && (
            <button onClick={() => { sessionStorage.setItem("spal_ask_prefill", `My best-selling item is ${byItem[0].name}. How can I sell more?`); router.push("/ask"); }}
              className="flex items-center gap-1 text-[12px] font-semibold mt-3" style={{ color: "#2563EB" }}>
              Ask SPAL how to grow this <ArrowRight01Icon size={12} />
            </button>
          )}
        </div>
      )}
      {byItem.length > 0 && byCategory.length > 0 && <div className="h-px bg-neutral-100" />}
      {byCategory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">By category</p>
            <p className="text-[10px] text-neutral-400">Tap name to rename</p>
          </div>
          <div className="space-y-2.5">
            {byCategory.map((cat, i) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <button onClick={() => { setRenamingCat(cat.name); setNewName(cat.name); }}
                    className="flex items-center gap-1.5 active:opacity-70 transition-opacity">
                    <Tag01Icon size={11} color="#8B5CF6" className="flex-shrink-0" />
                    <span className="text-[12.5px] font-medium text-spal-navy underline decoration-dotted underline-offset-2 decoration-neutral-300">{cat.name}</span>
                    <PencilEdit01Icon size={10} className="text-neutral-300" />
                  </button>
                  <span className="text-[12px] font-medium text-neutral-500">
                    {totalSales > 0 ? `${Math.round((cat.amount / totalSales) * 100)}%` : "—"}
                    <span className="ml-1.5 text-spal-navy font-semibold">{formatCurrency(cat.amount)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <motion.div className="h-full rounded-full" initial={{ width: "0%" }}
                    animate={{ width: `${(cat.amount / maxCat) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                    style={{ background: "#8B5CF6" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence>
        {renamingCat && (
          <>
            <motion.div className="fixed inset-0 z-30 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setRenamingCat(null); setNewName(""); }} />
            <motion.div className="fixed left-0 right-0 z-40 bg-white rounded-t-3xl p-5"
              style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Rename category</p>
                <button onClick={() => { setRenamingCat(null); setNewName(""); }} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Cancel01Icon size={14} className="text-neutral-500" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {SALE_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setNewName(c)} className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors"
                    style={{ background: newName === c ? "#22C55E" : "#F8FAFC", color: newName === c ? "#fff" : "#374151", borderColor: newName === c ? "#22C55E" : "#E5E7EB" }}>
                    {c}
                  </button>
                ))}
              </div>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Or type a custom name…"
                className="w-full h-11 rounded-xl border border-neutral-200 px-4 text-[14px] text-spal-navy outline-none focus:border-spal-green mb-4"
                style={{ fontFamily: "var(--font-satoshi)" }} />
              <button onClick={handleRename} disabled={saving || !newName.trim() || newName.trim() === renamingCat}
                className="w-full h-12 rounded-2xl font-bold text-[14px] text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}>
                {saving ? "Saving…" : <><Tick01Icon size={16} /> Save</>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const router    = useRouter();
  const { user }  = useSPALStore();
  const greeting  = getGreeting();
  const displayName = user?.full_name ?? user?.business_name ?? "there";

  const [unreadCount, setUnreadCount] = useState(0);
  const [period,  setPeriod]  = useState<Period>("week");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { if (d.success) setUnreadCount((d.data as Array<{ read_at: string | null }>).filter(n => !n.read_at).length); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from the previous period start so we can compare current vs previous
      const res  = await fetch(`/api/records?start_date=${prevPeriodStart(period)}&limit=4000`);
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { current: curRecords, previous: prevRecords } = useMemo(() => splitByPeriod(records, period), [records, period]);
  const chartData     = useMemo(() => aggregate(curRecords, period), [curRecords, period]);
  const t             = useMemo(() => totals(curRecords), [curRecords]);
  const prevT         = useMemo(() => totals(prevRecords), [prevRecords]);
  const owed          = useMemo(() => curRecords.filter(r => r.type === "sale" && r.payment_status === "owing").reduce((s, r) => s + r.amount, 0), [curRecords]);
  const prevOwed      = useMemo(() => prevRecords.filter(r => r.type === "sale" && r.payment_status === "owing").reduce((s, r) => s + r.amount, 0), [prevRecords]);
  // Cash-basis profit: exclude money still owed (not yet received)
  const cashProfit    = t.profit - owed;
  const prevCashProfit = prevT.profit - prevOwed;
  const salesPct      = useMemo(() => pctChange(t.sales, prevT.sales), [t.sales, prevT.sales]);
  const expensePct    = useMemo(() => pctChange(t.expenses, prevT.expenses), [t.expenses, prevT.expenses]);
  const profitPct     = useMemo(() => pctChange(cashProfit, prevCashProfit), [cashProfit, prevCashProfit]);
  const health        = useMemo(() => healthFromTotals(t.sales, t.expenses), [t.sales, t.expenses]);
  const dateRange     = useMemo(() => periodRange(period), [period]);

  const bestBucket = useMemo(() =>
    chartData.reduce((best, b) => (b.profit + b.expenses) > (best.profit + best.expenses) ? b : best, chartData[0] ?? { label: "", profit: 0, expenses: 0 }),
  [chartData]);

  const topExpenseCat = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of curRecords) { if (r.type !== "expense" || !r.category) continue; acc[r.category] = (acc[r.category] ?? 0) + r.amount; }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])[0];
  }, [curRecords]);

  const expenseRatio = t.sales > 0 ? Math.round((t.expenses / t.sales) * 100) : null;
  const periodLabel  = period === "today" ? "Today" : period === "week" ? "Last 7 days" : period === "month" ? "This month" : "This year";
  const bucketWord   = period === "year" ? "month" : period === "month" ? "week" : "day";

  const diagnosisCards: DiagnosisCardProps[] = useMemo(() => {
    const cards: DiagnosisCardProps[] = [];
    if (curRecords.length === 0) return cards;
    if (cashProfit > 0) cards.push({ icon: <ChartIncreaseIcon size={16} color="#2D7A3A" />, tag: "Profit", title: `You made ${formatCurrency(cashProfit)} profit`, body: `${periodLabel}, your sales covered your costs and left you with ${formatCurrency(cashProfit)}${owed > 0 ? ` (${formatCurrency(owed)} still owed isn't counted yet)` : ""}.`, variant: "positive", askPrompt: `I made ${formatCurrency(cashProfit)} profit ${periodLabel.toLowerCase()}. How can I increase this?` });
    else if (cashProfit < 0) cards.push({ icon: <ChartDecreaseIcon size={16} color="#DF191C" />, tag: "Profit", title: `You spent ${formatCurrency(Math.abs(cashProfit))} more than you made`, body: `${periodLabel} expenses were higher than the money you actually received.`, variant: "alert", askPrompt: `I spent more than I made. Sales ${formatCurrency(t.sales)}, expenses ${formatCurrency(t.expenses)}. What should I do?` });
    if (bestBucket && (bestBucket.profit + bestBucket.expenses) > 0) cards.push({ icon: <Award01Icon size={16} color="#2D7A3A" />, tag: "Sales", title: `${bestBucket.label} was your best ${bucketWord}`, body: `You made the most on ${bestBucket.label}${bestBucket.profit > 0 ? ` with ${formatCurrency(bestBucket.profit)} in profit` : ""}.`, variant: "positive", askPrompt: `${bestBucket.label} was my best ${bucketWord}. Why might that be?` });
    if (expenseRatio !== null && t.expenses > 0) { const isHigh = expenseRatio > 70; cards.push({ icon: <Alert01Icon size={16} color={isHigh ? "#DF191C" : "#FF7A00"} />, tag: "Spending", title: `${expenseRatio}% of sales went to expenses`, body: isHigh ? `For every ₦100 you made, ₦${expenseRatio} went to costs. Worth reviewing.` : `Your expenses are ${expenseRatio}% of sales. ${expenseRatio < 50 ? "You're managing costs well." : "There's room to tighten."}`, variant: isHigh ? "alert" : "warning", askPrompt: `${expenseRatio}% of my sales went to expenses. Is this normal?` }); }
    if (topExpenseCat) cards.push({ icon: <ShoppingBag01Icon size={16} color="#FF7A00" />, tag: "Spending", title: `${topExpenseCat[0]} is your biggest cost`, body: `You spent ${formatCurrency(topExpenseCat[1])} on ${topExpenseCat[0]} ${periodLabel.toLowerCase()}.`, variant: "warning", askPrompt: `I spent ${formatCurrency(topExpenseCat[1])} on ${topExpenseCat[0]}. How can I reduce this?` });
    return cards;
  }, [curRecords, t, cashProfit, owed, bestBucket, expenseRatio, topExpenseCat, periodLabel, bucketWord]);

  return (
    <div className="min-h-full" style={{ background: BG }}>

      {/* ── Header ── */}
      <div className="px-5 pt-12 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>Insights</h1>
      </div>

      {/* ── Period selector ── */}
      <div className="px-5 mt-5">
        <PeriodDropdown period={period} onChange={setPeriod} />
      </div>

      {/* ── Stat cards ── */}
      <div className="px-5 mt-5 space-y-2.5">
        {/* Profit card (purple) */}
        <AnimatePresence mode="wait">
          <motion.div key={`profit-${period}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-5 py-5 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-3 w-20 rounded-full bg-neutral-200/60" />
                <div className="h-10 w-36 rounded-xl bg-neutral-200/60" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold" style={{ fontFamily: "var(--font-satoshi)", color: "#8B5CF6" }}>
                    {periodLabel} · Profit
                  </p>
                  <PctBadge pct={profitPct} light />
                </div>
                <p className="text-spal-navy font-black" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(28px, 8vw, 38px)", letterSpacing: "-0.02em" }}>
                  {cashProfit < 0 ? "–" : ""}{formatCurrency(Math.abs(cashProfit))}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Sale + Expense row (blue + orange) */}
        <div className="grid grid-cols-2 gap-2.5 min-w-0">
          <motion.div
            key={`sales-${period}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl px-4 py-4 min-w-0 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            {loading ? (
              <div className="space-y-3 animate-pulse"><div className="h-2.5 w-10 rounded-full bg-neutral-200/60" /><div className="h-7 w-24 rounded-xl bg-neutral-200/60" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-satoshi)", color: "#2563EB" }}>Sale</p>
                  <PctBadge pct={salesPct} small light />
                </div>
                <p className="text-spal-navy font-black truncate" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(16px, 5.5vw, 22px)", letterSpacing: "-0.01em" }}>{formatCurrency(t.sales)}</p>
              </>
            )}
          </motion.div>
          <motion.div
            key={`expense-${period}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
            className="rounded-2xl px-4 py-4 min-w-0 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            {loading ? (
              <div className="space-y-3 animate-pulse"><div className="h-2.5 w-16 rounded-full bg-neutral-200/60" /><div className="h-7 w-24 rounded-xl bg-neutral-200/60" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-satoshi)", color: "#F97316" }}>Expense</p>
                  <PctBadge pct={expensePct} small light />
                </div>
                <p className="text-spal-navy font-black truncate" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(16px, 5.5vw, 22px)", letterSpacing: "-0.01em" }}>{formatCurrency(t.expenses)}</p>
              </>
            )}
          </motion.div>
        </div>

        {/* Owed card — money still owed to you this period */}
        {!loading && owed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="rounded-2xl px-4 py-4 mt-2.5 flex items-center justify-between gap-3"
            style={{ background: "#D3E0C7" }}
          >
            <div className="min-w-0">
              <p className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-satoshi)", color: "#4A5D38" }}>Owed to you</p>
              <p className="font-bold truncate mt-0.5" style={{ fontFamily: "var(--font-satoshi)", color: "#2E3D22", fontSize: "clamp(18px, 5.5vw, 22px)", letterSpacing: "-0.01em" }}>
                {formatCurrency(owed)}
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontFamily: "var(--font-satoshi)", background: "rgba(46,61,34,0.12)", color: "#2E3D22" }}>
              Not yet paid
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Daily breakdown chart ── */}
      <div className="px-5 mt-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-black text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                Daily Breakdown
              </p>
              <div className="flex items-center gap-3">
                <Legend color="#2563EB" label="sale" />
                <Legend color="#F97316" label="Expense" />
              </div>
            </div>
            {loading ? (
              <div className="h-[200px] bg-neutral-50 rounded-xl animate-pulse" />
            ) : chartData.every(b => b.profit === 0 && b.expenses === 0) ? (
              <EmptyChart period={period} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barGap={4} barCategoryGap="22%">
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A3AE", fontFamily: "var(--font-satoshi)" }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#A1A3AE", fontFamily: "var(--font-satoshi)" }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? "0K" : `${Math.round(v / 1000)}K`} width={48} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.04)" }}
                    formatter={(v, name) => [formatCurrency(Math.abs(Number(v ?? 0))), name === "profit" ? "Sale" : "Expense"]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12, fontFamily: "var(--font-satoshi)" }}
                    labelStyle={{ fontWeight: 700, color: "#0F172A" }}
                  />
                  <Bar dataKey="profit"   fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Business health ── */}
      {!loading && curRecords.length > 0 && (
        <div className="px-5 mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#A1A1AA", fontFamily: "var(--font-satoshi)" }}>
                Business Health
              </p>
              <div className="flex items-center gap-4">
                <LiquidGauge fill={health.fill} state={health.state} />
                <div className="flex-1">
                  <p className="text-[20px] font-bold leading-tight" style={{ fontFamily: "var(--font-satoshi)", color: HEALTH_COLOR[health.state] }}>
                    {HEALTH_LABEL[health.state]}
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-1 leading-relaxed">{HEALTH_DESC[health.state]}</p>
                </div>
              </div>
              {health.state !== "empty" && (
                <button
                  onClick={() => { sessionStorage.setItem("spal_ask_prefill", `How is my business health? Sales: ${formatCurrency(t.sales)}, Expenses: ${formatCurrency(t.expenses)}`); router.push("/ask"); }}
                  className="mt-4 w-full h-12 rounded-full flex items-center justify-center gap-2 text-[13.5px] font-bold transition-opacity active:opacity-70"
                  style={{ background: health.state === "healthy" ? "#DCFCE7" : health.state === "even" ? "#FFF3E0" : "#FEE2E2", color: HEALTH_COLOR[health.state] }}>
                  <HeartCheckIcon size={15} />
                  Get a deeper diagnosis from SPAL
                  <ArrowRight01Icon size={13} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Top sellers ── */}
      {!loading && curRecords.length > 0 && (
        <div className="px-5 mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <TopSellersCard records={curRecords} periodLabel={periodLabel} onCategoryRenamed={fetchData} />
          </motion.div>
        </div>
      )}

      {/* ── Diagnosis cards ── */}
      {!loading && diagnosisCards.length > 0 && (
        <div className="px-5 mt-4 space-y-3">
          {diagnosisCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + i * 0.06 }}>
              <DiagnosisCard {...card} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && curRecords.length === 0 && (
        <div className="px-5 mt-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <ChartIncreaseIcon size={26} className="text-neutral-300" />
          </div>
          <p className="text-spal-navy font-semibold mt-3" style={{ fontFamily: "var(--font-satoshi)" }}>No records for {dateRange}</p>
          <p className="text-neutral-400 text-[13px] mt-1 leading-relaxed px-6">
            Add some sales and expenses to see your insights.
          </p>
          {period === "week" && (
            <button onClick={() => setPeriod("month")}
              className="mt-4 h-9 px-5 rounded-full text-[12.5px] font-semibold"
              style={{ fontFamily: "var(--font-satoshi)", background: "#EFF6FF", color: "#2563EB" }}>
              View this month instead
            </button>
          )}
        </div>
      )}

      <div className="h-32" />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-satoshi)", color: "#67738F" }}>{label}</span>
    </div>
  );
}

function EmptyChart({ period }: { period: Period }) {
  const label = period === "today" ? "today" : period === "week" ? "in the last 7 days" : period === "month" ? "this month" : "this year";
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-center">
      <ChartIncreaseIcon size={32} className="text-neutral-300 mb-2" />
      <p className="text-[13px] text-neutral-500" style={{ fontFamily: "var(--font-satoshi)" }}>No activity {label} yet.</p>
      <p className="text-[11.5px] text-neutral-400 mt-1">Add a sale or expense to see your chart.</p>
    </div>
  );
}
