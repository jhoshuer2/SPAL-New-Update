"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, Mic01Icon, Cancel01Icon, Clock01Icon, ReceiptDollarIcon, Restaurant01Icon, Tick01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { DateTimePicker } from "@/components/shared/DateTimePicker";

const BG = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

type Status = "idle" | "recording" | "processing" | "done";

interface ParsedItem {
  type: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
  category: string;
}

const BAR_COUNT = 20;

// Broad synonym sets so the AI's label doesn't have to be exact
const SALE_TYPES    = new Set(["sale", "sales", "sell", "sold", "selling", "revenue", "income", "earned", "earn"]);
const EXPENSE_TYPES = new Set(["expense", "expenses", "bought", "buy", "purchase", "purchased", "spent", "spend", "paid", "pay", "cost"]);

function isSale   (t: string) { return SALE_TYPES.has(t.toLowerCase().trim()); }
function isExpense(t: string) { return EXPENSE_TYPES.has(t.toLowerCase().trim()); }

export default function VoiceEntryPage() {
  const router = useRouter();
  const { bumpRecordSaved } = useSPALStore();

  const [date,          setDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [status,        setStatus]       = useState<Status>("idle");
  const [elapsed,       setElapsed]      = useState(0);
  const [transcript,    setTranscript]   = useState("");
  const [items,         setItems]        = useState<ParsedItem[]>([]);
  const [saving,        setSaving]       = useState(false);
  const [barHeights,    setBarHeights]   = useState<number[]>(Array(BAR_COUNT).fill(8));
  const [paymentStatus, setPaymentStatus]= useState<'paid' | 'owing'>('paid');
  const [customerName,  setCustomerName] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const barTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current)    clearInterval(timerRef.current);
      if (barTimerRef.current) clearInterval(barTimerRef.current);
    };
  }, []);

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current    = setInterval(() => setElapsed((p) => p + 1), 1000);
      barTimerRef.current = setInterval(() => {
        setBarHeights(Array.from({ length: BAR_COUNT }, () => 4 + Math.random() * 28));
      }, 120);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current)    clearInterval(timerRef.current);
    if (barTimerRef.current) clearInterval(barTimerRef.current);
    setBarHeights(Array(BAR_COUNT).fill(8));
    setStatus("processing");

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      try {
        const fd = new FormData();
        fd.append("audio", blob, "recording.webm");
        const tRes  = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
        const tData = await tRes.json();
        const text: string = tData.data?.text ?? tData.text ?? tData.transcript ?? "";

        if (!text) { setTranscript(""); setItems([]); setStatus("done"); return; }
        setTranscript(text);

        const pRes  = await fetch("/api/ai/parse-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const pData  = await pRes.json();
        const parsed: ParsedItem[] = Array.isArray(pData.data) ? pData.data : (pData.records ?? []);
        setItems(parsed);
        setStatus("done");
      } catch {
        setStatus("done");
        setItems([]);
      }
    };
    mediaRecorderRef.current.stop();
  }

  function toggleRecording() {
    if (status === "idle" || status === "done") startRecording();
    else if (status === "recording") stopRecording();
  }

  async function saveAs(type: "sale" | "expense", sourceItems: ParsedItem[]) {
    if (sourceItems.length === 0 || saving) return;
    setSaving(true);
    try {
      const responses = await Promise.all(
        sourceItems.map((it) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              amount:         it.amount,
              description:    it.description,
              category:       it.category ?? (type === "sale" ? "Other" : "Other"),
              input_method:   "voice",
              record_date:    date,
              payment_status: type === "sale" ? paymentStatus : "paid",
              customer_name:  type === "sale" && paymentStatus === "owing" ? (customerName.trim() || undefined) : undefined,
            }),
          })
        )
      );
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const err = await failed.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${failed.status}`);
      }
      bumpRecordSaved();
      router.refresh();
      window.location.href = "/home";
    } catch {
      setSaving(false);
    }
  }

  const statusText =
    status === "idle"       ? "Tap to start recording"
    : status === "recording"  ? `● Recording...  ${formatTime(elapsed)}`
    : status === "processing" ? "SPAL is processing..."
    : "Done! Review below";

  const saleItems    = items.filter((it) => isSale(it.type));
  const expenseItems = items.filter((it) => isExpense(it.type));

  // Cross-type: recorded expense while on sale screen
  const hasCrossExpense = status === "done" && transcript && saleItems.length === 0 && expenseItems.length > 0;

  return (
    <div className="min-h-full pb-36" style={{ background: BG, fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily }}>Voice Entry</span>
      </div>

      <div className="px-5">
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily }}>Just talk naturally</h1>
        <p className="text-[13px] text-neutral-500 mt-1 leading-relaxed" style={{ fontFamily }}>
          Say what you sold, how many and the price. SPAL does the rest
        </p>

        {/* Date picker */}
        <DateTimePicker date={date} onDateChange={setDate} className="mt-4" />

        {/* Sound wave */}
        <div className="mt-8 flex items-center justify-center gap-[3px] h-12">
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: h }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="rounded-full"
              style={{ width: 3, background: status === "recording" ? "#22C55E" : "#D1D5DB" }}
            />
          ))}
        </div>

        {/* Mic button */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="relative">
            {status === "recording" && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(34,197,94,0.25)" }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <button
              onClick={toggleRecording}
              disabled={status === "processing"}
              className="relative w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: "#22C55E", boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
              aria-label={status === "recording" ? "Stop recording" : "Start recording"}
            >
              {status === "recording"
                ? <Cancel01Icon size={28} color="#fff" />
                : <Mic01Icon size={28} color="#fff" />}
            </button>
          </div>

          <p
            className="text-[13px] font-medium text-center"
            style={{ fontFamily, color: status === "recording" ? "#22C55E" : status === "processing" ? "#F97316" : "#6B7280" }}
          >
            {statusText}
          </p>
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl px-4 py-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2" style={{ fontFamily }}>
                What you said
              </p>
              <p className="text-[13px] text-spal-navy leading-relaxed" style={{ fontFamily }}>{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty / no match states */}
        <AnimatePresence>
          {status === "done" && !transcript && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl px-4 py-5 text-center"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[14px] font-semibold text-spal-navy mb-1" style={{ fontFamily }}>Couldn&apos;t hear that</p>
              <p className="text-[13px] text-neutral-400" style={{ fontFamily }}>Tap the mic and try again. Speak clearly and mention the amount.</p>
            </motion.div>
          )}

          {/* Pure no-match (nothing useful parsed at all) */}
          {status === "done" && transcript && saleItems.length === 0 && !hasCrossExpense && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white rounded-2xl px-4 py-5 text-center"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[14px] font-semibold text-spal-navy mb-1" style={{ fontFamily }}>No sales found</p>
              <p className="text-[13px] text-neutral-400" style={{ fontFamily }}>Try saying: &quot;I sold 5 plates of rice for ₦500 each&quot;</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cross-type suggestion ───────────────────────────────────────── */}
        <AnimatePresence>
          {hasCrossExpense && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mt-4 rounded-2xl px-4 py-4"
              style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}
            >
              <p className="text-[13px] font-bold text-spal-navy mb-1" style={{ fontFamily }}>
                Looks like you recorded an expense 🧾
              </p>
              <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed" style={{ fontFamily }}>
                SPAL picked up spending, not a sale. Is this an expense you want to save, or did you mean to record a sale?
              </p>

              {/* Preview items */}
              <div className="space-y-2 mb-3">
                {expenseItems.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <ReceiptDollarIcon size={16} color="#6B7280" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{item.description}</p>
                      {item.qty > 1 && (
                        <p className="text-[10px] text-neutral-400 mt-0.5" style={{ fontFamily }}>{item.qty} × {formatCurrency(item.unit_price)}</p>
                      )}
                    </div>
                    <p className="text-[13px] font-bold flex-shrink-0" style={{ fontFamily, color: "#F97316" }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => saveAs("expense", expenseItems)}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl font-semibold text-[13px] text-white active:scale-[0.98] transition-all disabled:opacity-40"
                  style={{ fontFamily, background: "#F97316" }}
                >
                  {saving ? "Saving..." : "Save as Expense"}
                </button>
                <button
                  onClick={() => { setItems([]); setTranscript(""); setStatus("idle"); }}
                  className="flex-1 h-11 rounded-xl font-semibold text-[13px] active:scale-[0.98] transition-all"
                  style={{ fontFamily, background: "rgba(15,23,42,0.06)", color: "#0F172A" }}
                >
                  Re-record as Sale
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extracted sale items */}
        <AnimatePresence>
          {saleItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-3" style={{ fontFamily }}>
                What SPAL heard
              </p>
              <div className="space-y-2.5">
                {saleItems.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3"
                    style={{
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      border: i === 0 ? "1.5px solid #22C55E" : "1.5px solid transparent",
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                      <Restaurant01Icon size={18} color="#22C55E" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "#F0FDF4", color: "#16A34A" }}
                        >
                          {item.category ?? "Sales"}
                        </span>
                        {item.qty > 1 && (
                          <span className="text-[10px] text-neutral-400" style={{ fontFamily }}>
                            {item.qty} × {formatCurrency(item.unit_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[15px] font-bold flex-shrink-0" style={{ fontFamily, color: "#22C55E" }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed CTA */}
      <AnimatePresence>
        {saleItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed cta-bottom left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-4 pt-3"
            style={{ background: "linear-gradient(to top, #F7F9F5 80%, transparent)" }}
          >
            {/* Payment toggle */}
            <div className="mb-2">
              <div className="flex gap-2 mb-1.5">
                {(['paid', 'owing'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPaymentStatus(s)}
                    className="flex-1 h-9 rounded-full text-[12px] font-bold transition-all duration-150 flex items-center justify-center gap-1.5"
                    style={{
                      background: paymentStatus === s ? (s === 'paid' ? '#22C55E' : '#F97316') : '#E5E7EB',
                      color: paymentStatus === s ? '#fff' : '#6B7280',
                      fontFamily,
                    }}
                  >
                    {s === 'paid' ? <><Tick01Icon size={13} /> Paid now</> : <><Clock01Icon size={13} />{' '}Owes me</>}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {paymentStatus === 'owing' && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 40 }}
                    exit={{ opacity: 0, height: 0 }}
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer name (optional)"
                    className="w-full px-3 rounded-xl text-[12px] text-spal-navy outline-none mb-1.5"
                    style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', fontFamily }}
                  />
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => saveAs("sale", saleItems)}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ fontFamily, background: "#22C55E" }}
            >
              {saving ? "Saving..." : `Save ${saleItems.length} ${saleItems.length === 1 ? "item" : "items"}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
