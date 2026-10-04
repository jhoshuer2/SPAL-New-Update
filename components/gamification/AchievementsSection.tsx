"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Badge } from "@/lib/gamification/badges";

type BadgeWithStatus = Badge & { earned_at: string | null };

export function AchievementsSection() {
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BadgeWithStatus | null>(null);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBadges(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const earned = badges.filter((b) => b.earned_at);
  const locked = badges.filter((b) => !b.earned_at);

  if (loading) {
    return (
      <div className="mt-6">
        <p className="spal-section-label mb-3">Achievements</p>
        <div className="grid grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 bg-neutral-100 rounded-2xl" />
              <div className="h-2.5 bg-neutral-100 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="spal-section-label">Achievements</p>
        <span className="text-xs text-neutral-400">{earned.length}/{badges.length} unlocked</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[...earned, ...locked].map((badge, i) => (
          <motion.button
            key={badge.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setSelected(badge)}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                badge.earned_at
                  ? "bg-spal-green-50 border border-spal-green-100 shadow-sm"
                  : "bg-neutral-50 border border-neutral-100 grayscale opacity-40"
              }`}
            >
              {badge.earned_at ? badge.emoji : "🔒"}
            </div>
            <p className={`text-[9px] font-semibold text-center leading-tight ${
              badge.earned_at ? "text-spal-navy" : "text-neutral-400"
            }`}>
              {badge.name}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Badge detail overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-spal-navy/40" />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="relative z-10 bg-white rounded-t-3xl w-full max-w-md overflow-hidden"
            style={{ maxHeight: "92dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="overflow-y-auto overscroll-contain px-6 py-8 text-center"
              style={{ maxHeight: "calc(92dvh)", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
            >
            <div className="text-5xl mb-3">{selected.earned_at ? selected.emoji : "🔒"}</div>
            <h3 className="text-lg font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
              {selected.name}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">{selected.description}</p>
            {selected.earned_at ? (
              <p className="mt-3 text-xs text-spal-green font-semibold">
                Earned {new Date(selected.earned_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            ) : (
              <p className="mt-3 text-xs text-neutral-400">Not yet earned — keep going!</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full h-12 bg-spal-navy rounded-2xl text-white text-sm font-semibold"
            >
              Close
            </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

