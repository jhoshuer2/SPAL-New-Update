"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Delete01Icon } from "hugeicons-react";

interface UndoToastProps {
  message:  string;
  onUndo:   () => void;
  onExpire: () => void;
  duration?: number; // ms — default 10 000
}

export function UndoToast({ message, onUndo, onExpire, duration = 10_000 }: UndoToastProps) {
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const t = setTimeout(() => {
      expiredRef.current = true;
      onExpire();
    }, duration);
    return () => clearTimeout(t);
  }, [onExpire, duration]);

  function handleUndo() {
    if (expiredRef.current) return;
    onUndo();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-4 right-4 z-[150]"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
        style={{ background: "#1E293B", boxShadow: "0 8px 24px rgba(0,0,0,0.22)" }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.15)" }}>
          <Delete01Icon size={14} color="#F87171" />
        </div>
        <p className="flex-1 text-[13px] font-medium text-white" style={{ fontFamily: "var(--font-satoshi)" }}>
          {message}
        </p>
        <button
          onClick={handleUndo}
          className="text-[13px] font-bold active:opacity-60 transition-opacity flex-shrink-0"
          style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}
        >
          Undo
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className="mt-1.5 h-[3px] rounded-full origin-left"
        style={{ background: "#22C55E", opacity: 0.6 }}
      />
    </motion.div>
  );
}
