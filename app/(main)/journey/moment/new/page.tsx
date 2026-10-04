"use client";
// D06 Add moment: a win, struggle, lesson or decision. Private by default.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FF, TopBar } from "@/components/journey/ui";

const TAGS = [["win", "A win"], ["struggle", "A struggle"], ["lesson", "A lesson"], ["decision", "A decision"]] as const;

export default function AddMoment() {
  const router = useRouter();
  const [type, setType] = useState<(typeof TAGS)[number][0] | null>(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // One id per form so a retry after a flaky network cannot create a duplicate (idempotent).
  const [clientId] = useState(() => crypto.randomUUID());

  async function save() {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, text, occurredOn: date, clientId }) })).json();
      if (!j.success) throw new Error(j.error);
      router.replace("/journey/timeline");
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not save. Please try again."); setBusy(false); }
  }

  return (
    <div data-testid="screen-D06" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Add a moment" />
      <div className="px-5">
        <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">What happened?</h1>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} placeholder="Write a few words…" aria-label="What happened"
          className="mt-4 w-full rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />

        <p className="mt-5 mb-2 text-[13px] font-medium text-neutral-600">What kind of moment is it?</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)}
              className={`min-h-11 px-4 rounded-full text-[14px] font-medium border transition-colors ${type === k ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{l}</button>
          ))}
        </div>

        <label className="mt-5 block text-[13px] font-medium text-neutral-600" htmlFor="d">When</label>
        <input id="d" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-full h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" />

        <p className="mt-5 text-[13px] text-neutral-500 leading-snug">🔒 Only you can see this. Sharing to the community comes later, and it will always be your choice.</p>
        {err && <p role="alert" className="mt-3 text-[14px] text-red-600">{err}</p>}
        <button type="button" disabled={busy || !type || !text.trim()} onClick={save} style={{ fontFamily: FF }}
          className="mt-6 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform">
          {busy ? "Saving…" : "Save moment"}
        </button>
      </div>
    </div>
  );
}
