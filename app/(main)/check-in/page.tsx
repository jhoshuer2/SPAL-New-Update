"use client";
// C02 Daily check-in (H06 detail): one tailored question a day. Tap or write; never a streak that breaks.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpalSymbol } from "@/components/brand/SpalSymbol";
import { useCheckin } from "@/components/spal/useCheckin";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, TopBar, cardCls } from "@/components/journey/ui";

export default function CheckIn() {
  const router = useRouter();
  const { state, reload } = useCheckin();
  const [choice, setChoice] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function submit(id: string) {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch(`/api/checkins/${id}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice, text }) })).json();
      if (!j.success) throw new Error(j.error);
      setReply(j.data.reply);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <div data-testid="screen-C02" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Check-in" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && (() => {
        const c = state.data;
        // Answered just now, or earlier today
        if (reply || c.answered) {
          return (
            <div className="px-5 pt-6 text-center">
              <div className="flex justify-center"><SpalSymbol symbol="focus" size={72} /></div>
              <h1 style={{ fontFamily: FF }} className="mt-5 text-[24px] leading-tight font-bold text-spal-navy">{reply ?? "You&apos;ve already checked in today."}</h1>
              {c.daysThisWeek !== null && <p className="mt-2 text-[14px] text-neutral-600">You&apos;ve checked in on {reply && !c.answered ? c.daysThisWeek + 1 : c.daysThisWeek} of the last 7 days.</p>}
              <button type="button" onClick={() => router.replace("/home")} style={{ fontFamily: FF }} className="mt-8 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] active:scale-[0.98] transition-transform">Back to home</button>
              <button type="button" onClick={() => router.push("/ask")} className="mt-1 w-full h-12 text-[15px] font-medium text-neutral-600 active:opacity-60">Talk to Spal about it</button>
            </div>
          );
        }
        return (
          <div className="px-5">
            <div className={`${cardCls} p-5`}>
              <p className="flex items-center gap-2 text-[12px] font-medium text-neutral-500 uppercase tracking-[0.08em]"><span aria-hidden className="w-2 h-2 rounded-full bg-[#22C55E]" />Spal asks</p>
              <h1 style={{ fontFamily: FF }} className="mt-2 text-[24px] leading-[1.15] font-bold text-spal-navy tracking-tight">{c.question}</h1>
              <p className="mt-2 text-[13px] text-neutral-500 leading-snug"><span className="font-medium">Why I&apos;m asking:</span> {c.why}</p>
            </div>

            {c.choices.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Quick answers">
                {c.choices.map((ch) => (
                  <button key={ch} type="button" aria-pressed={choice === ch} onClick={() => setChoice(choice === ch ? null : ch)} style={{ fontFamily: FF }}
                    className={`min-h-14 rounded-2xl px-3 text-[16px] font-bold border transition-colors active:scale-[0.97] ${choice === ch ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{ch}</button>
                ))}
              </div>
            )}

            <label htmlFor="ans" className="block mt-5 mb-1.5 text-[13px] font-medium text-neutral-600">{c.choices.length ? "Anything to add? (optional)" : "Your answer"}</label>
            <textarea id="ans" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder="Write a few words…"
              className="w-full rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
            <p className="mt-2 text-[12px] text-neutral-500">🔒 Private to you. Spal uses it to understand your business better.</p>
            {err && <p role="alert" className="mt-3 text-[14px] text-red-600">{err}</p>}
            <button type="button" disabled={busy || (!choice && !text.trim())} onClick={() => submit(c.id)} style={{ fontFamily: FF }}
              className="mt-5 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform">
              {busy ? "Saving…" : "Send to Spal"}
            </button>
            <button type="button" onClick={() => router.back()} className="mt-1 w-full h-12 text-[15px] font-medium text-neutral-600 active:opacity-60">Not now</button>
          </div>
        );
      })()}
    </div>
  );
}
