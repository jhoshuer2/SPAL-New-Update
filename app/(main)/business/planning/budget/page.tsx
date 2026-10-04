"use client";
// E04 Startup budget: what you need, what you already have, the gap, and ways to close it.
import { useMemo, useState } from "react";
import Link from "next/link";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { ConfirmMilestone, KoboField, Primary, usePlanning, type Planning } from "@/components/planning/shared";
import { budgetGap, waysToClose, type BudgetItem } from "@/lib/engine/planning";
import { formatNaira } from "@/lib/utils/kobo";

function BudgetBody({ data, reload }: { data: Planning; reload: () => void }) {
  const [items, setItems] = useState<BudgetItem[]>(data.budget?.items ?? []);
  const [available, setAvailable] = useState<number | null>(data.budget?.available_kobo ?? 0);
  const [name, setName] = useState("");
  const [cost, setCost] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [fieldKey, setFieldKey] = useState(0); // resets the add-item money field


  const result = useMemo(() => budgetGap(items, available ?? 0), [items, available]);
  const ways = useMemo(() => waysToClose(items, available ?? 0, formatNaira), [items, available]);

  function add() {
    if (!name.trim() || cost === null || cost <= 0) return setErr("Add what you need and roughly what it costs.");
    setErr(""); setSaved(false);
    setItems([...items, { id: crypto.randomUUID(), name: name.trim(), cost_kobo: cost, have: false }]);
    setName(""); setCost(null); setFieldKey((k) => k + 1);
  }
  async function save() {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch("/api/planning/budget", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, available_kobo: available ?? 0 }) })).json();
      if (!j.success) throw new Error(j.error);
      setSaved(true); reload();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <>
      {(
        <>
          <div className="px-5">
            <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">What do you need to start?</h1>
            <p className="mt-1 text-[14px] text-neutral-600">List what you&apos;d buy, tick what you already have, and I&apos;ll show the gap.</p>
          </div>

          <Section title="Things you need">
            {items.length === 0 ? <p className="text-[14px] text-neutral-600">Nothing yet. Add your first item below.</p> : (
              <ul className={`${cardCls} px-4 divide-y divide-neutral-100`}>
                {items.map((i) => (
                  <li key={i.id} className="py-3 flex items-center gap-3">
                    <button type="button" role="checkbox" aria-checked={i.have} aria-label={`I already have ${i.name}`} onClick={() => { setSaved(false); setItems(items.map((x) => (x.id === i.id ? { ...x, have: !x.have } : x))); }} className="w-11 h-11 -ml-2 flex items-center justify-center">
                      <span aria-hidden className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-[13px] ${i.have ? "bg-[#22C55E] border-[#22C55E] text-white" : "border-neutral-300"}`}>{i.have ? "✓" : ""}</span>
                    </button>
                    <span className="flex-1 min-w-0"><span className={`block text-[15px] ${i.have ? "text-neutral-500 line-through" : "text-spal-navy font-medium"}`}>{i.name}</span><span className="block text-[12px] text-neutral-500">{i.have ? "Already have" : "Need to buy"}</span></span>
                    <span className="text-[15px] font-bold text-spal-navy tabular-nums">{formatNaira(i.cost_kobo)}</span>
                    <button type="button" aria-label={`Remove ${i.name}`} onClick={() => { setSaved(false); setItems(items.filter((x) => x.id !== i.id)); }} className="min-h-11 px-1 text-[13px] text-neutral-500 active:opacity-60">✕</button>
                  </li>
                ))}
              </ul>
            )}
            <div className={`${cardCls} mt-3 p-4 space-y-3`}>
              <label className="block text-[12px] text-neutral-500">Item<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Gas cooker" className="mt-1 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>
              <KoboField key={fieldKey} label="Cost" kobo={cost} onChange={setCost} />
              <button type="button" onClick={add} className="h-11 px-5 rounded-full bg-spal-navy text-white text-[14px] font-bold active:scale-95 transition-transform">Add item</button>
            </div>
          </Section>

          <Section title="What you've set aside">
            <KoboField label="Money you have ready for this" kobo={available} onChange={(k) => { setAvailable(k ?? 0); setSaved(false); }} />
          </Section>

          {items.length > 0 && (
            <Section title="The gap">
              <div className={`${cardCls} p-4`} aria-live="polite">
                <dl className="space-y-1.5 text-[15px]">
                  <div className="flex justify-between"><dt className="text-neutral-600">Total you need</dt><dd className="font-bold text-spal-navy tabular-nums">{formatNaira(result.total)}</dd></div>
                  <div className="flex justify-between"><dt className="text-neutral-600">Already have</dt><dd className="tabular-nums text-spal-navy">{formatNaira(result.haveValue)}</dd></div>
                  <div className="flex justify-between"><dt className="text-neutral-600">Still to buy</dt><dd className="tabular-nums text-spal-navy">{formatNaira(result.toBuy)}</dd></div>
                  <div className="flex justify-between"><dt className="text-neutral-600">Money set aside</dt><dd className="tabular-nums text-spal-navy">{formatNaira(result.available)}</dd></div>
                </dl>
                <p style={{ fontFamily: FF }} className={`mt-3 pt-3 border-t border-neutral-100 text-[20px] font-bold ${result.covered ? "text-spal-green-700" : "text-spal-navy"}`}>{result.covered ? "You're covered. Time to plan the launch." : `You're ${formatNaira(result.gap)} short`}</p>
              </div>
              {ways.length > 0 && (
                <div className="mt-3 space-y-2.5">
                  <p className="text-[13px] font-medium text-neutral-600">Ways to close it</p>
                  {ways.map((w) => <div key={w.key} className={`${cardCls} p-4`}><p style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">{w.title}</p><p className="text-[14px] text-neutral-600 leading-snug">{w.body}</p></div>)}
                </div>
              )}
            </Section>
          )}

          <div className="px-5 mt-6">
            {err && <p role="alert" className="mb-3 text-[14px] text-red-600">{err}</p>}
            <Primary onClick={save} loading={busy} disabled={items.length === 0}>{saved ? "Saved ✓" : "Save my budget"}</Primary>
            {saved && items.length > 0 && <ConfirmMilestone keyName="l0_startup_budget" title="Set your startup budget" prompt="Budget saved. Want to tick off this milestone?" />}
            <Link href="/business/planning/launch" style={{ fontFamily: FF }} className="mt-4 flex h-14 items-center justify-center rounded-full bg-spal-navy text-white text-[16px] font-bold active:scale-[0.98] transition-transform">Next: launch plan</Link>
          </div>
        </>
      )}
    </>
  );
}

export default function Budget() {
  const { state, reload } = usePlanning();
  return (
    <div data-testid="screen-E04" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Startup budget" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && <BudgetBody data={state.data} reload={reload} />}
    </div>
  );
}
