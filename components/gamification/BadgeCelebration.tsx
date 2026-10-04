"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore } from "@/store";

export function BadgeCelebration() {
  const { newBadge, setNewBadge } = useSPALStore();

  // Auto-dismiss after 3.5s
  useEffect(() => {
    if (!newBadge) return;
    const t = setTimeout(() => setNewBadge(null), 3500);
    return () => clearTimeout(t);
  }, [newBadge, setNewBadge]);

  return (
    <AnimatePresence>
      {newBadge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setNewBadge(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-spal-navy/70 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 280 }}
            className="relative z-10 bg-white rounded-3xl px-8 py-10 mx-6 text-center shadow-2xl"
          >
            {/* Burst rings */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.4, 1.2], opacity: [0, 0.25, 0] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute inset-0 rounded-3xl bg-spal-green"
            />

            {/* Emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1, damping: 8, stiffness: 200, mass: 0.6 }}
              className="text-6xl mb-4 leading-none"
            >
              {newBadge.emoji}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <p className="text-xs font-bold text-spal-green uppercase tracking-widest mb-1">
                Badge Unlocked!
              </p>
              <h2 className="text-2xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)] mb-2">
                {newBadge.name}
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {newBadge.description}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-xs text-neutral-300"
            >
              Tap anywhere to close
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

