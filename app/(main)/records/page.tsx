"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon, Search01Icon, ShoppingBag01Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";
import { payInfo, iconTint } from "@/lib/sales";
import type { BusinessRecord } from "@/lib/types";

const BG = "#EEF3E9";
const FF = "var(--font-satoshi)";

type Period = "today" | "week" | "month" | "year";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function periodStart(p: Period): string {
  const now = new Date();
  if (p === "today") return isoDate(now);
  if (p === "week") { const d = new Date(now); d.setDate(d.getDate() - 6); return isoDate(d); }
  if (p === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return `${now.getFullYear()}-01-01`;
}
function dayLabel(date: string): string {
  const today = isoDate(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (date === today) return "Today";
  if (date === isoDate(y)) return "Yesterday";
  const [yy, mm, dd] = date.split("-").map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(" ", "");
}

export default function AllSalesPage() {
  const router = useRouter();
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("today");
  const [query, setQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/records?limit=500");
      const d = await res.json();
      if (d.success) setRecords((d.data as BusinessRecord[]).filter((r) => r.type === "sale"));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const grouped = useMemo(() => {
    const start = periodStart(period);
    const q = query.trim().toLowerCase();
    const filtered = records
      .filter((r) => r.record_date >= start)
      .filter((r) => !q || (r.description ?? r.category ?? "").toLowerCase().includes(q));
    const map = new Map<string, BusinessRecord[]>();
    for (const r of filtered) {
      const key = r.record_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [records, period, query]);

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[24px] font-black text-spal-navy" style={{ fontFamily: FF }}>All Sales</h1>
      </div>

      {/* Period tabs */}
      <div className="px-5 mt-3">
        <div className="flex items-center bg-white rounded-full p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className="flex-1 h-10 rounded-full text-[14px] font-bold transition-all"
                style={{ background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mt-4">
        <div className="flex items-center gap-2.5 bg-white/70 rounded-2xl px-4" style={{ height: 52 }}>
          <Search01Icon size={18} color="#9CA3AF" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products by name or SKU..."
            className="flex-1 bg-transparent outline-none text-[14px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
        </div>
      </div>

      {/* List */}
      <div className="px-5 mt-5">
        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[76px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center" style={{ paddingTop: "22vh" }}>
            <ShoppingBag01Icon size={48} color="#9AA3AF" strokeWidth={1.4} />
            <p className="text-[18px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>No sales yet</p>
            <p className="text-[14px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Your sales for this period will show here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, rows]) => (
              <div key={date}>
                <p className="text-[15px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>{dayLabel(date)}</p>
                <div className="space-y-2.5">
                  {rows.map((r, i) => {
                    const pay = payInfo(r);
                    const tint = iconTint(r.description ?? r.category ?? "sale");
                    const name = r.description ?? r.category ?? "Sale";
                    return (
                      <motion.button
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => router.push(`/records/${r.id}`)}
                        className="w-full text-left bg-white rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
                        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                        <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                          <ShoppingBag01Icon size={20} color={tint.color} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{name}</p>
                          <span className="inline-block text-[11.5px] font-bold px-2.5 py-0.5 rounded-full mt-1" style={{ background: pay.bg, color: pay.color, fontFamily: FF }}>
                            {pay.label}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[15px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(r.amount)}</p>
                          <p className="text-[12px] text-neutral-400 mt-1" style={{ fontFamily: FF }}>{formatTime(r.created_at)}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
