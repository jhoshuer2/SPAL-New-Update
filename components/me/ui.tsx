"use client";
// Small building blocks for the Me screens.
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight01Icon } from "hugeicons-react";
import { FF, cardCls } from "@/components/journey/ui";

export type MeData = {
  id: string; email: string | null; full_name: string | null; display_name: string | null; bio: string | null; avatar_url: string | null;
  business_name: string | null; business_type: string | null; state: string | null; city: string | null; current_level: number; language: string;
  profile_visibility: "public" | "hidden" | "connections"; anonymous_default: boolean; memory_paused: boolean; show_amounts_in_notifications: boolean;
  checkin_frequency: string; checkin_time: string; hard_season: boolean;
};

export type MeState = { status: "loading" } | { status: "error" } | { status: "ready"; me: MeData };
export function useMe() {
  const [state, setState] = useState<MeState>({ status: "loading" });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/me").then((r) => r.json()).then((j) => { if (live) setState(j.success ? { status: "ready", me: j.data } : { status: "error" }); }).catch(() => live && setState({ status: "error" }));
    return () => { live = false; };
  }, [n]);
  return { state, reload: () => setN((x) => x + 1), set: (patch: Partial<MeData>) => setState((s) => (s.status === "ready" ? { status: "ready", me: { ...s.me, ...patch } } : s)) };
}

/** Save a setting. Resolves to an error message, or null on success. */
export async function patchMe(body: object): Promise<string | null> {
  try { const j = await (await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(); return j.success ? null : j.error ?? "Could not save."; }
  catch { return "No connection. Please try again."; }
}

export function Row({ title, sub, href, onClick, danger }: { title: string; sub?: string; href?: string; onClick?: () => void; danger?: boolean }) {
  const inner = (<>
    <span className="flex-1 min-w-0"><span style={{ fontFamily: FF }} className={`block text-[16px] font-bold ${danger ? "text-red-600" : "text-spal-navy"}`}>{title}</span>{sub && <span className="block text-[13px] text-neutral-500 leading-snug">{sub}</span>}</span>
    <ArrowRight01Icon size={18} color="#A1A1AA" />
  </>);
  const cls = "w-full min-h-[60px] py-2.5 flex items-center gap-3 text-left active:opacity-70";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export function Group({ children }: { children: ReactNode }) { return <div className={`${cardCls} px-4 divide-y divide-neutral-100`}>{children}</div>; }

export function Toggle({ label, hint, on, onChange, disabled }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className="w-full min-h-[60px] py-2.5 flex items-center justify-between gap-3 text-left disabled:opacity-50">
      <span><span style={{ fontFamily: FF }} className="block text-[16px] font-bold text-spal-navy">{label}</span>{hint && <span className="block text-[13px] text-neutral-500 leading-snug">{hint}</span>}</span>
      <span aria-hidden className={`w-12 h-7 rounded-full p-0.5 shrink-0 transition-colors ${on ? "bg-spal-navy" : "bg-neutral-300"}`}><span className={`block w-6 h-6 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  );
}

export function Notice({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <p role={ok ? "status" : "alert"} className={`text-[14px] leading-snug ${ok ? "text-spal-green-700" : "text-red-600"}`}>{children}</p>;
}

export const inputCls = "w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy";
export const primaryCls = "w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform";
