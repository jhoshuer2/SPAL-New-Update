"use client";
// L07 Help & feedback: FAQs, send feedback, report a bug.
import { useState } from "react";
import { FF, Section, TopBar, cardCls } from "@/components/journey/ui";
import { inputCls, Notice, primaryCls } from "@/components/me/ui";
import { FAQS } from "@/lib/content/faq";

const KINDS = [["feedback", "Feedback"], ["bug", "Report a bug"], ["support", "I need help"]] as const;

export default function Help() {
  const [open, setOpen] = useState<number | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>("feedback");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function send() {
    setBusy(true); setMsg(null);
    try {
      const j = await (await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, message: text }) })).json();
      if (!j.success) throw new Error(j.error);
      setText(""); setMsg({ ok: true, t: "Thank you. We read every message." });
    } catch (e) { setMsg({ ok: false, t: e instanceof Error && e.message ? e.message : "Could not send that. Your message is still here, so try again." }); }
    setBusy(false);
  }
  return (
    <div data-testid="screen-L07" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Help & feedback" />
      <Section title="Common questions">
        <ul className={`${cardCls} px-4 divide-y divide-neutral-100`}>
          {FAQS.map((f, i) => (
            <li key={f.q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="w-full min-h-14 py-3 flex items-center justify-between gap-3 text-left">
                <span style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">{f.q}</span><span aria-hidden className="text-neutral-400 text-[18px]">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="pb-4 -mt-1 text-[14px] text-neutral-700 leading-relaxed">{f.a}</p>}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Tell us">
        <div className={`${cardCls} p-4 space-y-3`}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What is this about">
            {KINDS.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`min-h-11 px-4 rounded-full border text-[14px] font-medium ${kind === k ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{l}</button>)}
          </div>
          <label className="block text-[13px] font-medium text-neutral-600">{kind === "bug" ? "What went wrong? What did you expect?" : kind === "support" ? "How can we help?" : "What's on your mind?"}<textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} className={`${inputCls} mt-1.5 py-3`} /></label>
          <p className="text-[12px] text-neutral-500 leading-snug">Please don&apos;t include passwords or bank details.</p>
          {msg && <Notice ok={msg.ok}>{msg.t}</Notice>}
          <button type="button" onClick={send} disabled={busy || text.trim().length < 3} style={{ fontFamily: FF }} className={primaryCls}>{busy ? "Sending…" : "Send"}</button>
        </div>
      </Section>
    </div>
  );
}
