"use client";
// C01 for Level 0: nothing sold yet, so Home is the starter path (no empty money charts).
import Link from "next/link";
import { AppHeader } from "./AppHeader";
import { JourneyStrip } from "./JourneyStrip";
import { FF, MilestoneRow, cardCls } from "@/components/journey/ui";
import type { JourneyData } from "@/lib/journey/server";
import { LEVELS } from "@/lib/engine/levels";

export function StarterHome({ data }: { data: JourneyData }) {
  const mine = data.milestones.filter((m) => m.level === data.level && m.completion_type !== "none").sort((a, b) => a.position - b.position);
  const begin = LEVELS[0].begin.find((b) => b.key === data.beginChoice);
  return (
    <div data-testid="screen-C01" className="min-h-full pb-nav" style={{ background: "#EDF3E8" }}>
      <AppHeader />
      <JourneyStrip data={data} />
      {begin && (
        <div className="px-5 mt-3">
          <div className={`${cardCls} p-4`}>
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-[0.08em]">You chose to begin with</p>
            <p style={{ fontFamily: FF }} className="mt-0.5 text-[17px] font-bold text-spal-navy">{begin.title}</p>
            <p className="text-[14px] text-neutral-600">{begin.outcome}</p>
          </div>
        </div>
      )}
      <section className="px-5 mt-6">
        <h2 style={{ fontFamily: FF }} className="text-[17px] font-bold text-spal-navy mb-3">Your starter path</h2>
        <div className={`${cardCls} px-4 divide-y divide-neutral-100`}>
          {mine.map((m) => <MilestoneRow key={m.key} m={m} />)}
        </div>
        <Link href="/sell" className="mt-4 block text-center text-[14px] text-neutral-600 active:opacity-60">Already selling? Record a sale</Link>
      </section>
    </div>
  );
}
