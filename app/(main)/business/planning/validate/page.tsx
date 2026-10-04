"use client";
// E03 Validate my idea: talk to 5 people (log each), check the rest, get Spal's recap.
import { useState } from "react";
import Link from "next/link";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, Section, TopBar, cardCls, formatDate } from "@/components/journey/ui";
import { ConfirmMilestone, usePlanning, type Planning } from "@/components/planning/shared";
import { CONVERSATIONS_NEEDED, type Checklist, type Conversation } from "@/lib/engine/planning";

const STEPS: { key: keyof Checklist; title: string; hint: string }[] = [
  { key: "competitors", title: "Check what others charge", hint: "Who else sells this, and for how much?" },
  { key: "price", title: "Test a price", hint: "Ask a real person to pay it. What happened?" },
  { key: "pilot", title: "Run a small pilot", hint: "Sell to 3 people before you spend big." },
];
const today = () => new Date().toISOString().slice(0, 10);

function ValidateBody({ data }: { data: Planning }) {
  const [convos, setConvos] = useState<Conversation[]>(data.validation?.customer_conversations ?? []);
  const [check, setCheck] = useState<Partial<Checklist>>(data.validation?.checklist ?? {});
  const [summary, setSummary] = useState<string | null>(data.validation?.summary ?? null);
  const [draft, setDraft] = useState({ name: "", said: "", date: today() });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");


  async function save(next: { c?: Conversation[]; k?: Partial<Checklist>; recap?: boolean }) {
    setBusy(true); setErr("");
    const c = next.c ?? convos, k = next.k ?? check;
    try {
      const j = await (await fetch("/api/planning/validation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversations: c, checklist: k, recap: next.recap }) })).json();
      if (!j.success) throw new Error(j.error);
      setConvos(c); setCheck(k); if (j.data.summary) setSummary(j.data.summary);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save. Please try again."); }
    setBusy(false);
  }
  const addConvo = () => {
    if (!draft.name.trim() || !draft.said.trim()) return setErr("Add who you spoke to and what they said.");
    save({ c: [...convos, { id: crypto.randomUUID(), ...draft }] });
    setDraft({ name: "", said: "", date: today() });
  };
  const setStep = (key: keyof Checklist, patch: Partial<{ done: boolean; note: string }>) => {
    const cur = check[key] ?? { done: false, note: "" };
    const k = { ...check, [key]: { ...cur, ...patch } };
    setCheck(k);
    if (patch.done !== undefined) save({ k });
  };

  const enough = convos.length >= CONVERSATIONS_NEEDED;
  return (
    <>
      {(
        <>
          <div className="px-5">
            <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">Test before you spend</h1>
            <p className="mt-1 text-[14px] text-neutral-600">Real people tell you things your imagination can&apos;t.</p>
          </div>

          <Section title={`Talk to ${CONVERSATIONS_NEEDED} possible customers`} action={<span className="text-[13px] font-bold text-spal-navy tabular-nums">{Math.min(convos.length, CONVERSATIONS_NEEDED)} of {CONVERSATIONS_NEEDED}</span>}>
            {convos.length > 0 && (
              <ul className={`${cardCls} px-4 divide-y divide-neutral-100 mb-3`}>
                {convos.map((c) => (
                  <li key={c.id} className="py-3 flex items-start gap-3">
                    <span className="flex-1 min-w-0"><span className="block text-[15px] font-bold text-spal-navy">{c.name} <span className="font-normal text-[12px] text-neutral-500">· {formatDate(c.date)}</span></span><span className="block text-[14px] text-neutral-600 leading-snug">{c.said}</span></span>
                    <button type="button" aria-label={`Remove ${c.name}`} onClick={() => save({ c: convos.filter((x) => x.id !== c.id) })} className="min-h-11 px-2 text-[13px] text-neutral-500 active:opacity-60">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <div className={`${cardCls} p-4 space-y-3`}>
              <label className="block text-[12px] text-neutral-500">Who did you speak to?<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={60} placeholder="e.g. Mrs Bello, my neighbour" className="mt-1 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>
              <label className="block text-[12px] text-neutral-500">What did they say?<textarea value={draft.said} onChange={(e) => setDraft({ ...draft, said: e.target.value })} rows={2} maxLength={500} className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>
              <label className="block text-[12px] text-neutral-500">When<input type="date" value={draft.date} max={today()} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="mt-1 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>
              <button type="button" onClick={addConvo} disabled={busy} className="h-11 px-5 rounded-full bg-spal-navy text-white text-[14px] font-bold disabled:opacity-60 active:scale-95 transition-transform">Add conversation</button>
            </div>
          </Section>

          <Section title="The rest of the checklist">
            <div className="space-y-3">
              {STEPS.map((s) => {
                const cur = check[s.key] ?? { done: false, note: "" };
                return (
                  <div key={s.key} className={`${cardCls} p-4`}>
                    <button type="button" role="checkbox" aria-checked={cur.done} onClick={() => setStep(s.key, { done: !cur.done })} className="w-full flex items-start gap-3 text-left min-h-11">
                      <span aria-hidden className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-[13px] ${cur.done ? "bg-[#22C55E] border-[#22C55E] text-white" : "border-neutral-300"}`}>{cur.done ? "✓" : ""}</span>
                      <span><span style={{ fontFamily: FF }} className="block text-[16px] font-bold text-spal-navy">{s.title}</span><span className="block text-[13px] text-neutral-500">{s.hint}</span></span>
                    </button>
                    <input aria-label={`Notes: ${s.title}`} value={cur.note} onChange={(e) => setStep(s.key, { note: e.target.value })} onBlur={() => save({})} maxLength={300} placeholder="What did you find?" className="mt-3 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="What you've learned">
            {summary ? <div className={`${cardCls} p-4 text-[15px] text-spal-navy leading-snug`}>{summary}</div> : <p className="text-[14px] text-neutral-600">Log a few conversations, then ask Spal to sum up what you heard.</p>}
            <div className="mt-3"><button type="button" disabled={busy || convos.length === 0} onClick={() => save({ recap: true })} className="h-11 px-5 rounded-full bg-white border border-neutral-200 text-[14px] font-bold text-spal-navy disabled:opacity-50 active:scale-95 transition-transform">{summary ? "Update Spal's summary" : "Ask Spal to sum it up"}</button></div>
          </Section>

          <div className="px-5">
            {err && <p role="alert" className="mt-3 text-[14px] text-red-600">{err}</p>}
            {enough && <ConfirmMilestone keyName="l0_talk_to_customers" title="Talk to 5 potential customers" prompt={`You've logged ${convos.length} conversations. Want to tick off this milestone?`} />}
            <div className="mt-5"><Link href="/business/planning/budget" style={{ fontFamily: FF }} className="flex h-14 items-center justify-center rounded-full bg-spal-navy text-white text-[16px] font-bold active:scale-[0.98] transition-transform">Next: startup budget</Link></div>
          </div>
        </>
      )}
    </>
  );
}

export default function Validate() {
  const { state, reload } = usePlanning();
  return (
    <div data-testid="screen-E03" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Validate my idea" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && <ValidateBody data={state.data} />}
    </div>
  );
}
