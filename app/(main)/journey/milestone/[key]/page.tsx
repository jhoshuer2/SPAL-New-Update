"use client";
// D03 Milestone detail: what and why, ask Spal, and mark complete with optional proof.
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJourney } from "@/components/journey/useJourney";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, TopBar, cardCls, formatDate } from "@/components/journey/ui";
import { canCompleteManually } from "@/lib/engine/milestones";

const HOW: Record<string, string> = {
  manual: "You tell Spal when this is done. Add a note if you'd like to remember how.",
  spal: "Spal will notice this as you chat and check in, then ask you to confirm. You can also mark it done yourself.",
  data: "This completes on its own as you record sales and expenses in Spal.",
};

export default function MilestoneDetail({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const router = useRouter();
  const { state, reload } = useJourney();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function act(undo = false) {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/journey/milestones/${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proofNote: note, undo }) });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      if (j.data.gateway) router.replace("/level-up"); else { reload(); }
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <div data-testid="screen-D03" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Milestone" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {state.status === "ready" && (() => {
        const m = state.data.milestones.find((x) => x.key === key);
        if (!m) return <ErrorBlock message="We couldn't find that milestone." />;
        const manual = canCompleteManually(m, state.data.level);
        return (
          <div className="px-5">
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-[0.08em]">Level {m.level}{m.is_gateway ? " · Gateway" : ""}</p>
            <h1 style={{ fontFamily: FF }} className="mt-1 text-[28px] leading-[1.1] font-bold text-spal-navy tracking-tight">{m.title}</h1>

            <div className={`${cardCls} mt-5 p-4`}>
              <p className="text-[13px] font-medium text-neutral-500">Status</p>
              <p style={{ fontFamily: FF }} className="text-[17px] font-bold text-spal-navy">
                {m.status === "done" ? `Done${m.completed_at ? ` · ${formatDate(m.completed_at)}` : ""}` : m.status === "locked" ? `Locked until Level ${m.level}` : "In progress"}
              </p>
              <p className="mt-2 text-[14px] text-neutral-600 leading-snug">{HOW[m.completion_type] ?? ""}</p>
              {m.is_gateway && <p className="mt-2 text-[14px] text-spal-green-700 leading-snug">Finishing this one opens Level {m.level + 1}.</p>}
            </div>

            <Link href={`/ask?prompt=${encodeURIComponent(`Help me with this milestone: ${m.title}`)}`} className={`${cardCls} mt-3 p-4 flex items-center justify-between active:scale-[0.99] transition-transform`}>
              <span><span style={{ fontFamily: FF }} className="block text-[15px] font-bold text-spal-navy">Ask Spal for help</span><span className="text-[13px] text-neutral-500">Get ideas for the next step</span></span>
              <span aria-hidden className="text-neutral-400">›</span>
            </Link>

            {manual && m.status !== "done" && (
              <div className="mt-5">
                <label className="block text-[13px] font-medium text-neutral-600 mb-1.5" htmlFor="note">Add a note (optional)</label>
                <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="How did it go?" maxLength={500}
                  className="w-full rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
                <button type="button" disabled={busy} onClick={() => act(false)} style={{ fontFamily: FF }}
                  className="mt-4 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:opacity-60 active:scale-[0.98] transition-transform">
                  {busy ? "Saving…" : "Mark as done"}
                </button>
              </div>
            )}
            {manual && m.status === "done" && (
              <button type="button" disabled={busy} onClick={() => act(true)} className="mt-5 w-full h-12 text-[15px] font-medium text-neutral-600 active:opacity-60">Not done after all</button>
            )}
            {m.status === "locked" && <p className="mt-5 text-[14px] text-neutral-600">You can read ahead, and it opens when you reach Level {m.level}.</p>}
            {err && <p role="alert" className="mt-3 text-[14px] text-red-600">{err}</p>}
          </div>
        );
      })()}
    </div>
  );
}
