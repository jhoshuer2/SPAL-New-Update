"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { getGreeting } from "@/lib/utils/dates";
import type { BusinessRecord, InventoryItem } from "@/lib/types";
import type { InsightItem } from "@/components/home/InsightsCarousel";

/**
 * Retail (non-perishable) dashboard data + business logic — UI-agnostic.
 *
 * This is the single source of truth for the retail home. Both the mobile view
 * (components/home/RetailHome.tsx) and any other view (e.g. a separate SPAL
 * Desktop app) render from this hook, so changing the numbers/insights here
 * updates every layout at once. Views own only presentation (which icon, which
 * grid); this hook owns what the data means. See DESKTOP.md.
 */
export type Period = "today" | "week" | "month" | "year";

export function periodStart(p: Period): string {
  const d = new Date();
  if (p === "today") return d.toISOString().slice(0, 10);
  if (p === "week")  { d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }
  if (p === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return `${d.getFullYear()}-01-01`;
}

export function useRetailDashboard() {
  const { user, activeBusiness, recordSavedAt } = useSPALStore();
  const name = activeBusiness?.business_name ?? user?.business_name ?? user?.full_name ?? "there";
  const greeting = getGreeting();

  const [period, setPeriod]   = useState<Period>("today");
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const [recRes, invRes] = await Promise.all([
        fetch(`/api/records?start_date=${periodStart(p)}&limit=2000`),
        fetch(`/api/inventory`),
      ]);
      const recData = await recRes.json();
      const invData = await invRes.json();
      if (recData.success) setRecords(recData.data ?? []);
      if (invData.success) setItems(invData.data?.items ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);
  useEffect(() => { if (recordSavedAt) fetchData(period); }, [recordSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json())
      .then((d) => { if (d.success) setUnread((d.data as { read_at: string | null }[]).filter((n) => !n.read_at).length); })
      .catch(() => {});
  }, []);

  const sales         = useMemo(() => records.filter((r) => r.type === "sale"), [records]);
  const totalSales    = sales.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = records.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const outstanding   = sales.filter((r) => r.payment_status === "owing").reduce((s, r) => s + r.amount, 0);
  const invValue      = items.reduce((s, it) => s + (it.selling_price ?? it.cost_price ?? 0) * it.quantity, 0);
  const lowCount      = items.filter((it) => it.quantity <= it.low_stock_threshold).length;
  const recentSales   = useMemo(
    () => [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4),
    [sales],
  );

  const insights = useMemo<InsightItem[]>(() => {
    const out: InsightItem[] = [];
    if (outstanding > 0) {
      const owed = sales.filter((r) => r.payment_status === "owing");
      out.push({ id: "debt", tone: "warning", title: `${formatCurrency(outstanding)} is owed to you`, body: `${owed.length} sale${owed.length !== 1 ? "s" : ""} not yet paid. Follow up to get your money in.`, ctaLabel: "View Debts", ctaHref: "/records" });
    }
    if (lowCount > 0) {
      out.push({ id: "low", tone: "warning", title: `${lowCount} product${lowCount !== 1 ? "s are" : " is"} running low`, body: "Restock soon so you never miss a sale.", ctaLabel: "Restock Now", ctaHref: "/inventory" });
    }
    if (period === "today" && totalSales === 0) {
      out.push({ id: "nosale", tone: "info", title: "No sales recorded yet today", body: "Record your first sale to start tracking your day.", ctaLabel: "Record a Sale", ctaHref: "/records/add-sale" });
    } else if (totalSales > 0) {
      out.push({ id: "profit", tone: "success", title: `You've made ${formatCurrency(totalSales)} in sales`, body: "Keep it up. Check your insights to see what's driving it.", ctaLabel: "See Insights", ctaHref: "/insights" });
    }
    out.push({ id: "tip", tone: "info", title: "Track every sale, even the small ones", body: "The more you record, the sharper SPAL's advice on growing your business gets.", ctaLabel: "Ask SPAL", ctaHref: "/ask" });
    return out;
  }, [outstanding, lowCount, period, totalSales, sales]);

  return {
    loading, name, greeting,
    period, setPeriod,
    unread, setUnread,
    records, sales, items,
    totalSales, totalExpenses, outstanding, invValue, lowCount,
    recentSales, insights,
    hasItem: items.length > 0,
    hasSale: sales.length > 0,
    refresh: () => fetchData(period),
  };
}
