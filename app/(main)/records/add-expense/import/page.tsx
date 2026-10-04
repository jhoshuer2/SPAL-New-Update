"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, Upload01Icon, ArrowRight01Icon, ReceiptDollarIcon, Csv01Icon, File01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { DateTimePicker } from "@/components/shared/DateTimePicker";

const BG = "#F7F9F5";
const fontFamily = "var(--font-satoshi)";

interface ParsedRecord {
  type: string;
  description: string;
  amount: number;
  category: string;
  record_date?: string;
}

interface RecentFile {
  name: string;
  size: number;
  time: number;
}

const FORMAT_CHIPS = [
  { label: "Excel (.xlsx)", key: "excel" },
  { label: "CSV (.csv)", key: "csv" },
  { label: "Google Sheets", key: "google_sheets" },
  { label: "PDF", key: "pdf" },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function ImportExpensePage() {
  const router = useRouter();
  const { bumpRecordSaved, onboardingData } = useSPALStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [parsing, setParsing] = useState(false);
  const [csvHint, setCsvHint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("spal_recent_expense_imports");
      if (raw) setRecentFiles(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const trackingMethods = onboardingData?.trackingMethods ?? [];

  function isActiveChip(key: string) {
    return trackingMethods.includes(key as "excel" | "google_sheets" | "notebook" | "whatsapp" | "notes_app" | "receipts" | "nothing");
  }

  async function handleFile(file: File | undefined | null) {
    if (!file) return;

    const newEntry: RecentFile = { name: file.name, size: file.size, time: Date.now() };
    setRecentFiles((prev) => {
      const updated = [newEntry, ...prev.filter((f) => f.name !== file.name)].slice(0, 5);
      try { localStorage.setItem("spal_recent_expense_imports", JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });

    const isCsv = file.name.endsWith(".csv");
    if (!isCsv) { setCsvHint(true); return; }

    setCsvHint(false);
    setParsing(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/ai/parse-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const parsed: ParsedRecord[] = data.data ?? data.records ?? [];
      setRecords(parsed);
    } catch {
      setRecords([]);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (records.length === 0 || saving) return;
    setSaving(true);
    try {
      const responses = await Promise.all(
        records.map((r) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "expense",
              amount: r.amount,
              description: r.description,
              category: r.category ?? "Expenses",
              input_method: "import",
              record_date: r.record_date ?? date,
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
        <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily }}>Import Entry</span>
      </div>

      <div className="px-5">
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily }}>Upload your file</h1>
        <p className="text-[13px] text-neutral-500 mt-1 leading-relaxed" style={{ fontFamily }}>
          SPAL reads your spreadsheet and extracts expenses automatically
        </p>

        {/* Date picker */}
        <DateTimePicker date={date} onDateChange={setDate} className="mt-4" />

        {/* Upload zone */}
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-5 w-full rounded-2xl bg-white flex flex-col items-center justify-center gap-3 py-10 active:scale-[0.98] transition-transform"
          style={{ border: "2px dashed #D1D5DB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E0" }}>
            <Upload01Icon size={22} color="#F97316" />
          </div>
          <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily }}>Tap to choose a file</p>
          <p className="text-[11.5px] text-neutral-400" style={{ fontFamily }}>.csv, .xlsx, .xls, .pdf</p>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Format chips */}
        <div className="mt-5">
          <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2.5" style={{ fontFamily }}>
            Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {FORMAT_CHIPS.map((chip) => {
              const active = isActiveChip(chip.key);
              return (
                <span
                  key={chip.key}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-full"
                  style={{
                    fontFamily,
                    background: active ? "#F97316" : "#fff",
                    color: active ? "#fff" : "#374151",
                    border: active ? "none" : "1.5px solid #E5E7EB",
                  }}
                >
                  {chip.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* CSV hint */}
        <AnimatePresence>
          {csvHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-2xl px-4 py-3.5"
              style={{ background: "#FFF7ED" }}
            >
              <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#C2410C" }}>
                💡 Export your file as CSV for best results, then import here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parsing */}
        {parsing && (
          <div className="mt-4 rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: "#FFF3E0" }}>
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F97316", borderTopColor: "transparent" }} />
            <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#B45309" }}>
              SPAL is reading your file...
            </p>
          </div>
        )}

        {/* Parsed results */}
        <AnimatePresence>
          {!parsing && records.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className="rounded-2xl px-4 py-3.5 mb-3" style={{ background: "#FFF3E0" }}>
                <p className="text-[12.5px] font-medium" style={{ fontFamily, color: "#B45309" }}>
                  💡 SPAL found {records.length} records
                </p>
              </div>
              <div className="space-y-2.5">
                {records.map((r, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFF3E0" }}>
                      <ReceiptDollarIcon size={18} color="#F97316" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{r.description}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#C2410C" }}>
                        {r.category ?? "Expenses"}
                      </span>
                    </div>
                    <p className="text-[14px] font-bold flex-shrink-0" style={{ fontFamily, color: "#F97316" }}>
                      {formatCurrency(r.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent files */}
        {recentFiles.length > 0 && (
          <div className="mt-6">
            <p className="text-[13px] font-bold text-spal-navy mb-2.5" style={{ fontFamily }}>Recent Files</p>
            <div className="space-y-2">
              {recentFiles.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  {f.name.endsWith(".csv") ? <Csv01Icon size={20} color="#2563EB" className="flex-shrink-0" /> : <File01Icon size={20} color="#6B7280" className="flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily }}>{f.name}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5" style={{ fontFamily }}>
                      {formatBytes(f.size)} · {timeAgo(f.time)}
                    </p>
                  </div>
                  <ArrowRight01Icon size={16} className="text-neutral-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom tip */}
        <div className="mt-5 rounded-2xl px-4 py-3.5" style={{ background: "#FFF3E0" }}>
          <p className="text-[12.5px] leading-relaxed" style={{ fontFamily, color: "#B45309" }}>
            💡 SPAL matches columns automatically. Review the records before you save.
          </p>
        </div>
      </div>

      {/* Fixed CTA */}
      <AnimatePresence>
        {records.length > 0 && !parsing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed cta-bottom left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-4 pt-3"
            style={{ background: "linear-gradient(to top, #F7F9F5 80%, transparent)" }}
          >
            <button
              onClick={handleImport}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ fontFamily, background: "#F97316" }}
            >
              {saving ? "Importing..." : `Import ${records.length} ${records.length === 1 ? "expense" : "expenses"}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
