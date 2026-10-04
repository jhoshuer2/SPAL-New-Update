"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cancel01Icon, Download01Icon, File01Icon, FileEditIcon } from "hugeicons-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: "This week",   days: 7  },
  { label: "This month",  days: 30 },
  { label: "Last 3 months", days: 90 },
];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}

export function ExportSheet({ open, onClose }: Props) {
  const today = toISO(new Date());
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate,   setEndDate]   = useState(today);
  const [format,    setFormat]    = useState<"csv" | "pdf">("csv");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  function applyPreset(days: number) {
    setStartDate(daysAgo(days));
    setEndDate(today);
  }

  async function handleExport() {
    if (!startDate || !endDate || startDate > endDate) {
      setError("Check your dates — end date must be after start date.");
      return;
    }
    setLoading(true);
    setError("");

    const url = `/api/records/export?start_date=${startDate}&end_date=${endDate}&format=${format}`;

    if (format === "pdf") {
      // Open in new tab — browser print dialog handles Save as PDF
      window.open(url, "_blank");
      setLoading(false);
      onClose();
      return;
    }

    // CSV — trigger file download
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob     = await res.blob();
      const blobUrl  = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = blobUrl;
      a.download     = `spal-records-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl pb-safe"
            style={{ maxWidth: 480, margin: "0 auto" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>

            <div className="px-5 pt-2 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
                  Export records
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Cancel01Icon size={16} className="text-neutral-500" />
                </button>
              </div>

              {/* Quick presets */}
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Quick range</p>
              <div className="flex gap-2 mb-5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.days)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border border-neutral-200 text-spal-navy bg-white active:bg-neutral-50 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Date range */}
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Date range</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">From</label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => { setStartDate(e.target.value); setError(""); }}
                    className="w-full h-11 rounded-2xl border border-neutral-200 px-3 text-sm text-spal-navy bg-neutral-50 outline-none focus:border-spal-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">To</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={today}
                    onChange={(e) => { setEndDate(e.target.value); setError(""); }}
                    className="w-full h-11 rounded-2xl border border-neutral-200 px-3 text-sm text-spal-navy bg-neutral-50 outline-none focus:border-spal-blue transition-colors"
                  />
                </div>
              </div>

              {/* Format */}
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Format</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {([
                  { id: "csv", icon: FileEditIcon, label: "CSV", sub: "Opens in Excel or Google Sheets" },
                  { id: "pdf", icon: File01Icon,   label: "PDF", sub: "Print or share as document" },
                ] as const).map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setFormat(id)}
                    className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                      format === id
                        ? "border-spal-blue bg-blue-50"
                        : "border-neutral-200 bg-neutral-50"
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.8}
                      className={format === id ? "text-spal-blue mb-2" : "text-neutral-400 mb-2"}
                    />
                    <span className={`text-sm font-bold block ${format === id ? "text-spal-blue" : "text-spal-navy"}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-tight mt-0.5">{sub}</span>
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
              )}

              {/* Export button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleExport}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-spal-navy text-white text-[15px] font-semibold flex items-center justify-center gap-2.5 disabled:opacity-60 font-[family-name:var(--font-satoshi)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download01Icon size={18} />
                    Export {format.toUpperCase()}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
