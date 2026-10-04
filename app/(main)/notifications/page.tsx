"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft01Icon, Notification01Icon, Award01Icon, ChartIncreaseIcon,
  Megaphone01Icon, FireIcon, GraduationScrollIcon, StarIcon,
} from "hugeicons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppNotification {
  id:         string;
  type:       string;
  title:      string;
  body:       string;
  icon:       string | null;
  data:       Record<string, unknown>;
  read_at:    string | null;
  created_at: string;
}

// ── Config per type ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  bg:     string;
  color:  string;
  Icon:   React.ComponentType<{ size: number; color: string }>;
  label:  string;
}> = {
  badge_unlocked: { bg: "#FEF3C7", color: "#D97706", Icon: Award01Icon,          label: "Badge" },
  milestone:      { bg: "#F0FDF4", color: "#16A34A", Icon: ChartIncreaseIcon,     label: "Milestone" },
  streak:         { bg: "#FFF7ED", color: "#EA580C", Icon: FireIcon,            label: "Streak" },
  app_update:     { bg: "#EFF6FF", color: "#2563EB", Icon: Megaphone01Icon,         label: "Update" },
  coach:          { bg: "#F5F3FF", color: "#7C3AED", Icon: GraduationScrollIcon,  label: "Coach" },
};

const FALLBACK_CONFIG = { bg: "#F3F4F6", color: "#6B7280", Icon: StarIcon, label: "Notice" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const groups: Map<string, AppNotification[]> = new Map();
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifications) {
    const d   = new Date(n.created_at).toDateString();
    const key = d === today ? "Today" : d === yesterday ? "Yesterday" : new Date(n.created_at).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) setNotifications(data.data ?? []);
      } finally {
        setLoading(false);
      }
      // Mark all as read
      fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    }
    load();
  }, []);

  const unread = notifications.filter(n => !n.read_at).length;
  const groups = groupByDate(notifications);

  return (
    <div className="min-h-full pb-24" style={{ background: "#EEF3E9" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Back"
          >
            <ArrowLeft01Icon size={18} color="#0F172A" />
          </button>
          <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Notifications
          </h1>
        </div>
        {unread > 0 && (
          <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "#FEF2F2", color: "#DC2626", fontFamily: "var(--font-satoshi)" }}>
            {unread} unread
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-5">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[72px] rounded-2xl skeleton" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence initial={false}>
            {groups.map(({ label, items }) => (
              <motion.div key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-2 mt-5"
                  style={{ fontFamily: "var(--font-satoshi)" }}>
                  {label}
                </p>
                <div className="space-y-2">
                  {items.map((n, i) => (
                    <NotificationCard key={n.id} n={n} index={i} />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ── NotificationCard ──────────────────────────────────────────────────────────

function NotificationCard({ n, index }: { n: AppNotification; index: number }) {
  const cfg   = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG;
  const isNew = !n.read_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3.5"
      style={{
        boxShadow: isNew ? "0 2px 8px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.04)",
        border:    isNew ? "1.5px solid #E5E7EB" : "1.5px solid transparent",
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg }}
      >
        {n.icon && n.type === "badge_unlocked" ? (
          <span className="text-[18px] leading-none">{n.icon}</span>
        ) : (
          <cfg.Icon size={18} color={cfg.color} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13.5px] font-bold text-spal-navy leading-snug"
            style={{ fontFamily: "var(--font-satoshi)" }}>
            {n.title}
          </p>
          {isNew && (
            <div className="w-2 h-2 rounded-full bg-spal-blue flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-[12.5px] text-neutral-500 mt-0.5 leading-relaxed"
          style={{ fontFamily: "var(--font-satoshi)" }}>
          {n.body}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color, fontFamily: "var(--font-satoshi)" }}>
            {cfg.label}
          </span>
          <span className="text-[11px] text-neutral-300" style={{ fontFamily: "var(--font-satoshi)" }}>
            {relativeTime(n.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-20 px-6"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#F3F4F6" }}>
        <Notification01Icon size={26} color="#D1D5DB" />
      </div>
      <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
        Nothing here yet
      </p>
      <p className="text-[13px] text-neutral-400 mt-2 leading-relaxed max-w-[260px]"
        style={{ fontFamily: "var(--font-satoshi)" }}>
        When you unlock badges, hit milestones, or there&apos;s a SPAL update — you&apos;ll see it here.
      </p>
    </motion.div>
  );
}
