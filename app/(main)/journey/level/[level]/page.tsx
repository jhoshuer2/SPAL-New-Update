"use client";
// D02 Level detail: what a level means and how to finish it.
import { use } from "react";
import { notFound } from "next/navigation";
import { useJourney } from "@/components/journey/useJourney";
import { ErrorBlock, FF, MilestoneRow, PendingBlock, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { LEVELS, LEVEL_CHALLENGES } from "@/lib/engine/levels";
import type { Level } from "@/lib/engine/placement";

export default function LevelDetail({ params }: { params: Promise<{ level: string }> }) {
  const { level: raw } = use(params);
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 5) notFound();
  const lvl = n as Level;
  const def = LEVELS[lvl];
  const { state, reload } = useJourney();

  return (
    <div data-testid="screen-D02" className="min-h-full pb-nav bg-spal-bg">
      <TopBar title={`Level ${lvl}`} />
      <div className="px-5">
        <h1 style={{ fontFamily: FF }} className="text-[34px] leading-[1.05] font-bold text-spal-navy tracking-tight">{def.name}</h1>
        <p className="mt-2 text-[17px] text-neutral-600">&ldquo;{def.quote}&rdquo;</p>
        <p className="mt-3 text-[15px] text-spal-navy leading-snug">{def.blurb}</p>
      </div>

      {state.status === "loading" && <div className="mt-6"><ScreenSkeleton /></div>}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5 mt-6"><PendingBlock /></div>}
      {state.status === "ready" && (
        <>
          {lvl > state.data.level && (
            <p className="mx-5 mt-4 rounded-2xl bg-white/70 px-4 py-3 text-[14px] text-neutral-600">This is usually for Level {lvl}. You&apos;re welcome to look around.</p>
          )}
          <Section title="Milestones">
            <div className={`${cardCls} px-4 divide-y divide-neutral-100`}>
              {state.data.milestones.filter((m) => m.level === lvl && m.completion_type !== "none").sort((a, b) => a.position - b.position).map((m) => <MilestoneRow key={m.key} m={m} />)}
            </div>
          </Section>
        </>
      )}

      <Section title="Common challenges here">
        <ul className="space-y-2">
          {LEVEL_CHALLENGES[lvl].map((c) => (
            <li key={c} className={`${cardCls} px-4 py-3 text-[15px] text-spal-navy leading-snug`}>{c}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
