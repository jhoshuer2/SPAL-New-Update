"use client";
// H07 What Spal knows: full transparency. Edit or delete any fact, or pause learning.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyBlock, ErrorBlock, FF, PendingBlock, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import type { MemoryCategory } from "@/lib/engine/spal";

type Fact = { id: string; fact: string; category: MemoryCategory; created_at: string };
const GROUPS: [MemoryCategory, string][] = [["person", "About you"], ["business", "Your business"], ["goal", "Your goals"], ["struggle", "What's been hard"], ["preference", "How you like things"], ["history", "Your story"]];

export default function WhatSpalKnows() {
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"ok" | "error" | "pending">("ok");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/spal/memory").then((r) => r.json()).then((j) => {
      if (!j.success) return setStatus("error");
      if (j.data.pending) return setStatus("pending");
      setStatus("ok"); setFacts(j.data.facts); setPaused(j.data.paused);
    }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    const before = facts;
    setFacts((f) => (f ?? []).filter((x) => x.id !== id)); // optimistic; restore on failure
    const j = await fetch(`/api/spal/memory/${id}`, { method: "DELETE" }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!j.success) { setFacts(before); setMsg("Couldn't delete that. Please try again."); }
  }
  async function saveEdit() {
    if (!editing) return;
    const j = await fetch(`/api/spal/memory/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fact: editing.text }) }).then((r) => r.json()).catch(() => ({ success: false, error: "Couldn't save." }));
    if (j.success) { setFacts((f) => (f ?? []).map((x) => (x.id === editing.id ? { ...x, fact: editing.text.trim() } : x))); setEditing(null); setMsg(""); }
    else setMsg(j.error ?? "Couldn't save.");
  }
  async function togglePause() {
    const next = !paused;
    setPaused(next);
    const j = await fetch("/api/spal/memory/pause", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paused: next }) }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!j.success) { setPaused(!next); setMsg("Couldn't change that. Please try again."); }
  }

  return (
    <div data-testid="screen-H07" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="What Spal knows" />
      <p className="px-5 text-[15px] text-neutral-600 leading-snug">Everything I&apos;ve learned about you and your business, in plain words. You&apos;re in charge: edit or delete anything.</p>

      {status === "error" && <ErrorBlock onRetry={load} />}
      {status === "pending" && <div className="px-5 mt-5"><PendingBlock /></div>}
      {status === "ok" && facts === null && <div className="mt-4"><ScreenSkeleton /></div>}
      {status === "ok" && facts !== null && (
        <>
          <div className="px-5 mt-5">
            <button type="button" role="switch" aria-checked={paused} onClick={togglePause} className={`${cardCls} w-full p-4 flex items-center justify-between text-left active:scale-[0.99] transition-transform`}>
              <span><span style={{ fontFamily: FF }} className="block text-[16px] font-bold text-spal-navy">Pause learning</span><span className="block text-[13px] text-neutral-500 leading-snug">{paused ? "I'm not learning new things. What I know stays until you delete it." : "I pick up new things as we talk."}</span></span>
              <span aria-hidden className={`ml-3 w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 ${paused ? "bg-spal-navy" : "bg-neutral-300"}`}><span className={`block w-6 h-6 rounded-full bg-white transition-transform ${paused ? "translate-x-5" : ""}`} /></span>
            </button>
          </div>
          {msg && <p role="alert" className="px-5 mt-3 text-[14px] text-red-600">{msg}</p>}

          {facts.length === 0 && <div className="px-5 mt-6"><EmptyBlock title="Nothing yet" body="As we talk and you check in, what I learn will show up here, and you can change any of it." href="/ask" cta="Talk to Spal" /></div>}
          {GROUPS.map(([cat, label]) => {
            const list = facts.filter((f) => f.category === cat);
            if (!list.length) return null;
            return (
              <Section key={cat} title={label}>
                <ul className={`${cardCls} px-4 divide-y divide-neutral-100`}>
                  {list.map((f) => (
                    <li key={f.id} className="py-3">
                      {editing?.id === f.id ? (
                        <div>
                          <textarea value={editing.text} onChange={(e) => setEditing({ id: f.id, text: e.target.value })} rows={2} maxLength={200} aria-label="Edit what Spal knows"
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-[15px] text-spal-navy outline-none focus:border-spal-navy" />
                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={saveEdit} className="h-10 px-4 rounded-full bg-[#22C55E] text-white text-[14px] font-bold">Save</button>
                            <button type="button" onClick={() => setEditing(null)} className="h-10 px-4 text-[14px] text-neutral-600">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <p className="flex-1 text-[15px] text-spal-navy leading-snug">{f.fact}</p>
                          <button type="button" onClick={() => setEditing({ id: f.id, text: f.fact })} className="min-h-11 px-2 text-[13px] font-medium text-neutral-500 active:opacity-60" aria-label={`Edit: ${f.fact}`}>Edit</button>
                          <button type="button" onClick={() => remove(f.id)} className="min-h-11 px-2 text-[13px] font-medium text-red-600 active:opacity-60" aria-label={`Delete: ${f.fact}`}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })}
          <p className="px-5 mt-6 text-[12px] text-neutral-500 leading-snug">I never keep health, religion, politics or account details. <Link href="/profile" className="underline">Privacy settings</Link></p>
        </>
      )}
    </div>
  );
}
