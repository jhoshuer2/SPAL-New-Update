"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, Tick01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "₵" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
];

export default function ReceiptsTaxPage() {
  const router = useRouter();
  const { user, setUser } = useSPALStore();
  const [currency, setCurrency] = useState(user?.currency ?? "NGN");
  const [tax, setTax] = useState(user?.tax_rate != null ? String(user.tax_rate) : "7.5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (saving) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, tax_rate: parseFloat(tax) || 0 }),
      });
      const d = await res.json();
      if (d.success) {
        if (user) setUser({ ...user, ...d.data, tax_rate: parseFloat(tax) || 0 });
        window.location.href = "/profile";
        return;
      }
      setError(d.error || "Could not save"); setSaving(false);
    } catch { setError("Could not save"); setSaving(false); }
  }

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>Receipts & Tax</h1>
      </div>

      <div className="px-5 mt-4 space-y-6">
        {/* Currency */}
        <div>
          <p className="text-[15px] font-bold text-spal-navy mb-2.5" style={{ fontFamily: FF }}>Currency</p>
          <div className="space-y-2.5">
            {CURRENCIES.map((c) => {
              const on = currency === c.code;
              return (
                <button key={c.code} onClick={() => setCurrency(c.code)}
                  className="w-full flex items-center justify-between rounded-2xl px-4 h-16 active:scale-[0.99] transition-transform"
                  style={{ background: "#fff", border: on ? "2px solid #22C55E" : "2px solid transparent", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <span className="text-left">
                    <span className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: FF }}>{c.code}</span>
                    <span className="text-[13px] text-neutral-400 ml-2" style={{ fontFamily: FF }}>{c.label}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[18px] font-black" style={{ color: on ? "#16A34A" : "#C4CBD4" }}>{c.symbol}</span>
                    {on && (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                        <Tick01Icon size={14} color="#fff" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tax */}
        <div>
          <p className="text-[15px] font-bold text-spal-navy mb-2.5" style={{ fontFamily: FF }}>Tax rate (VAT)</p>
          <div className="flex items-center gap-2 rounded-2xl px-4 bg-white" style={{ height: 60, border: "1.5px solid #E5E7EB" }}>
            <input type="number" inputMode="decimal" min="0" step="0.1" value={tax} onChange={(e) => setTax(e.target.value)}
              placeholder="0" className="flex-1 bg-transparent outline-none text-[16px] font-semibold text-spal-navy" style={{ fontFamily: FF }} />
            <span className="text-[16px] font-bold text-neutral-400">%</span>
          </div>
          <p className="text-[12.5px] text-neutral-400 mt-2 px-1" style={{ fontFamily: FF }}>
            Applied to your sales at checkout. Set to 0 if you do not charge tax.
          </p>
        </div>

        {error && <p className="text-[13px] text-center" style={{ color: "#DC2626", fontFamily: FF }}>{error}</p>}
      </div>

      {/* Save (new button style) */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 pb-safe"
        style={{ bottom: 0, background: "linear-gradient(to top, #EDF3E8 78%, transparent)" }}>
        <button onClick={save} disabled={saving}
          className="w-full h-14 rounded-full text-white font-black text-[17px] active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{ background: "#22C55E", fontFamily: FF }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
