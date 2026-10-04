"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBasket03Icon, ReceiptDollarIcon,
  PackageIcon, MoneyBag01Icon, ArrowRight01Icon, Invoice01Icon, CheckListIcon,
  Restaurant01Icon, Restaurant02Icon, Restaurant03Icon, Alert02Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { useBusinessMode } from "@/hooks/useBusinessMode";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import { payInfo, iconTint } from "@/lib/sales";
import type { BusinessRecord, InventoryItem } from "@/lib/types";
import { AppHeader } from "./AppHeader";
import { InsightsCarousel, type InsightItem } from "./InsightsCarousel";
import { SetupChecklist } from "./SetupChecklist";
import { TargetPulse } from "@/components/shared/TargetPulse";
import { markSetupSeen } from "@/lib/setup-progress";

const FF = "var(--font-satoshi)";
const BG = "#EDF3E8";
const CARD_SHADOW = "0 1px 6px rgba(0,0,0,0.05)";

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

function hourLabel(h: number) {
  return `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "pm" : "am"}`;
}

const DISH_ICONS = [Restaurant01Icon, Restaurant02Icon, Restaurant03Icon];
function dishIcon(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return DISH_ICONS[h % DISH_ICONS.length];
}

// Perishable / prepared-goods dashboard: restaurants (food_seller) and bars
// (bar_owner). Sells from the menu; ingredients/stock live under Inventory.
// The retail dashboard lives in RetailHome.tsx (see PERISHABLE_DASHBOARD.md).
export function PerishableHome() {
  const router = useRouter();
  const { user, activeBusiness, recordSavedAt } = useSPALStore();
  const name = activeBusiness?.business_name ?? user?.business_name ?? user?.full_name ?? "there";
  const isBar = useBusinessMode().type === "bar_owner";
  const greeting = getGreeting();

  const [period, setPeriod]   = useState<Period>("today");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [menuCount, setMenuCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);
    try {
      const [recRes, invRes] = await Promise.all([
        fetch(`/api/records?start_date=${periodStart(p)}&limit=2000`),
        fetch(`/api/inventory`),
      ]);
      const recData = await recRes.json();
      const invData = await invRes.json();
      if (recData.success) setRecords(recData.data ?? []); else setError(true);
      if (invData.success) setItems(invData.data?.items ?? []);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);
  useEffect(() => { if (recordSavedAt) fetchData(period); }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Menu item count — separate from `items` (ingredients, above), and not period-scoped.
  // Used by the setup checklist ("add your first menu item") and the pointer below.
  useEffect(() => {
    fetch("/api/menu").then((r) => r.json())
      .then((d) => { if (d.success) setMenuCount(d.data?.items?.length ?? 0); })
      .catch(() => {});
  }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const sales = useMemo(() => records.filter((r) => r.type === "sale"), [records]);
  const totalSales    = sales.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = records.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const owedSales     = sales.filter((r) => r.payment_status === "owing");
  const outstanding   = owedSales.reduce((s, r) => s + r.amount, 0);
  const soldOut       = items.filter((it) => it.quantity <= 0);
  const lowItems      = items.filter((it) => it.quantity > 0 && it.quantity <= it.low_stock_threshold);
  const recentOrders  = useMemo(
    () => [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4),
    [sales]
  );

  const busiest = useMemo(() => {
    if (sales.length < 3) return null;
    const byHour = new Array(24).fill(0) as number[];
    sales.forEach((r) => { byHour[new Date(r.created_at).getHours()] += 1; });
    const h = byHour.indexOf(Math.max(...byHour));
    return { hour: h, orders: byHour[h] };
  }, [sales]);

  const insights = useMemo<InsightItem[]>(() => {
    const out: InsightItem[] = [];
    if (soldOut.length > 0) {
      out.push({ id: "soldout", tone: "warning", title: `${soldOut.length} item${soldOut.length !== 1 ? "s are" : " is"} finished`, body: "You can't sell these until you restock. Top up so you don't lose orders.", ctaLabel: "Restock Now", ctaHref: "/inventory" });
    } else if (lowItems.length > 0) {
      out.push({ id: "low", tone: "warning", title: `${lowItems.length} item${lowItems.length !== 1 ? "s are" : " is"} almost finished`, body: "Restock soon so you never turn a customer away.", ctaLabel: "Restock Now", ctaHref: "/inventory" });
    }
    if (outstanding > 0) {
      out.push({ id: "debt", tone: "warning", title: `${formatCurrency(outstanding)} is owed to you`, body: `${owedSales.length} order${owedSales.length !== 1 ? "s" : ""} not yet paid. Follow up to get your money in.`, ctaLabel: "View Debts", ctaHref: "/records" });
    }
    if (busiest) {
      out.push({ id: "peak", tone: "info", title: `Your busiest time is around ${hourLabel(busiest.hour)}`, body: `${busiest.orders} orders came in around then. Have your best sellers ready before it starts.`, ctaLabel: "Ask SPAL", ctaHref: "/ask" });
    }
    if (period === "today" && totalSales === 0) {
      out.push({ id: "nosale", tone: "info", title: "No orders yet today", body: "Take your first order to start tracking your day.", ctaLabel: "Take an Order", ctaHref: "/orders/new" });
    } else if (totalSales > 0) {
      out.push({ id: "made", tone: "success", title: `You've made ${formatCurrency(totalSales)} in sales`, body: "Keep it up. Check your insights to see what's driving it.", ctaLabel: "See Insights", ctaHref: "/insights" });
    }
    out.push({
      id: "tip", tone: "info",
      title: isBar ? "Stock up on the drinks that sell fast" : "Cook more of what sells",
      body: isBar ? "Keep more of your top drinks and less of the slow ones so your money doesn't sit on the shelf." : "Prepare more of your best sellers and less of the slow ones. Less food thrown away means more profit.",
      ctaLabel: "Ask SPAL", ctaHref: "/ask",
    });
    return out;
  }, [soldOut.length, lowItems.length, outstanding, owedSales.length, busiest, period, totalSales, isBar]);

  const STATS = [
    { label: "Total Sales",      value: formatCurrency(totalSales),    Icon: ShoppingBasket03Icon, tint: "#EAF7EE", color: "#16A34A" },
    { label: "Total Expenses",   value: formatCurrency(totalExpenses), Icon: ReceiptDollarIcon,    tint: "#FFF3EC", color: "#F97316" },
    { label: "Total Orders",     value: String(sales.length),          Icon: PackageIcon,          tint: "#F3EEFF", color: "#8B5CF6" },
    { label: "Outstanding Debt", value: formatCurrency(outstanding),   Icon: MoneyBag01Icon,       tint: "#EAF0FC", color: "#2563EB" },
  ];

  const QUICK = [
    { label: "POS",      Icon: Invoice01Icon, tint: "#FFF3EC", color: "#F97316", href: "/orders/new" },
    { label: "Add Item", Icon: CheckListIcon, tint: "#EAF7EE", color: "#16A34A", href: "/menu/add" },
    { label: "Restock",  Icon: PackageIcon,   tint: "#F3EEFF", color: "#8B5CF6", href: "/inventory" },
  ];

  // Points at whatever the setup checklist wants done next (same steps/order as
  // SetupChecklist, read from the same flags) — a visual nudge on top of the
  // checklist's own "tap to go there" rows, for anyone who's collapsed the card.
  const [setupTarget, setSetupTarget] = useState<string | null>(null);
  useEffect(() => {
    if (loading) return;
    try {
      if (localStorage.getItem("spal_setup_done")) { setSetupTarget(null); return; }
      const seen = (k: string) => !!localStorage.getItem(`spal_seen_${k}`);
      if (menuCount === 0)         { setSetupTarget("tab-menu"); return; }
      if (sales.length === 0)      { setSetupTarget("tab-orders"); return; }
      if (!seen("category"))       { setSetupTarget("tab-menu"); return; }
      if (!seen("ask"))            { setSetupTarget("ask-quick-access"); return; }
      if (!seen("profile"))        { setSetupTarget("tab-profile"); return; }
      setSetupTarget(null);
    } catch { setSetupTarget(null); }
  }, [loading, menuCount, sales.length]);

  return (
    <div className="min-h-full pb-nav" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <AppHeader />

      {/* Period tabs */}
      <div className="px-5 mt-5">
        <div className="flex items-center bg-white rounded-full p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                aria-label={p.label}
                className="flex-1 min-w-0 h-12 px-1 rounded-full font-bold transition-all whitespace-nowrap"
                style={{ fontSize: "clamp(11px, 3.3vw, 13px)", background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your numbers. Check your connection.</p>
            <button onClick={() => fetchData(period)} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        </div>
      )}

      {/* First-run setup checklist (self-hides once complete) */}
      <SetupChecklist hasItem={menuCount > 0} hasSale={sales.length > 0} perishable={true} />
      {setupTarget && <TargetPulse targetAttr={setupTarget} />}

      {/* Stat cards */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl px-4 py-4 min-w-0" style={{ boxShadow: CARD_SHADOW }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: s.tint }}>
              <s.Icon size={20} color={s.color} />
            </span>
            <p className="text-[13px] text-neutral-500 mt-3">{s.label}</p>
            {loading
              ? <div className="h-7 w-20 rounded bg-neutral-100 animate-pulse mt-1" />
              : <p className="font-black text-spal-navy truncate mt-0.5" style={{ fontSize: "clamp(18px, 6vw, 24px)", letterSpacing: "-0.02em" }}>{s.value}</p>}
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="px-5 mt-6">
        <p className="text-[16px] font-black text-spal-navy mb-3">Quick Access</p>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK.map((q) => (
            <button key={q.label} onClick={() => router.push(q.href)} aria-label={q.label} className="bg-white rounded-2xl py-4 min-h-[88px] flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: CARD_SHADOW }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: q.tint }}>
                <q.Icon size={19} color={q.color} />
              </span>
              <span className="text-[12px] font-semibold text-neutral-600">{q.label}</span>
            </button>
          ))}
          <button onClick={() => { markSetupSeen("ask"); window.location.href = "/ask"; }} aria-label="Ask SPAL" data-setup-target="ask-quick-access" className="bg-white rounded-2xl py-4 min-h-[88px] flex flex-col items-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: CARD_SHADOW }}>
            <Image src="/spal-ai.webp" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-[12px] font-semibold text-neutral-600">Ask SPAL</span>
          </button>
        </div>
      </div>

      {/* Insight promo */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#F0F3FE", minHeight: 150 }}>
          <div className="relative z-10" style={{ maxWidth: "60%" }}>
            <p className="text-[16px] font-black text-spal-navy leading-snug">View full Earning/Spending Insight</p>
            <p className="text-[13px] text-neutral-500 mt-1">Looking for more insights?</p>
            <button onClick={() => router.push("/insights")} aria-label="See Insight" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 h-12 active:scale-[0.98] transition-transform" style={{ background: "#2563EB" }}>
              <span className="text-white font-bold text-[14px]">See Insight</span>
              <ArrowRight01Icon size={16} color="#fff" />
            </button>
          </div>
          <Image src="/home-insight-bars.webp" alt="" width={286} height={200} className="absolute right-4 top-1/2 -translate-y-1/2 w-[135px] h-auto pointer-events-none" />
        </div>
      </div>

      {/* Insights carousel */}
      <div className="px-5 mt-5">
        <InsightsCarousel items={insights} />
      </div>

      {/* Recent orders */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-black text-spal-navy">Recent Orders</p>
          {sales.length > 4 && (
            <button onClick={() => router.push("/records")} aria-label="View all orders" className="inline-flex items-center gap-1 text-[13px] font-bold min-h-12" style={{ color: "#16A34A" }}>
              View All Orders <ArrowRight01Icon size={14} color="#16A34A" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-8 text-center" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-[14px] font-bold text-spal-navy">No orders yet</p>
            <p className="text-[13px] text-neutral-400 mt-1">Tap POS when your first customer walks in.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((r) => {
              const label = r.description ?? "Order";
              const tint = iconTint(label);
              const Icon = dishIcon(label);
              const pay = payInfo(r);
              return (
                <button key={r.id} onClick={() => router.push(`/records/${r.id}`)} aria-label={`Order ${label}`} className="w-full text-left bg-white rounded-2xl px-4 py-3.5 min-h-[68px] flex items-center gap-3 active:scale-[0.99] transition-transform" style={{ boxShadow: CARD_SHADOW }}>
                  <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint.bg }}>
                    <Icon size={20} color={tint.color} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-spal-navy truncate">{label}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: pay.bg, color: pay.color }}>
                      {pay.label}
                    </span>
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
      </div>

      {/* POS device promo */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#EEFAF3", minHeight: 150 }}>
          <div className="relative z-10" style={{ maxWidth: "62%" }}>
            <p className="text-[18px] font-black text-spal-navy leading-tight">Do you have a POS Device?</p>
            <p className="text-[12.5px] text-neutral-500 mt-1">Either a handheld or desktop POS device</p>
            <button onClick={() => router.push("/wallet")} aria-label="Connect Device" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 active:scale-[0.98] transition-transform" style={{ background: "#22C55E" }}>
              <span className="text-white font-bold text-[13.5px]">Connect Device</span>
              <ArrowRight01Icon size={15} color="#fff" />
            </button>
          </div>
          <Image src="/home-pos-device.webp" alt="" width={510} height={600} className="absolute right-2 bottom-0 h-[140px] w-auto pointer-events-none" />
        </div>
      </div>

      {/* SPAL account number promo */}
      <div className="px-5 mt-3">
        <div className="rounded-2xl overflow-hidden relative px-4 py-5" style={{ background: "#FFF4EF", minHeight: 178 }}>
          <div className="relative z-10" style={{ maxWidth: "62%" }}>
            <p className="text-[18px] font-black text-spal-navy leading-tight">Get Your SPAL<br />Account Number</p>
            <p className="text-[12.5px] text-neutral-500 mt-1.5 leading-relaxed">Receive payments directly in SPAL and keep your business records up to date</p>
            <button onClick={() => router.push("/wallet")} aria-label="Claim Number" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-12 active:scale-[0.98] transition-transform" style={{ background: "#F97316" }}>
              <span className="text-white font-bold text-[13.5px]">Claim Number</span>
              <ArrowRight01Icon size={15} color="#fff" />
            </button>
          </div>
          <Image src="/home-account-phone.webp" alt="" width={222} height={400} className="absolute right-3 bottom-0 h-[158px] w-auto pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
