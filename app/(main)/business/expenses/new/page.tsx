"use client";
// F06 Add expense: amount, category, note, business or personal. Saves on the phone first, so it works offline.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FF, TopBar } from "@/components/journey/ui";
import { KoboField } from "@/components/planning/shared";
import { saveRecordOffline } from "@/lib/offline/sync";
import { formatNaira } from "@/lib/utils/kobo";

const CATS = ["Stock", "Transport", "Rent", "Salary", "Utilities", "Marketing", "Equipment", "Other"] as const;
const LABEL: Record<string, string> = { Salary: "Salaries", Utilities: "Data, airtime & bills" };
const today = () => new Date().toISOString().slice(0, 10);

export default function AddExpense() {
  const router = useRouter();
  const [kobo, setKobo] = useState<number | null>(null);
  const [fieldKey, setFieldKey] = useState(0);
  const [cat, setCat] = useState<(typeof CATS)[number]>("Stock");
  const [note, setNote] = useState("");
  const [personal, setPersonal] = useState(false);
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);

  async function save() {
    if (!kobo || kobo <= 0) return setErr("Enter the amount.");
    setBusy(true); setErr("");
    await saveRecordOffline({
      type: "expense", amount: kobo / 100, description: note.trim() || cat, category: cat,
      input_method: "quick", record_date: date, is_personal: personal || undefined, payment_status: "paid",
    });
    setDone(formatNaira(kobo)); setBusy(false);
  }

  if (done) {
    return (
      <div data-testid="screen-F06" className="min-h-full bg-spal-bg px-5 pt-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-spal-navy flex items-center justify-center text-white text-[30px]" aria-hidden>✓</div>
        <h1 style={{ fontFamily: FF }} className="mt-5 text-[28px] font-bold text-spal-navy">Expense saved</h1>
        <p className="mt-1 text-[16px] text-neutral-600">{done}{personal ? " · personal, not counted in your business" : ""}</p>
        <button type="button" onClick={() => router.replace("/business")} style={{ fontFamily: FF }} className="mt-8 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] active:scale-[0.98] transition-transform">Done</button>
        <button type="button" onClick={() => { setDone(null); setKobo(null); setFieldKey((k) => k + 1); setNote(""); setPersonal(false); }} className="mt-1 w-full h-12 text-[15px] font-medium text-neutral-600 active:opacity-60">Add another</button>
      </div>
    );
  }

  return (
    <div data-testid="screen-F06" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Add an expense" />
      <div className="px-5 space-y-5">
        <KoboField key={fieldKey} label="Amount" kobo={kobo} onChange={setKobo} />
        <div>
          <p className="mb-2 text-[13px] font-medium text-neutral-600">What was it for?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {CATS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)}
                className={`min-h-11 px-4 rounded-full text-[14px] font-medium border transition-colors active:scale-95 ${cat === c ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{LABEL[c] ?? c}</button>
            ))}
          </div>
        </div>
        <label className="block text-[13px] font-medium text-neutral-600">Note (optional)<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="e.g. 2 bags of rice" className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>
        <label className="block text-[13px] font-medium text-neutral-600">Date<input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>

        <button type="button" role="switch" aria-checked={personal} onClick={() => setPersonal(!personal)} className="w-full min-h-14 rounded-2xl bg-white border border-neutral-200 px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition-transform">
          <span><span style={{ fontFamily: FF }} className="block text-[15px] font-bold text-spal-navy">This was personal spending</span><span className="block text-[12px] text-neutral-500 leading-snug">Keeps it out of your business profit</span></span>
          <span aria-hidden className={`ml-3 w-12 h-7 rounded-full p-0.5 shrink-0 transition-colors ${personal ? "bg-spal-navy" : "bg-neutral-300"}`}><span className={`block w-6 h-6 rounded-full bg-white transition-transform ${personal ? "translate-x-5" : ""}`} /></span>
        </button>

        {err && <p role="alert" className="text-[14px] text-red-600">{err}</p>}
        <button type="button" onClick={save} disabled={busy || !kobo} style={{ fontFamily: FF }} className="w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform">{busy ? "Saving…" : "Save expense"}</button>
        <p className="text-center text-[12px] text-neutral-500">Saved on your phone first, so it works without network.</p>
      </div>
    </div>
  );
}
