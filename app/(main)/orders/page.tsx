"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dish01Icon, Hamburger01Icon, Alert02Icon,
  Restaurant01Icon, Restaurant02Icon, Restaurant03Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { AppHeader } from "@/components/home/AppHeader";
import { TargetPulse } from "@/components/shared/TargetPulse";
import { formatCurrency } from "@/lib/utils/currency";
import { payInfo, iconTint } from "@/lib/sales";
import { orderMeta, STATUS_STYLE } from "@/lib/orders";
import type { BusinessRecord } from "@/lib/types";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";
const SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

type Period = "today" | "week" | "month" | "year";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
];

function periodStart(p: Period): string {
  const d = new Date();
  if (p === "today") return d.toISOString().slice(0, 10);
  if (p === "week")  { d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }
  if (p === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return `${d.getFullYear()}-01-01`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

const DISH_ICONS = [Restaurant01Icon, Restaurant02Icon, Restaurant03Icon];
function dishIcon(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DISH_ICONS[h % DISH_ICONS.length];
}

// Orders tab for restaurants and bars: every order in the period, newest first,
// with a New Order button that starts the order flow.
export default function OrdersPage() {
  const router = useRouter();
  const { recordSavedAt } = useSPALStore();

  const [period, setPeriod]   = useState<Period>("today");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);
    try {
      const [recRes, menuRes] = await Promise.all([
        fetch(`/api/records?type=sale&start_date=${periodStart(p)}&limit=500`).then((r) => r.json()),
        fetch("/api/menu").then((r) => r.json()),
      ]);
      if (recRes.success) setRecords(recRes.data ?? []); else setError(true);
      if (menuRes.success) setMenuCount(menuRes.data?.items?.length ?? 0);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(period); }, [period, load]);
  useEffect(() => { if (recordSavedAt) load(period); }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const orders = useMemo(
    () => [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [records]
  );
  const noMenu = !loading && !error && menuCount === 0;

  return (
    <div className="min-h-full pb-nav-fab" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <AppHeader />

      {/* Period tabs */}
      <div className="px-5 mt-5">
        <div className="flex items-center bg-white rounded-full p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button key={p.key} onClick={() => setPeriod(p.key)} aria-label={p.label}
                className="flex-1 min-w-0 h-12 px-1 rounded-full font-bold transition-all whitespace-nowrap"
                style={{ fontSize: "clamp(11px, 3.3vw, 13px)", background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="px-5 mt-5 space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[76px] bg-white rounded-2xl animate-pulse" />)}</div>
      ) : error ? (
        <div className="px-5 mt-5">
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your orders. Check your connection.</p>
            <button onClick={() => load(period)} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        </div>
      ) : noMenu ? (
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "24vh" }}>
          <Dish01Icon size={56} color="#6B7280" strokeWidth={1.4} />
          <p className="text-[24px] font-black text-spal-navy mt-4">No food to sell</p>
          <p className="text-[15px] text-neutral-500 mt-1">Add your first item to the menu</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "24vh" }}>
          <Dish01Icon size={56} color="#6B7280" strokeWidth={1.4} />
          <p className="text-[24px] font-black text-spal-navy mt-4">No order available</p>
          <p className="text-[15px] text-neutral-500 mt-1">Add and process your first order</p>
        </div>
      ) : (
        <div className="px-5 mt-5 space-y-2.5">
          {orders.map((r) => {
            const label = r.description ?? "Order";
            const tint = iconTint(label);
            const Icon = dishIcon(label);
            const pay = payInfo(r);
            const meta = orderMeta(r);
            const st = STATUS_STYLE[meta.status];
            return (
              <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} aria-label={`Order ${label}`}
                className="w-full text-left bg-white rounded-2xl px-4 py-3.5 min-h-[76px] flex items-center gap-3 active:scale-[0.99] transition-transform" style={{ boxShadow: SHADOW }}>
                <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                  <Icon size={20} color={tint.color} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-spal-navy truncate">{label}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: pay.bg, color: pay.color }}>{pay.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {meta.table != null && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">Table {meta.table}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[15px] font-black text-spal-navy">{formatCurrency(r.amount)}</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">{dayLabel(r.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New Order (or a nudge to the Menu tab when there is nothing to sell yet) */}
      {!loading && !error && !noMenu && (
        <div className="cta-bottom fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 min-[360px]:px-5 z-30 flex justify-end pointer-events-none">
          <button
            onClick={() => router.push("/orders/new")}
            aria-label="Start a new order"
            className="pointer-events-auto h-14 px-6 rounded-2xl flex items-center gap-2.5 text-white font-black text-[17px] active:scale-95 transition-transform"
            style={{ background: "#22C55E", fontFamily: FF, boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
          >
            <Hamburger01Icon size={21} color="#fff" /> New Order
          </button>
        </div>
      )}
      {noMenu && <TargetPulse targetAttr="tab-menu" />}
    </div>
  );
}
