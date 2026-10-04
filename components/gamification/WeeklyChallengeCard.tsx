"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Challenge {
  id: string;
  challenge_label: string;
  challenge_type: string;
  target: number;
  current_progress: number;
  completed: boolean;
}

export function WeeklyChallengeCard() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d) => { if (d.success) setChallenge(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !challenge) return null;

  const pct = Math.min(Math.round((challenge.current_progress / challenge.target) * 100), 100);
  const done = challenge.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div
        className={`rounded-2xl p-4 border ${
          done
            ? "bg-spal-green-50 border-spal-green-100"
            : "bg-white border-neutral-100"
        }`}
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold text-spal-purple uppercase tracking-wide">
                Weekly Challenge
              </span>
              {done && <span className="text-xs">🎉</span>}
            </div>
            <p className="text-sm font-semibold text-spal-navy leading-snug">
              {challenge.challenge_label}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className={`text-lg font-bold ${done ? "text-spal-green" : "text-spal-navy"}`}>
              {challenge.current_progress}
              <span className="text-sm font-normal text-neutral-400">/{challenge.target}</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${done ? "bg-spal-green" : "bg-spal-purple"}`}
          />
        </div>

        {done && (
          <p className="mt-2 text-xs text-spal-green-700 font-semibold">
            You completed this week&apos;s challenge! 🏆
          </p>
        )}
      </div>
    </motion.div>
  );
}
