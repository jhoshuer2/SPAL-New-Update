"use client";
// Shared pieces for the planning studio: data hook, naira input with "45k" shorthand, milestone confirm.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, parseMoneyShorthand } from "@/lib/utils/kobo";
import { FF, cardCls } from "@/components/journey/ui";
import type { Checklist, Conversation, Idea, Week, BudgetItem, BudgetResult } from "@/lib/engine/planning";

export type Planning = {
  pending?: boolean;
  idea: { raw_text: string; summary: Idea; questions: string[]; alternatives: string[] } | null;
  validation: { checklist: Partial<Checklist>; customer_conversations: Conversation[]; summary: string | null; progress: { talked: number; steps: number; pct: number; talkedEnough: boolean } } | null;
  budget: { items: BudgetItem[]; available_kobo: number; result: BudgetResult } | null;
  launch: { weeks: Week[]; progress: { done: number; total: number; pct: number } } | null;
};
export type PlanningState = { status: "loading" } | { status: "error" } | { status: "pending" } | { status: "ready"; data: Planning };

export function usePlanning() {
  const [state, setState] = useState<PlanningState>({ status: "loading" });
  const load = useCallback(() => {
    fetch("/api/planning").then((r) => r.json()).then((j) => {
      if (!j.success) setState({ status: "error" });
      else if (j.data?.pending) setState({ status: "pending" });
      else setState({ status: "ready", data: j.data });
    }).catch(() => setState({ status: "error" }));
  }, []);
  useEffect(() => { load(); }, [load]);
  return { state, reload: load };
}

/** Naira input. Accepts "45k" / "1.5m" / "2,500". Reports whole kobo (null when empty or invalid). */
export function KoboField({ label, kobo, onChange, placeholder = "₦0, or try 45k" }: { label: string; kobo: number | null; onChange: (k: number | null) => void; placeholder?: string }) {
  const [text, setText] = useState(kobo ? String(kobo / 100) : "");
  const parsed = parseMoneyShorthand(text);
  const invalid = text.trim() !== "" && parsed === null;
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-medium text-neutral-600">{label}</span>
      <input inputMode="decimal" value={text} placeholder={placeholder}
        onChange={(e) => { setText(e.target.value); onChange(parseMoneyShorthand(e.target.value)); }}
        aria-invalid={invalid}
        className={`w-full min-h-[52px] rounded-2xl bg-white border px-4 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy ${invalid ? "border-red-400" : "border-neutral-200"}`} />
      <span className={`block mt-1 text-[12px] ${invalid ? "text-red-600" : "text-neutral-500"}`} aria-live="polite">
        {invalid ? "Try 2500 or 45k" : parsed !== null && text ? formatNaira(parsed) : " "}
      </span>
    </label>
  );
}

/** Spal never completes a milestone by itself: it asks, and the user confirms (spec §8.2). */
export function ConfirmMilestone({ keyName, title, prompt }: { keyName: string; title: string; prompt: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function go() {
    setState("busy");
    try {
      const j = await (await fetch(`/api/journey/milestones/${keyName}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).json();
      if (!j.success) throw new Error();
      setState("done");
      if (j.data?.gateway) router.push("/level-up");
    } catch { setState("error"); }
  }
  if (state === "done") return <p role="status" className="mt-4 rounded-2xl bg-spal-green-50 border border-spal-green-200 px-4 py-3 text-[14px] text-spal-green-700">Ticked off: {title}. Nice work.</p>;
  return (
    <div className={`${cardCls} mt-4 p-4`}>
      <p className="text-[14px] text-spal-navy leading-snug">{prompt}</p>
      <button type="button" onClick={go} disabled={state === "busy"} style={{ fontFamily: FF }} className="mt-3 h-11 px-5 rounded-full bg-spal-navy text-white text-[14px] font-bold disabled:opacity-60 active:scale-95 transition-transform">
        {state === "busy" ? "Saving…" : state === "error" ? "Couldn't save, tap to retry" : `Mark “${title}” done`}
      </button>
    </div>
  );
}

export const Primary = ({ children, onClick, disabled, loading }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; loading?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled || loading} style={{ fontFamily: FF }}
    className="w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform">
    {loading ? "Saving…" : children}
  </button>
);
