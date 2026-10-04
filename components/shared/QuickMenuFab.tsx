"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ChartIncreaseIcon,
  ChartDecreaseIcon,
  ChatIcon,
  Menu01Icon,
  Target01Icon,
  PackageIcon,
} from "hugeicons-react";

const HIDDEN_PATHS = ["/picture", "/confirm", "/voice", "/ask", "/set-goals"];

export function QuickMenuFab() {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hidden = HIDDEN_PATHS.some(p => pathname.includes(p));
  if (hidden) return null;

  // Outside click
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      ref={ref}
      className="fixed z-50"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", right: "16px" }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-[60px] right-0 bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.14)", minWidth: "190px" }}
          >
            <button
              onClick={() => { setOpen(false); router.push("/records/add-sale"); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50 transition-colors border-b border-neutral-50"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
                <ChartIncreaseIcon size={15} color="#16A34A" />
              </div>
              <span className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                Record Sale
              </span>
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/records/add-expense"); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50 transition-colors border-b border-neutral-50"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FFF5ED" }}>
                <ChartDecreaseIcon size={15} color="#EA580C" />
              </div>
              <span className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                Record Expense
              </span>
            </button>
            <button
              onClick={() => { setOpen(false); window.location.href = "/ask"; }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50 transition-colors border-b border-neutral-50"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "#F3EEFF" }}>
                <Image src="/spal-ai.webp" alt="SPAL" width={28} height={28} className="w-7 h-7 object-contain" />
              </div>
              <span className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                Chat with SPAL
              </span>
            </button>
            <button
              onClick={() => { setOpen(false); window.location.href = "/set-goals"; }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50 transition-colors border-b border-neutral-50"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E0F4E9" }}>
                <Target01Icon size={15} color="#16A34A" />
              </div>
              <span className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                Set your goals
              </span>
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/inventory"); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                <PackageIcon size={15} color="#2563EB" />
              </div>
              <span className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                Manage inventory
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Quick Menu"
        className="flex items-center gap-2 px-5 h-12 rounded-full font-bold text-[13px] text-white active:scale-95 transition-transform"
        style={{
          background:  "#22C55E",
          boxShadow:   "0 4px 16px rgba(34,197,94,0.38)",
          fontFamily:  "var(--font-satoshi)",
        }}
      >
        <Menu01Icon size={17} color="#fff" />
        Quick Menu
      </button>
    </div>
  );
}
