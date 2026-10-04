"use client";
// E02 My idea: describe it, Spal shapes it into a clear offer and asks sharper questions.
import { useState } from "react";
import Link from "next/link";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { ConfirmMilestone, Primary, usePlanning, type Planning } from "@/components/planning/shared";
import type { Idea } from "@/lib/engine/planning";

const FIELDS: [keyof Idea, string][] = [["customer", "Who it's for"], ["offer", "What you offer"], ["why", "Why it matters"]];

function IdeaBody({ data, reload }: { data: Planning; reload: () => void }) {
  const [text, setText] = useState(data.idea?.raw_text ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<Idea | null>(null);


  async function shape() {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch("/api/planning/idea", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })).json();
      if (!j.success) throw new Error(j.error);
      setEdit(null); reload();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save. Please try again."); }
    setBusy(false);
  }
  async function saveEdit() {
    if (!edit) return;
    setBusy(true); setErr("");
    try {
      const j = await (await fetch("/api/planning/idea", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: edit }) })).json();
      if (!j.success) throw new Error(j.error);
      setEdit(null); reload();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save."); }
    setBusy(false);
  }

  return (
    <>
      <div className="px-5">
        <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">What&apos;s your idea?</h1>
        <p className="mt-1 text-[14px] text-neutral-600">Say it however it comes. I&apos;ll help you make it clear.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} aria-label="Describe your idea" placeholder="e.g. I want to sell zobo and small chops to office workers on the Island…"
          className="mt-4 w-full rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
        {err && <p role="alert" className="mt-2 text-[14px] text-red-600">{err}</p>}
        <div className="mt-4"><Primary onClick={shape} disabled={text.trim().length < 8} loading={busy}>{data.idea ? "Shape it again" : "Shape my idea"}</Primary></div>
      </div>

      {data.idea && (() => {
        const idea = data.idea;
        return (
          <>
            <Section title="Your idea, in one line">
              <div className={`${cardCls} p-4`}>
                {edit ? (
                  <div className="space-y-3">
                    <textarea value={edit.oneLiner} onChange={(e) => setEdit({ ...edit, oneLiner: e.target.value })} rows={2} aria-label="One line summary" className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-[16px] outline-none focus:border-spal-navy" />
                    {FIELDS.map(([k, l]) => <label key={k} className="block text-[12px] text-neutral-500">{l}<input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="mt-1 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>)}
                    <div className="flex gap-2"><button type="button" onClick={saveEdit} disabled={busy} className="h-10 px-4 rounded-full bg-[#22C55E] text-white text-[14px] font-bold">Save</button><button type="button" onClick={() => setEdit(null)} className="h-10 px-4 text-[14px] text-neutral-600">Cancel</button></div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontFamily: FF }} className="text-[19px] leading-snug font-bold text-spal-navy">{idea.summary.oneLiner}</p>
                    <dl className="mt-3 space-y-2">
                      {FIELDS.filter(([k]) => idea.summary[k]).map(([k, l]) => <div key={k}><dt className="text-[12px] text-neutral-500">{l}</dt><dd className="text-[15px] text-spal-navy leading-snug">{idea.summary[k]}</dd></div>)}
                    </dl>
                    <button type="button" onClick={() => setEdit(idea.summary)} className="mt-3 min-h-11 text-[13px] font-medium text-neutral-500 active:opacity-60">Edit</button>
                  </>
                )}
              </div>
            </Section>

            {idea.questions.length > 0 && (
              <Section title="Questions to sharpen it">
                <ul className="space-y-2">{idea.questions.map((q) => <li key={q} className={`${cardCls} px-4 py-3 text-[15px] text-spal-navy leading-snug`}>{q}</li>)}</ul>
                <Link href={`/ask?prompt=${encodeURIComponent(`Help me sharpen my business idea: ${idea.summary.oneLiner}`)}`} className="mt-3 block text-[14px] font-medium text-spal-navy underline">Talk it through with Spal</Link>
              </Section>
            )}
            {idea.alternatives.length > 0 && (
              <Section title="Other angles to consider">
                <ul className="space-y-2">{idea.alternatives.map((a) => <li key={a} className={`${cardCls} px-4 py-3 text-[15px] text-spal-navy leading-snug`}>{a}</li>)}</ul>
              </Section>
            )}
            <div className="px-5">
              <ConfirmMilestone keyName="l0_describe_idea" title="Describe your idea in one sentence" prompt="Happy with your one-line summary? Tick off this milestone." />
              <Link href="/business/planning/validate" style={{ fontFamily: FF }} className="mt-4 flex h-14 items-center justify-center rounded-full bg-spal-navy text-white text-[16px] font-bold active:scale-[0.98] transition-transform">Next: validate my idea</Link>
            </div>
          </>
        );
      })()}
    </>
  );
}

export default function MyIdea() {
  const { state, reload } = usePlanning();
  return (
    <div data-testid="screen-E02" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="My idea" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && <IdeaBody data={state.data} reload={reload} />}
    </div>
  );
}
