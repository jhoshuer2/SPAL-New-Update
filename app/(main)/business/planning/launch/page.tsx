"use client";
// E06 Launch plan: week by week to the first sale. Ticks save as you go.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { usePlanning } from "@/components/planning/shared";
import { launchProgress, type Week } from "@/lib/engine/planning";

/** First open: create the default plan (never overwrites an existing one), then hand it over. */
function CreatePlan({ onCreated }: { onCreated: (w: Week[]) => void }) {
  const [err, setErr] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/planning/launch", { method: "POST" }).then((r) => r.json())
      .then((j) => { if (!live) return; if (j.success) onCreated(j.data.weeks); else setErr(j.error ?? "Could not start your plan."); })
      .catch(() => live && setErr("Could not start your plan. Check your connection."));
    return () => { live = false; };
  }, [attempt, onCreated]);
  return err ? <ErrorBlock message={err} onRetry={() => { setErr(""); setAttempt((a) => a + 1); }} /> : <ScreenSkeleton />;
}

function LaunchEditor({ initial }: { initial: Week[] }) {
  const [weeks, setWeeks] = useState(initial);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(next: Week[]) {
    setSaving(true); setErr("");
    try {
      const j = await (await fetch("/api/planning/launch", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weeks: next }) })).json();
      if (!j.success) throw new Error(j.error);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Couldn't save that tick. Please try again."); }
    setSaving(false);
  }
  const toggle = (wi: number, id: string) => {
    const next = weeks.map((w, i) => (i !== wi ? w : { ...w, tasks: w.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
    setWeeks(next); persist(next);
  };
  const p = launchProgress(weeks);

  return (
    <>
      <div className="px-5">
        <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">Your road to a first sale</h1>
        <div className="mt-3 flex items-center gap-3"><span className="flex-1 h-2 rounded-full bg-white overflow-hidden" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Launch plan progress"><span className="block h-full bg-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${p.pct}%` }} /></span><span className="text-[13px] font-bold text-spal-navy tabular-nums">{p.done}/{p.total}</span></div>
        <p className="mt-1 h-4 text-[12px] text-neutral-500" aria-live="polite">{saving ? "Saving…" : ""}</p>
        {err && <p role="alert" className="text-[13px] text-red-600">{err}</p>}
      </div>
      {weeks.map((w, wi) => (
        <Section key={w.n} title={`Week ${w.n}: ${w.title}`}>
          <ul className={`${cardCls} px-4 divide-y divide-neutral-100`}>
            {w.tasks.map((t) => (
              <li key={t.id}>
                <button type="button" role="checkbox" aria-checked={t.done} onClick={() => toggle(wi, t.id)} className="w-full min-h-14 py-2 flex items-center gap-3 text-left">
                  <span aria-hidden className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-[13px] ${t.done ? "bg-[#22C55E] border-[#22C55E] text-white" : "border-neutral-300"}`}>{t.done ? "✓" : ""}</span>
                  <span className={`text-[15px] leading-snug ${t.done ? "text-neutral-500 line-through" : "text-spal-navy"}`}>{t.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <div className="px-5 mt-6 space-y-3">
        <Link href="/business/sales/new" style={{ fontFamily: FF }} className="flex h-14 items-center justify-center rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] active:scale-[0.98] transition-transform">Record my first sale</Link>
        <Link href="/journey/milestone/l0_first_sale" className="block text-center text-[14px] text-neutral-600 active:opacity-60">See the “first sale” milestone</Link>
      </div>
    </>
  );
}

function LaunchBody({ saved }: { saved: Week[] | null }) {
  const [created, setCreated] = useState<Week[] | null>(null);
  const weeks = saved ?? created;
  return weeks ? <LaunchEditor initial={weeks} /> : <CreatePlan onCreated={setCreated} />;
}

export default function Launch() {
  const { state, reload } = usePlanning();
  return (
    <div data-testid="screen-E06" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Launch plan" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && <LaunchBody saved={state.data.launch?.weeks.length ? state.data.launch.weeks : null} />}
    </div>
  );
}
