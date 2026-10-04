"use client";
// C01 Home: the level card, today's focus and Spal's line. Sits at the top of every level's home.
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight01Icon } from "hugeicons-react";
import { FF, Ring, cardCls } from "@/components/journey/ui";
import type { JourneyData } from "@/lib/journey/server";
import { LEVELS } from "@/lib/engine/levels";
import { nudgeFor, todaysFocus } from "@/lib/engine/modules";
import { CheckInCard } from "@/components/spal/CheckInCard";
import { CommunityPeek } from "@/components/home/CommunityPeek";

const dayOfYear = () => Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86_400_000);

export function JourneyStrip({ data }: { data: JourneyData }) {
  const { level, progress, levelUp, hardSeason, onboardingDone } = data;
  const def = LEVELS[level];
  const focus = todaysFocus(level, progress, { salesToday: data.salesToday, hasEverRecorded: data.hasEverRecorded, hardSeason });
  const nudge = nudgeFor(level, dayOfYear(), hardSeason);
  const fade = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <>
    <div className="px-5 mt-5 space-y-3" data-testid="journey-strip">
      {/* Existing users who have not been placed yet get one gentle invitation */}
      {!onboardingDone && (
        <motion.div {...fade(0)}>
          <Link href="/meet-spal" className="block rounded-[20px] bg-spal-navy text-white p-4 active:scale-[0.99] transition-transform">
            <p style={{ fontFamily: FF }} className="text-[17px] font-bold">Meet your level</p>
            <p className="mt-0.5 text-[14px] text-white/75 leading-snug">Answer a few questions so Spal can fit what you see to where you are. About 2 minutes.</p>
          </Link>
        </motion.div>
      )}

      {/* Level card */}
      <motion.div {...fade(1)}>
        <Link href="/journey" className={`${cardCls} p-4 flex items-center gap-4 active:scale-[0.99] transition-transform`} aria-label={`Level ${level} ${def.name}, ${progress.pct} percent. Open your journey`}>
          <Ring pct={progress.pct} />
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-medium text-neutral-500 uppercase tracking-[0.08em]">Level {level}</span>
            <span style={{ fontFamily: FF }} className="block text-[20px] leading-tight font-bold text-spal-navy">{def.name}</span>
            <span className="block text-[13px] text-neutral-600 truncate">{progress.next ? `Next: ${progress.next.title}` : "All milestones done"}</span>
          </span>
          <ArrowRight01Icon size={18} color="#A1A1AA" />
        </Link>
      </motion.div>

      {levelUp && (
        <motion.div {...fade(2)}>
          <Link href="/level-up" className="flex items-center justify-between rounded-[20px] bg-[#22C55E] text-white px-4 h-14 font-bold text-[15px] shadow-[var(--shadow-btn-green)] active:scale-[0.99] transition-transform">
            <span style={{ fontFamily: FF }}>You&apos;re ready for Level {level + 1}</span>
            <ArrowRight01Icon size={18} color="#fff" />
          </Link>
        </motion.div>
      )}

      {/* Today's focus: one thing */}
      <motion.div {...fade(3)}>
        <Link href={focus.href} className={`${cardCls} p-4 block active:scale-[0.99] transition-transform`}>
          <span className="block text-[12px] font-medium text-spal-green-700 uppercase tracking-[0.08em]">Today&apos;s focus</span>
          <span style={{ fontFamily: FF }} className="block mt-0.5 text-[17px] font-bold text-spal-navy leading-snug">{focus.title}</span>
          <span className="block mt-0.5 text-[14px] text-neutral-600 leading-snug">{focus.why}</span>
        </Link>
      </motion.div>

      {/* H06: when Spal starts the conversation (hidden once answered) */}
      <CheckInCard />

      {/* Spal's line: tap to chat */}
      <motion.div {...fade(4)}>
        <Link href="/spal" className="flex items-start gap-3 rounded-[20px] bg-white/70 border border-neutral-200/60 p-4 active:scale-[0.99] transition-transform">
          <span aria-hidden className="mt-0.5 w-8 h-8 rounded-full bg-[#22C55E]/15 flex items-center justify-center shrink-0"><span className="w-3 h-3 rounded-full bg-[#22C55E]" /></span>
          <span className="text-[14px] text-spal-navy leading-snug"><span className="block text-[12px] font-medium text-neutral-500 mb-0.5">Spal</span>{nudge}</span>
        </Link>
      </motion.div>
    </div>
    <CommunityPeek />
    </>
  );
}
