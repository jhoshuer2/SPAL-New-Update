"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search01Icon, Notification03Icon, ComputerUserIcon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const BG = "#EEF3E9";
const FF = "var(--font-satoshi)";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function WalletPage() {
  const { user, activeBusiness } = useSPALStore();
  const businessName = activeBusiness?.business_name || user?.business_name || "Your Store";
  const [toast, setToast] = useState(false);

  function claim() {
    setToast(true);
    setTimeout(() => setToast(false), 2400);
  }

  return (
    <div className="flex flex-col" style={{ background: BG, fontFamily: FF, minHeight: "100dvh" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#D9C7B8" }}>
          {user?.avatar_url
            ? <Image src={user.avatar_url} alt="" width={44} height={44} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[16px] font-black text-white">{businessName.charAt(0)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-neutral-500" style={{ fontFamily: FF }}>{greeting()}</p>
          <p className="text-[18px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{businessName}</p>
        </div>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Search"><Search01Icon size={19} color="#6B7280" /></button>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Notifications"><Notification03Icon size={19} color="#6B7280" /></button>
      </div>

      {/* Empty / claim state */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ paddingBottom: "calc(var(--bottom-nav-h, 88px) + 16px)" }}>
        <ComputerUserIcon size={56} color="#5B6472" strokeWidth={1.5} />
        <h1 className="text-[30px] font-black text-spal-navy leading-tight mt-6" style={{ fontFamily: FF }}>
          Get a SPAL account number for your business in less than 1 minute
        </h1>
        <p className="text-[16px] text-neutral-500 mt-4" style={{ fontFamily: FF }}>See all your transactions in one place</p>

        <button onClick={claim}
          className="w-full max-w-[420px] h-16 rounded-full text-white font-black text-[18px] mt-10 active:scale-[0.98] transition-transform"
          style={{ background: "#F97316", fontFamily: FF, boxShadow: "0 10px 30px rgba(249,115,22,0.35)" }}>
          Claim Number
        </button>
      </div>

      {/* Coming-soon toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full"
            style={{ background: "#0F172A", bottom: "calc(var(--bottom-nav-h, 88px) + 16px)", boxShadow: "0 10px 30px rgba(0,0,0,0.28)" }}
          >
            <span className="text-[14px] font-bold text-white" style={{ fontFamily: FF }}>Coming soon — we're building this for you</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
