"use client";
// H06 Spal check-in card: when Spal starts the conversation. Hidden once answered, or if unavailable.
import Link from "next/link";
import { useCheckin } from "./useCheckin";

export function CheckInCard() {
  const { state } = useCheckin();
  if (state.status !== "ready" || state.data.answered) return null;
  const c = state.data;
  return (
    <Link href="/check-in" data-testid="spal-checkin-card" className="block rounded-[20px] bg-spal-navy text-white p-4 active:scale-[0.99] transition-transform">
      <span className="flex items-center gap-2 text-[12px] font-medium text-white/70 uppercase tracking-[0.08em]">
        <span aria-hidden className="w-2 h-2 rounded-full bg-[#22C55E]" />Spal asks
      </span>
      <span style={{ fontFamily: "var(--font-satoshi)" }} className="block mt-1 text-[18px] leading-snug font-bold">{c.question}</span>
      <span className="block mt-1 text-[13px] text-white/70 leading-snug">{c.why}</span>
    </Link>
  );
}
