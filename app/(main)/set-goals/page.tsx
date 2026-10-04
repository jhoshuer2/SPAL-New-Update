"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Cancel01Icon, Target01Icon, AiMicIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const GRADIENT = "linear-gradient(180deg, #7B92F0 0%, #9FB4EE 30%, #BFD3E6 55%, #CFE3D4 78%, #DDEBD4 100%)";

export default function SetGoalsWelcomePage() {
  const { user } = useSPALStore();
  const name = user?.full_name?.split(" ")[0] ?? user?.business_name ?? "there";

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden" style={{ background: GRADIENT }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={() => { window.location.href = "/home"; }}
          aria-label="Close"
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
        >
          <Cancel01Icon size={18} color="#121212" />
        </button>
        <button
          onClick={() => { window.location.href = "/set-goals/list"; }}
          aria-label="Your goals"
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
        >
          <Target01Icon size={20} color="#121212" />
        </button>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <Image src="/spal-goals.webp" alt="SPAL Goals" width={180} height={180} className="w-40 h-40 object-contain" priority />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-[18px] font-medium mb-2" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}
        >
          Hello {name}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="font-black leading-tight"
          style={{ color: "#121212", fontFamily: "var(--font-satoshi)", fontSize: "clamp(32px, 9vw, 44px)", letterSpacing: "-0.02em" }}
        >
          Welcome to<br />SPAL Goals
        </motion.h1>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}>
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={() => { window.location.href = "/set-goals/capture"; }}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-[16px] active:scale-[0.98] transition-transform"
          style={{ background: "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.4)", fontFamily: "var(--font-satoshi)" }}
        >
          <AiMicIcon size={20} color="#fff" />
          Ready to Plan Your Business?
        </motion.button>
      </div>
    </div>
  );
}
