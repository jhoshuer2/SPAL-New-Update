"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, Dish01Icon, UserSearch01Icon, Restaurant01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import { ORDER_TYPES, busyTables, type OrderType } from "@/lib/orders";
import type { BusinessRecord } from "@/lib/types";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";
const SHADOW = "0 1px 6px rgba(0,0,0,0.05)";
const MAX_TABLES = 60;

type Step = "type" | "setup" | "pick";

const TYPE_ICON: Record<OrderType, { Icon: typeof Dish01Icon; bg: string; color: string }> = {
  online: { Icon: Dish01Icon,        bg: "#E7F6EC", color: "#16A34A" },
  walkin: { Icon: UserSearch01Icon,  bg: "#FFF3EC", color: "#F97316" },
  table:  { Icon: Restaurant01Icon,  bg: "#F3EEFF", color: "#8B5CF6" },
};

function go(url: string) { window.location.href = url; }

// New Order: what kind of order is this, and (for a table) which table.
export default function NewOrderPage() {
  const { user, setUser } = useSPALStore();
  const [step, setStep]   = useState<Step>("type");
  const [type, setType]   = useState<OrderType | null>(null);
  const [tableInput, setTableInput] = useState("");
  const [table, setTable] = useState<number | null>(null);
  const [busy, setBusy]   = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const tableCount = user?.table_count ?? 0;
  const typed = Math.min(MAX_TABLES, Math.max(0, parseInt(tableInput, 10) || 0));

  // Which tables are already being served.
  useEffect(() => {
    if (step !== "pick") return;
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    fetch(`/api/records?type=sale&start_date=${from}&limit=500`).then((r) => r.json())
      .then((d) => { if (d.success) setBusy(busyTables(d.data as BusinessRecord[])); })
      .catch(() => {});
  }, [step]);

  function next() {
    if (!type) return;
    if (type !== "table") { go(`/sell?type=${type}`); return; }
    setStep(tableCount > 0 ? "pick" : "setup");
  }

  function back() {
    if (step === "type") { go("/orders"); return; }
    if (step === "pick") { setStep("type"); return; }
    setStep(tableCount > 0 ? "pick" : "type");
  }

  async function saveTables() {
    if (typed < 1 || saving) return;
    setSaving(true); setError("");
    try {
      const d = await fetch("/api/user/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_count: typed }),
      }).then((r) => r.json());
      if (!d.success) throw new Error();
      if (user) setUser({ ...user, table_count: typed });
      setTable(null);
      setStep("pick");
    } catch {
      setError("Couldn't save your tables. Please try again.");
    } finally { setSaving(false); }
  }

  const Title = step === "type" ? "New Order" : "Table Order";

  return (
    <div className="min-h-full pb-40" style={{ background: BG, fontFamily: FF }}>
      <div className="px-5 pt-12">
        <button onClick={back} aria-label="Go back" className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[32px] font-black text-spal-navy mt-6">{Title}</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="px-5 mt-8"
        >
          {step === "type" && (
            <>
              <p className="text-[20px] font-black text-spal-navy mb-4">What type of order is this?</p>
              <div className="space-y-3" role="radiogroup" aria-label="Order type">
                {ORDER_TYPES.map((o) => {
                  const on = type === o.key;
                  const { Icon, bg, color } = TYPE_ICON[o.key];
                  return (
                    <button
                      key={o.key}
                      role="radio" aria-checked={on} aria-label={o.label}
                      onClick={() => setType(o.key)}
                      className="w-full text-left bg-white rounded-2xl px-4 py-4 min-h-[76px] flex items-center gap-3.5 active:scale-[0.99] transition-transform"
                      style={{ boxShadow: SHADOW, border: on ? "2px solid #22C55E" : "2px solid transparent" }}
                    >
                      <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        <Icon size={21} color={color} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[18px] font-black text-spal-navy">{o.label}</span>
                        <span className="block text-[14px] text-neutral-500 leading-snug">{o.hint}</span>
                      </span>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `2px solid ${on ? "#9CA3AF" : "#9CA3AF"}` }}>
                        {on && <span className="w-3 h-3 rounded-full" style={{ background: "#22C55E" }} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "setup" && (
            <>
              <p className="text-[18px] font-black text-spal-navy mb-3">How many tables do you have?</p>
              <input
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value.replace(/\D/g, "").slice(0, 2))}
                inputMode="numeric"
                placeholder="Enter number of table"
                aria-label="Number of tables"
                autoFocus
                className="w-full rounded-2xl px-4 text-[18px] text-spal-navy outline-none placeholder:text-neutral-400"
                style={{ height: 60, background: "#fff", boxShadow: tableInput ? "0 0 0 2px #22C55E" : SHADOW }}
              />
              {typed > 0 && (
                <>
                  <p className="text-[16px] font-black text-spal-navy mt-6 mb-3">Table Schema</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: typed }, (_, i) => i + 1).map((n) => (
                      <div key={n} className="bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5" style={{ height: 96, boxShadow: SHADOW }}>
                        <span className="text-[20px] font-black text-spal-navy">Table {n}</span>
                        <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#EAF0FC", color: "#2563EB" }}>Free</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {error && <p role="alert" className="text-[14px] font-semibold text-red-600 mt-4">{error}</p>}
            </>
          )}

          {step === "pick" && (
            <>
              <p className="text-[18px] font-black text-spal-navy mb-3">Which table are you serving?</p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Table">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => {
                  const on = table === n;
                  const isBusy = busy.has(n) || on;
                  return (
                    <button
                      key={n}
                      role="radio" aria-checked={on} aria-label={`Table ${n}, ${isBusy ? "preparing" : "free"}`}
                      onClick={() => setTable(n)}
                      className="bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                      style={{ height: 96, boxShadow: SHADOW, border: on ? "2px solid #22C55E" : "2px solid transparent" }}
                    >
                      <span className="text-[20px] font-black text-spal-navy">Table {n}</span>
                      <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full" style={isBusy ? { background: "#FFF3EC", color: "#F97316" } : { background: "#EAF0FC", color: "#2563EB" }}>
                        {isBusy ? "Preparing" : "Free"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { setTableInput(String(tableCount)); setStep("setup"); }} aria-label="Change number of tables" className="mt-5 h-12 px-2 text-[14px] font-bold" style={{ color: "#16A34A" }}>
                Change number of tables
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Primary action */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 z-30" style={{ background: BG, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        {step === "setup" ? (
          <PrimaryButton label={saving ? "Saving..." : "Save & Next"} enabled={typed > 0 && !saving} onClick={saveTables} />
        ) : step === "pick" ? (
          <PrimaryButton label="Next" enabled={table != null} onClick={() => table != null && go(`/sell?type=table&table=${table}`)} />
        ) : (
          <PrimaryButton label="Next" enabled={!!type} onClick={next} />
        )}
      </div>
    </div>
  );
}

function PrimaryButton({ label, enabled, onClick }: { label: string; enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      aria-label={label}
      className="w-full rounded-full font-black text-[18px] active:scale-[0.99] transition-all"
      style={{ height: 60, background: enabled ? "#22C55E" : "#E4E4E7", color: enabled ? "#fff" : "#8A8A93" }}
    >
      {label}
    </button>
  );
}
