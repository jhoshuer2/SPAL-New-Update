"use client";
// H02 inline actions under a Spal reply. Spal only OFFERS these; nothing happens until the user taps.
import { useState } from "react";
import { describeDataRefs, type DataRef, type SpalAction } from "@/lib/engine/spal";
import { formatCurrency } from "@/lib/utils/currency";

const FF = "var(--font-satoshi)";

export function DataNote({ refs }: { refs?: DataRef[] }) {
  const text = describeDataRefs(refs ?? []);
  if (!text) return null;
  return <p className="mt-1.5 text-[12px] text-neutral-500 leading-snug">{text}</p>;
}

function Chip({ action }: { action: SpalAction }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function run() {
    setState("saving");
    try {
      const res = action.type === "save_goal"
        ? await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal_type: action.goal_type, target_amount: action.target_amount }) })
        : await fetch("/api/moments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: action.moment_type, text: action.text }) });
      const j = await res.json();
      setState(j.success ? "saved" : "error");
    } catch { setState("error"); }
  }

  const detail = action.type === "save_goal" ? `${action.goal_type.replace(/_/g, " ")} · ${formatCurrency(action.target_amount)}` : action.text.length > 48 ? `${action.text.slice(0, 48)}…` : action.text;
  return (
    <button type="button" onClick={run} disabled={state === "saving" || state === "saved"} style={{ fontFamily: FF }}
      className={`text-left min-h-11 rounded-2xl px-3.5 py-2 border text-[13px] leading-snug transition-colors active:scale-[0.98] ${state === "saved" ? "bg-spal-green-50 border-spal-green-200 text-spal-green-700" : "bg-white border-neutral-200 text-spal-navy"}`}>
      <span className="block font-bold">{state === "saved" ? "Saved" : state === "error" ? "Couldn't save, tap to retry" : state === "saving" ? "Saving…" : action.label}</span>
      <span className="block text-neutral-500 font-normal">{detail}</span>
    </button>
  );
}

export function ActionChips({ actions }: { actions?: SpalAction[] }) {
  if (!actions?.length) return null;
  return <div className="mt-2 flex flex-wrap gap-2">{actions.map((a, i) => <Chip key={i} action={a} />)}</div>;
}
