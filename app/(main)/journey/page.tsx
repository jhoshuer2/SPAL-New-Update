"use client";
// D01 Journey roadmap: the six levels as a path, with you marked on it.
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight01Icon, Tick01Icon } from "hugeicons-react";
import { useJourney } from "@/components/journey/useJourney";
import { ErrorBlock, FF, MilestoneRow, PendingBlock, Ring, ScreenSkeleton, Section, TopBar, cardCls, formatDate } from "@/components/journey/ui";
import { LEVELS } from "@/lib/engine/levels";

export default function JourneyRoadmap() {
  const { state, reload } = useJourney();
  return (
    <div data-testid="screen-D01" className="min-h-full pb-nav bg-spal-bg" style={{ fontFamily: "var(--font-inter)" }}>
      <TopBar back={false} title="Your journey" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5 mt-4"><PendingBlock /></div>}
      {state.status === "ready" && (() => {
        const { level, progress, milestones, reached, levelUp } = state.data;
        const cur = LEVELS[level];
        return (
          <>
            {/* Where you are */}
            <div className="px-5">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`${cardCls} p-5`}>
                <div className="flex items-center gap-4">
                  <Ring pct={progress.pct} size={72} label={`${progress.pct} percent of Level ${level}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-[0.08em]">You are here</p>
                    <p style={{ fontFamily: FF }} className="text-[24px] leading-tight font-bold text-spal-navy">Level {level}: {cur.name}</p>
                    <p className="text-[13px] text-neutral-600">{progress.done} of {progress.total} milestones done</p>
                  </div>
                </div>
                {levelUp && (
                  <Link href="/level-up" className="mt-4 flex items-center justify-between h-12 px-4 rounded-2xl bg-[#22C55E] text-white font-bold text-[15px] active:scale-[0.98] transition-transform">
                    You&apos;re ready for Level {level + 1}
                    <ArrowRight01Icon size={18} color="#fff" />
                  </Link>
                )}
              </motion.div>
            </div>

            {/* The path */}
            <Section title="The path">
              <ol className="relative">
                <span aria-hidden className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-neutral-200" />
                {LEVELS.map((l) => {
                  const isPast = l.level < level;
                  const isCur = l.level === level;
                  const isNext = l.level === level + 1;
                  const mine = milestones.filter((m) => m.level === l.level && m.completion_type !== "none").sort((a, b) => a.position - b.position);
                  return (
                    <li key={l.level} className="relative pl-12 pb-5">
                      <span className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${isPast ? "bg-spal-navy text-white" : isCur ? "bg-[#22C55E] text-white ring-4 ring-[#22C55E]/20" : "bg-white border-2 border-neutral-200 text-neutral-400"}`}>
                        {isPast ? <Tick01Icon size={15} color="#fff" /> : l.level}
                      </span>
                      <Link href={`/journey/level/${l.level}`} className="block active:opacity-70" aria-label={`Level ${l.level}, ${l.name}`}>
                        <p style={{ fontFamily: FF }} className={`text-[17px] font-bold ${isCur || isPast ? "text-spal-navy" : "text-neutral-500"}`}>{l.name}</p>
                        <p className="text-[13px] text-neutral-500 leading-snug">
                          {isPast && reached[l.level] ? `Reached ${formatDate(reached[l.level])}` : l.quote}
                        </p>
                      </Link>
                      {isCur && (
                        <div className={`${cardCls} mt-3 px-4 divide-y divide-neutral-100`}>
                          {mine.map((m) => <MilestoneRow key={m.key} m={m} />)}
                        </div>
                      )}
                      {isNext && (
                        <p className="mt-2 text-[13px] text-neutral-600 leading-snug">Up next: {mine.map((m) => m.title).slice(0, 2).join(", ")}…</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Section>

            <div className="px-5 mt-2 grid grid-cols-2 gap-3">
              <Link href="/journey/timeline" className={`${cardCls} p-4 active:scale-[0.98] transition-transform`}>
                <p style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">Timeline</p>
                <p className="text-[13px] text-neutral-500">Your story so far</p>
              </Link>
              <Link href="/goals" className={`${cardCls} p-4 active:scale-[0.98] transition-transform`}>
                <p style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">Goals</p>
                <p className="text-[13px] text-neutral-500">What you&apos;re working toward</p>
              </Link>
            </div>
          </>
        );
      })()}
    </div>
  );
}
