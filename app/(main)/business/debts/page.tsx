"use client";
// F13 Debts & credit: who owes you, and who you owe. Part payments, due dates, mark paid.
import { useCallback, useEffect, useState } from "react";
import { ErrorBlock, EmptyBlock, FF, ScreenSkeleton, TopBar, cardCls } from "@/components/journey/ui";
import { KoboField } from "@/components/planning/shared";
import { dueLabel, dueState } from "@/lib/engine/business";
import { formatNaira } from "@/lib/utils/kobo";

type OwedToMe = { id: string; customer: string; description: string | null; due_on: string | null; amount_kobo: number; paid_kobo: number; remaining_kobo: number };
type IOwe = { id: string; counterparty_name: string; note: string | null; due_on: string | null; amount_kobo: number; paid_kobo: number; remaining_kobo: number };
type Data = { today: string; owedToMe: OwedToMe[]; iOwe: IOwe[]; totals: { owedToMe: number; iOwe: number }; payablesReady: boolean };

const TONE = { overdue: "text-red-600", soon: "text-amber-700", later: "text-neutral-500", none: "text-neutral-500" } as const;

function DebtCard({ title, sub, total, paid, remaining, due, today, onPay, busy }: { title: string; sub?: string | null; total: number; paid: number; remaining: number; due: string | null; today: string; onPay: (kobo: number) => Promise<string | null>; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [kobo, setKobo] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const st = dueState(due, today);
  async function pay(k: number) { setMsg(""); const e = await onPay(k); if (e) setMsg(e); else { setOpen(false); setKobo(null); } }
  return (
    <li className={`${cardCls} p-4`}>
      <div className="flex items-start gap-3">
        <span className="flex-1 min-w-0"><span style={{ fontFamily: FF }} className="block text-[16px] font-bold text-spal-navy truncate">{title}</span>{sub && <span className="block text-[13px] text-neutral-500 truncate">{sub}</span>}<span className={`block text-[12px] mt-0.5 ${TONE[st]}`}>{dueLabel(due, today)}</span></span>
        <span className="text-right"><span style={{ fontFamily: FF }} className="block text-[18px] font-bold text-spal-navy tabular-nums">{formatNaira(remaining)}</span>{paid > 0 && <span className="block text-[12px] text-neutral-500">of {formatNaira(total)}</span>}</span>
      </div>
      {open ? (
        <div className="mt-3 space-y-2">
          <KoboField label="Amount received" kobo={kobo} onChange={setKobo} />
          <div className="flex gap-2">
            <button type="button" disabled={busy || !kobo} onClick={() => kobo && pay(kobo)} className="h-11 px-5 rounded-full bg-[#22C55E] text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-transform">Save payment</button>
            <button type="button" onClick={() => setOpen(false)} className="h-11 px-4 text-[14px] text-neutral-600">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={busy} onClick={() => pay(remaining)} className="h-11 px-4 rounded-full bg-spal-navy text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-transform">Mark paid</button>
          <button type="button" onClick={() => setOpen(true)} className="h-11 px-4 rounded-full bg-white border border-neutral-200 text-[14px] font-bold text-spal-navy active:scale-95 transition-transform">Part payment</button>
        </div>
      )}
      {msg && <p role="alert" className="mt-2 text-[13px] text-red-600">{msg}</p>}
    </li>
  );
}

export default function Debts() {
  const [tab, setTab] = useState<"owed" | "owe">("owed");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", due: "", note: "" });
  const [amount, setAmount] = useState<number | null>(null);
  const [formErr, setFormErr] = useState("");

  const load = useCallback(() => { fetch("/api/debts").then((r) => r.json()).then((j) => { if (j.success) { setErr(false); setData(j.data); } else setErr(true); }).catch(() => setErr(true)); }, []);
  useEffect(() => { load(); }, [load]);

  async function post(url: string, body: object): Promise<string | null> {
    setBusy(true);
    try { const j = await (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(); if (!j.success) return j.error ?? "Could not save."; load(); return null; }
    catch { return "No connection. Please try again."; } finally { setBusy(false); }
  }
  async function addPayable() {
    setFormErr("");
    const e = await post("/api/payables", { counterparty_name: form.name, amount_kobo: amount, due_on: form.due || undefined, note: form.note });
    if (e) return setFormErr(e);
    setAdding(false); setForm({ name: "", due: "", note: "" }); setAmount(null);
  }

  return (
    <div data-testid="screen-F13" className="min-h-full pb-nav bg-spal-bg">
      <TopBar title="Debts & credit" />
      {err && <ErrorBlock onRetry={load} />}
      {!err && !data && <ScreenSkeleton />}
      {!err && data && (
        <>
          <div className="px-5">
            <div className="flex bg-white rounded-full p-1 border border-neutral-200/70" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "owed"} onClick={() => setTab("owed")} className={`flex-1 min-h-11 rounded-full text-[14px] font-bold transition-colors ${tab === "owed" ? "bg-spal-navy text-white" : "text-neutral-500"}`}>Owed to me</button>
              <button type="button" role="tab" aria-selected={tab === "owe"} onClick={() => setTab("owe")} className={`flex-1 min-h-11 rounded-full text-[14px] font-bold transition-colors ${tab === "owe" ? "bg-spal-navy text-white" : "text-neutral-500"}`}>I owe</button>
            </div>
            <p className="mt-4 text-[13px] text-neutral-500">{tab === "owed" ? "Total waiting for you" : "Total you owe"}</p>
            <p style={{ fontFamily: FF }} className="text-[32px] leading-tight font-bold text-spal-navy tabular-nums">{formatNaira(tab === "owed" ? data.totals.owedToMe : data.totals.iOwe)}</p>
          </div>

          <ul className="px-5 mt-4 space-y-3">
            {tab === "owed" && (data.owedToMe.length === 0
              ? <li><EmptyBlock title="Nobody owes you right now" body="When you record a sale as “Will pay later”, it shows up here so you never forget." href="/business/sales/new" cta="Add a sale" /></li>
              : data.owedToMe.map((d) => <DebtCard key={d.id} title={d.customer} sub={d.description} total={d.amount_kobo} paid={d.paid_kobo} remaining={d.remaining_kobo} due={d.due_on} today={data.today} busy={busy} onPay={(k) => post(`/api/debts/${d.id}/pay`, { amount_kobo: k })} />))}
            {tab === "owe" && (data.iOwe.length === 0
              ? <li><EmptyBlock title="You don't owe anyone" body="Add money you owe a supplier so you can plan for it." /></li>
              : data.iOwe.map((d) => <DebtCard key={d.id} title={d.counterparty_name} sub={d.note} total={d.amount_kobo} paid={d.paid_kobo} remaining={d.remaining_kobo} due={d.due_on} today={data.today} busy={busy} onPay={(k) => post(`/api/payables/${d.id}/pay`, { amount_kobo: k })} />))}
          </ul>

          {tab === "owe" && (
            <div className="px-5 mt-5">
              {!data.payablesReady ? <p className="text-[13px] text-neutral-500">Tracking what you owe is being set up.</p> : adding ? (
                <div className={`${cardCls} p-4 space-y-3`}>
                  <label className="block text-[12px] text-neutral-500">Who do you owe?<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} className="mt-1 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>
                  <KoboField label="How much" kobo={amount} onChange={setAmount} />
                  <label className="block text-[12px] text-neutral-500">Due date (optional)<input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="mt-1 w-full min-h-11 rounded-xl border border-neutral-200 px-3 text-[15px] text-spal-navy outline-none focus:border-spal-navy" /></label>
                  {formErr && <p role="alert" className="text-[13px] text-red-600">{formErr}</p>}
                  <div className="flex gap-2"><button type="button" disabled={busy} onClick={addPayable} className="h-11 px-5 rounded-full bg-[#22C55E] text-white text-[14px] font-bold disabled:opacity-50">Add</button><button type="button" onClick={() => setAdding(false)} className="h-11 px-4 text-[14px] text-neutral-600">Cancel</button></div>
                </div>
              ) : <button type="button" onClick={() => setAdding(true)} style={{ fontFamily: FF }} className="w-full h-14 rounded-full bg-spal-navy text-white text-[16px] font-bold active:scale-[0.98] transition-transform">Add something I owe</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
