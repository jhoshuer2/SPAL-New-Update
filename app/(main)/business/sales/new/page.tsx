"use client";
// F03 Add sale: amount, item, qty, customer, how they paid, date. Saves on the phone first, so it works offline.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FF, TopBar, cardCls } from "@/components/journey/ui";
import { KoboField } from "@/components/planning/shared";
import { saveRecordOffline } from "@/lib/offline/sync";
import { parseQuickSale } from "@/lib/engine/quick-sale";
import { formatNaira } from "@/lib/utils/kobo";

const METHODS = [["cash", "Cash"], ["transfer", "Transfer"], ["pos", "POS"], ["credit", "Will pay later"]] as const;
type Method = (typeof METHODS)[number][0];
const today = () => new Date().toISOString().slice(0, 10);

export default function AddSale() {
  const router = useRouter();
  const [quick, setQuick] = useState("");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [kobo, setKobo] = useState<number | null>(null);
  const [fieldKey, setFieldKey] = useState(0);
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState<Method>("cash");
  const [dueOn, setDueOn] = useState("");
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);

  function fillFromQuick() {
    const p = parseQuickSale(quick);
    if (p.item) setItem(p.item);
    if (p.qty) setQty(String(p.qty));
    if (p.amountNaira) { setKobo(Math.round(p.amountNaira * 100)); setFieldKey((k) => k + 1); }
    if (!p.amountNaira) setErr("I couldn't find an amount. Try “sold 3 cartons for 45k”.");
    else setErr("");
  }

  async function save() {
    if (!kobo || kobo <= 0) return setErr("Enter the amount.");
    if (method === "credit" && !customer.trim()) return setErr("Who will pay later? Add their name so you can chase it.");
    setBusy(true); setErr("");
    const q = parseInt(qty, 10);
    await saveRecordOffline({
      type: "sale", amount: kobo / 100, // legacy records are numeric naira
      description: [Number.isFinite(q) && q > 0 ? `${q}` : "", item.trim()].filter(Boolean).join(" ") || "Sale",
      category: "Products", input_method: "quick", record_date: date,
      payment_method: method, payment_status: method === "credit" ? "owing" : "paid",
      customer_name: customer.trim() || undefined, due_on: method === "credit" && dueOn ? dueOn : undefined,
    });
    setDone(formatNaira(kobo));
    setBusy(false);
  }

  if (done) {
    return (
      <div data-testid="screen-F03" className="min-h-full bg-spal-bg px-5 pt-24 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-[30px]" aria-hidden>✓</div>
        <h1 style={{ fontFamily: FF }} className="mt-5 text-[28px] font-bold text-spal-navy">Sale saved</h1>
        <p className="mt-1 text-[16px] text-neutral-600">{done}{method === "credit" ? ", to be paid later" : ""}</p>
        <button type="button" onClick={() => router.replace("/business")} style={{ fontFamily: FF }} className="mt-8 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] active:scale-[0.98] transition-transform">Done</button>
        <button type="button" onClick={() => { setDone(null); setQuick(""); setItem(""); setQty(""); setKobo(null); setFieldKey((k) => k + 1); setCustomer(""); setMethod("cash"); setDueOn(""); }} className="mt-1 w-full h-12 text-[15px] font-medium text-neutral-600 active:opacity-60">Add another sale</button>
      </div>
    );
  }

  return (
    <div data-testid="screen-F03" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Add a sale" />
      <div className="px-5 space-y-5">
        <div className={`${cardCls} p-4`}>
          <label className="block text-[13px] font-medium text-neutral-600" htmlFor="quick">Type it like you&apos;d say it</label>
          <div className="mt-1.5 flex gap-2">
            <input id="quick" value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fillFromQuick()} placeholder="sold 3 cartons for 45k" className="flex-1 min-h-12 rounded-xl border border-neutral-200 px-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
            <button type="button" onClick={fillFromQuick} disabled={!quick.trim()} className="h-12 px-4 rounded-xl bg-spal-navy text-white text-[14px] font-bold disabled:opacity-40 active:scale-95 transition-transform">Fill in</button>
          </div>
        </div>

        <KoboField key={fieldKey} label="Amount" kobo={kobo} onChange={setKobo} />
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <label className="block text-[13px] font-medium text-neutral-600">What did you sell?<input value={item} onChange={(e) => setItem(e.target.value)} maxLength={80} placeholder="e.g. Jollof rice" className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>
          <label className="block text-[13px] font-medium text-neutral-600">Qty<input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="1" className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-neutral-600">How did they pay?</p>
          <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Payment method">
            {METHODS.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)} style={{ fontFamily: FF }}
                className={`min-h-[52px] rounded-2xl px-3 text-[15px] font-bold border transition-colors active:scale-[0.97] ${method === k ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{l}</button>
            ))}
          </div>
        </div>

        <label className="block text-[13px] font-medium text-neutral-600">Customer {method === "credit" ? "" : "(optional)"}<input value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={60} placeholder="Name" className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>
        {method === "credit" && <label className="block text-[13px] font-medium text-neutral-600">When will they pay? (optional)<input type="date" value={dueOn} min={today()} onChange={(e) => setDueOn(e.target.value)} className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>}
        <label className="block text-[13px] font-medium text-neutral-600">Date<input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="mt-1.5 w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" /></label>

        {err && <p role="alert" className="text-[14px] text-red-600">{err}</p>}
        <button type="button" onClick={save} disabled={busy || !kobo} style={{ fontFamily: FF }} className="w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform">{busy ? "Saving…" : "Save sale"}</button>
        <p className="text-center text-[12px] text-neutral-500">Saved on your phone first, so it works without network.</p>
      </div>
    </div>
  );
}
