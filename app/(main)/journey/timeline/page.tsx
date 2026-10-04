"use client";
// D05 Journey timeline: automatic and manual moments, newest first.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ErrorBlock, EmptyBlock, FF, ScreenSkeleton, TopBar, formatDate } from "@/components/journey/ui";

type Moment = { id: string; kind: "auto" | "manual"; type: string; text: string | null; occurred_on: string };
const LABEL: Record<string, string> = { win: "Win", struggle: "Struggle", lesson: "Lesson", decision: "Decision", first_sale: "First sale", registered: "Registered", first_hire: "First hire", level_up: "Level up", milestone: "Milestone", day_one: "Day one" };
const TONE: Record<string, string> = { win: "#22C55E", lesson: "#2563EB", decision: "#8B5CF6", struggle: "#F97316", level_up: "#0F172A", first_sale: "#22C55E", milestone: "#16A34A", registered: "#2563EB", first_hire: "#8B5CF6", day_one: "#0F172A" };
const FILTERS = [["all", "All"], ["win", "Wins"], ["struggle", "Struggles"], ["lesson", "Lessons"], ["decision", "Decisions"], ["auto", "Milestones"]] as const;

export default function Timeline() {
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");

  const load = useCallback(() => {
    fetch("/api/moments").then((r) => r.json()).then((j) => { if (j.success) { setFailed(false); setMoments(j.data); } else setFailed(true); }).catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (moments ?? []).filter((m) => filter === "all" || (filter === "auto" ? m.kind === "auto" : m.type === filter)), [moments, filter]);

  return (
    <div data-testid="screen-D05" className="min-h-full pb-nav bg-spal-bg">
      <TopBar title="Timeline" right={<Link href="/journey/moment/new" className="h-10 px-4 rounded-full bg-spal-navy text-white text-[14px] font-bold flex items-center active:scale-95 transition-transform">Add</Link>} />
      <div className="px-5 flex gap-2 overflow-x-auto pb-1 -mx-0 scrollbar-none" role="tablist" aria-label="Filter moments">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
            className={`shrink-0 h-10 px-4 rounded-full text-[14px] font-medium border transition-colors ${filter === k ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{l}</button>
        ))}
      </div>

      {failed && <ErrorBlock onRetry={load} />}
      {!failed && moments === null && <ScreenSkeleton />}
      {!failed && moments && shown.length === 0 && (
        <div className="px-5 mt-6"><EmptyBlock title={filter === "all" ? "Your story starts here" : "Nothing here yet"} body="Add a win, a lesson or a hard day. It stays private unless you choose to share." href="/journey/moment/new" cta="Add a moment" /></div>
      )}
      {!failed && shown.length > 0 && (
        <ol className="relative mt-6 px-5">
          <span aria-hidden className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-neutral-200" />
          {shown.map((m) => (
            <li key={m.id} className="relative pl-9 pb-5">
              <span aria-hidden className="absolute left-[3px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-spal-bg" style={{ background: TONE[m.type] ?? "#0F172A", left: 2 }} />
              <p className="text-[12px] text-neutral-500">{formatDate(m.occurred_on)} · <span className="font-medium" style={{ color: TONE[m.type] ?? "#0F172A" }}>{LABEL[m.type] ?? m.type}</span></p>
              <p style={{ fontFamily: FF }} className="mt-0.5 text-[16px] font-bold text-spal-navy leading-snug">{m.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
