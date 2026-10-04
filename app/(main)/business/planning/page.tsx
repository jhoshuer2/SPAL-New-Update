"use client";
// E01 Planning home: idea, validation, budget, launch, with progress on each.
import Link from "next/link";
import { ArrowRight01Icon } from "hugeicons-react";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, TopBar, cardCls } from "@/components/journey/ui";
import { usePlanning } from "@/components/planning/shared";
import { formatNaira } from "@/lib/utils/kobo";

function Step({ n, title, status, href, pct }: { n: number; title: string; status: string; href: string; pct: number }) {
  return (
    <Link href={href} className={`${cardCls} p-4 flex items-center gap-4 active:scale-[0.99] transition-transform`}>
      <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[15px] font-bold ${pct >= 100 ? "bg-[#22C55E] text-white" : "bg-spal-bg text-spal-navy"}`}>{pct >= 100 ? "✓" : n}</span>
      <span className="flex-1 min-w-0">
        <span style={{ fontFamily: FF }} className="block text-[17px] font-bold text-spal-navy leading-tight">{title}</span>
        <span className="block text-[13px] text-neutral-500">{status}</span>
        <span className="mt-2 block h-1.5 rounded-full bg-neutral-100 overflow-hidden" aria-hidden><span className="block h-full rounded-full bg-[#22C55E] transition-all duration-500" style={{ width: `${pct}%` }} /></span>
      </span>
      <ArrowRight01Icon size={18} color="#A1A1AA" />
    </Link>
  );
}

export default function PlanningHome() {
  const { state, reload } = usePlanning();
  return (
    <div data-testid="screen-E01" className="min-h-full pb-nav bg-spal-bg">
      <TopBar back={false} title="Plan your start" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && (() => {
        const d = state.data;
        return (
          <div className="px-5 space-y-3">
            <p className="text-[15px] text-neutral-600 leading-snug mb-1">Five steps from idea to first sale. Do them in any order.</p>
            <Step n={1} title="My idea" href="/business/planning/idea" pct={d.idea?.summary?.oneLiner ? 100 : 0} status={d.idea?.summary?.oneLiner ? d.idea.summary.oneLiner : "Describe it in your own words"} />
            <Step n={2} title="Validate my idea" href="/business/planning/validate" pct={d.validation?.progress.pct ?? 0} status={d.validation ? `${d.validation.progress.talked} of 5 customer conversations` : "Talk to 5 possible customers"} />
            <Step n={3} title="Startup budget" href="/business/planning/budget" pct={d.budget && d.budget.items.length ? (d.budget.result.covered ? 100 : 50) : 0}
              status={d.budget && d.budget.items.length ? (d.budget.result.covered ? "Your budget is covered" : `Gap: ${formatNaira(d.budget.result.gap)}`) : "What you need and what you have"} />
            <div className={`${cardCls} p-4 flex items-center gap-4 opacity-70`} aria-disabled>
              <span className="w-10 h-10 shrink-0 rounded-full bg-spal-bg flex items-center justify-center text-[15px] font-bold text-neutral-400">4</span>
              <span className="flex-1"><span style={{ fontFamily: FF }} className="block text-[17px] font-bold text-neutral-500 leading-tight">Business plan</span><span className="block text-[13px] text-neutral-400">Coming soon</span></span>
            </div>
            <Step n={5} title="Launch plan" href="/business/planning/launch" pct={d.launch?.progress.pct ?? 0} status={d.launch ? `${d.launch.progress.done} of ${d.launch.progress.total} tasks done` : "Week by week to your first sale"} />
            <Link href="/journey" className="block pt-3 text-center text-[14px] text-neutral-600 active:opacity-60">See where this fits on your journey</Link>
          </div>
        );
      })()}
    </div>
  );
}
