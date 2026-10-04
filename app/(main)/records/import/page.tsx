"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSPALStore } from "@/store";
import type { TrackingMethod } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowLeft01Icon, ArrowRight01Icon, PencilEdit01Icon, Clock01Icon,
  Upload01Icon, Camera01Icon,
} from "hugeicons-react";
import {
  BookOpen01Icon, ChatIcon, Table01Icon, GridViewIcon,
  File01Icon, ReceiptDollarIcon, AlignBoxTopLeftIcon,
  ArrowUp01Icon, ArrowDown01Icon, Calendar01Icon, Tick01Icon,
  Alert01Icon,
} from "hugeicons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewRecord {
  _id:            string;
  type:           "sale" | "expense";
  amount:         number;
  description:    string;
  category:       string;
  record_date:    string | null;
  confidence:     "high" | "low";
  payment_status: "paid" | "owing";
  customer_name:  string;
}

// ── Method metadata ───────────────────────────────────────────────────────────

const METHOD_META: Record<TrackingMethod, {
  label:     string;
  sub:       string;
  icon:      React.ReactNode;
  inputType: "file" | "visual";
  accent:    string;
}> = {
  notebook:      { label: "Notebook",      sub: "You write in a physical notebook",          icon: <BookOpen01Icon  size={20} />, inputType: "visual", accent: "#22C55E" },
  whatsapp:      { label: "WhatsApp",      sub: "You message yourself or save notes there",  icon: <ChatIcon        size={20} />, inputType: "visual", accent: "#25D366" },
  excel:         { label: "Excel",         sub: "You track in a spreadsheet",                icon: <Table01Icon     size={20} />, inputType: "file",   accent: "#217346" },
  google_sheets: { label: "Google Sheets", sub: "You use Google Sheets",                     icon: <GridViewIcon    size={20} />, inputType: "file",   accent: "#2563EB" },
  notes_app:     { label: "Notes App",     sub: "You use a phone notes app",                 icon: <File01Icon      size={20} />, inputType: "visual", accent: "#F59E0B" },
  receipts:      { label: "Receipts",      sub: "You keep paper receipts or photos",         icon: <ReceiptDollarIcon size={20} />, inputType: "visual", accent: "#F97316" },
  nothing:       { label: "Other",         sub: "No set system yet",                          icon: <Upload01Icon  size={20} />, inputType: "file",   accent: "#A1A1AA" },
};

const ALL_METHODS: TrackingMethod[] = [
  "notebook", "whatsapp", "excel", "google_sheets", "notes_app", "receipts",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10); }

function friendlyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

let _uid = 0;
function uid() { return String(++_uid); }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportRecordPage() {
  const router = useRouter();
  const { user, bumpRecordSaved } = useSPALStore();

  const [methods, setMethods]       = useState<TrackingMethod[]>([]);
  const [activeMethod, setActive]   = useState<TrackingMethod | null>(null);
  const [loadingProfile, setLP]     = useState(true);
  const [showPicker, setShowPicker] = useState(false); // inline method picker

  const fileRef  = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [pasteText,   setPasteText]   = useState("");
  const [processing,  setProcessing]  = useState(false);
  const [parseError,  setParseError]  = useState("");
  const [records,     setRecords]     = useState<ReviewRecord[]>([]);
  const [fallbackDate, setFallbackDate] = useState(today());
  const [saving,      setSaving]      = useState(false);
  const [savedCount,  setSavedCount]  = useState(0);

  // ── Load tracking methods ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success && data.data?.tracking_methods?.length > 0) {
          const dbMethods = (data.data.tracking_methods as string[])
            .filter(m => m !== "nothing") as TrackingMethod[];
          if (dbMethods.length > 0) {
            setMethods(dbMethods);
            // Don't auto-select — let user choose from their saved methods
            setLP(false);
            return;
          }
        }
      } catch { /* fall through */ }

      // Fall back to user store
      const fallback = ((user as unknown as { tracking_methods?: TrackingMethod[] })
        ?.tracking_methods ?? []).filter(m => m !== "nothing");
      setMethods(fallback);
      setLP(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show inline picker when no methods found after load
  useEffect(() => {
    if (!loadingProfile && methods.length === 0) setShowPicker(true);
  }, [loadingProfile, methods]);

  // ── Save tracking methods to DB ────────────────────────────────────────────
  async function saveMethodsToDB(selected: TrackingMethod[]) {
    try {
      await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tracking_methods: selected }),
      });
    } catch { /* silent — methods still set in local state */ }
    setMethods(selected);
    setActive(selected[0] ?? null);
    setShowPicker(false);
  }

  // ── Duplicate file detection ──────────────────────────────────────────────
  const DUPE_KEY = "spal_imported_files";
  function getImportedFiles(): string[] {
    try { return JSON.parse(localStorage.getItem(DUPE_KEY) ?? "[]"); } catch { return []; }
  }
  function markFileImported(name: string) {
    const list = getImportedFiles();
    if (!list.includes(name)) localStorage.setItem(DUPE_KEY, JSON.stringify([...list, name]));
  }
  function isDuplicateFile(name: string) {
    return getImportedFiles().includes(name);
  }

  const [dupeFile,    setDupeFile]    = useState<File | null>(null);
  const [showDupeBanner, setDupeBanner] = useState(false);

  async function doProcessFile(file: File) {
    setParseError("");
    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/ai/import-records", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      appendRecords(data.data ?? []);
      markFileImported(file.name);
    } catch {
      setParseError("Couldn't read the file. Try exporting as CSV and uploading again.");
    } finally {
      setProcessing(false);
    }
  }

  // ── Parse: file ───────────────────────────────────────────────────────────
  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls|ods|pdf|txt)$/i)) {
      setParseError("Please upload a CSV, Excel (.xlsx), or PDF file.");
      return;
    }
    if (isDuplicateFile(file.name)) {
      setDupeFile(file);
      setDupeBanner(true);
      return;
    }
    await doProcessFile(file);
  }

  // ── Parse: image ──────────────────────────────────────────────────────────
  async function handleImage(file: File | null | undefined) {
    if (!file) return;
    setParseError("");
    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/ai/import-records", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      appendRecords(data.data ?? []);
    } catch {
      setParseError("Couldn't read the image. Try a clearer photo.");
    } finally {
      setProcessing(false);
    }
  }

  // ── Parse: pasted text ────────────────────────────────────────────────────
  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setParseError("");
    setProcessing(true);
    try {
      const res  = await fetch("/api/ai/import-records", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      appendRecords(data.data ?? []);
      setPasteText("");
    } catch {
      setParseError("Couldn't extract records. Check your text and try again.");
    } finally {
      setProcessing(false);
    }
  }

  function appendRecords(raw: Omit<ReviewRecord, "_id">[]) {
    setRecords(prev => [
      ...prev,
      ...raw.map(r => ({
        ...r,
        _id: uid(),
        payment_status: (r.payment_status ?? "paid") as "paid" | "owing",
        customer_name:  r.customer_name ?? "",
      })),
    ]);
  }

  function updateRecord(id: string, patch: Partial<ReviewRecord>) {
    setRecords(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));
  }

  function removeRecord(id: string) {
    setRecords(prev => prev.filter(r => r._id !== id));
  }

  const missingDateCount = records.filter(r => !r.record_date).length;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!records.length || saving) return;
    setSaving(true);
    setParseError("");
    try {
      const results = await Promise.all(
        records.map(r =>
          fetch("/api/records", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type:           r.type,
              amount:         r.amount,
              description:    r.description,
              category:       r.category || undefined,
              input_method:   "import",
              record_date:    r.record_date ?? fallbackDate,
              payment_status: r.payment_status ?? "paid",
              customer_name:  r.payment_status === "owing" ? (r.customer_name || undefined) : undefined,
            }),
          }).then(res => res.json())
        )
      );
      const failed = results.filter(r => !r.success).length;
      if (failed > 0 && failed === results.length) {
        setParseError("Couldn't save records. Please check your connection and try again.");
        setSaving(false);
        return;
      }
      const saved = results.filter(r => r.success).length;
      setSavedCount(saved);
      bumpRecordSaved();
      setRecords([]);
    } catch {
      setParseError("Something went wrong while saving. Please try again.");
      setSaving(false);
    }
  }, [records, saving, fallbackDate, bumpRecordSaved]);

  // ── Success screen ────────────────────────────────────────────────────────
  if (savedCount > 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <div className="w-20 h-20 rounded-full bg-spal-green flex items-center justify-center mx-auto mb-5">
            <Tick01Icon size={36} color="white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            {savedCount} {savedCount === 1 ? "record" : "records"} imported!
          </h2>
          <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
            Your records are saved and ready in your history.
          </p>
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setSavedCount(0)}
              className="flex-1 h-12 rounded-2xl border border-neutral-200 text-spal-navy font-semibold text-sm"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              Import more
            </button>
            <button
              onClick={() => router.push("/records")}
              className="flex-1 h-12 rounded-2xl bg-spal-green text-white font-semibold text-sm"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              View records
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const meta = activeMethod ? METHOD_META[activeMethod] : null;

  return (
    <div className="min-h-full pb-32" style={{ background: "#EEF3E9" }}>
      <PageHeader onBack={() => router.back()} />

      <div className="px-5">

        {/* Loading skeleton */}
        {loadingProfile && (
          <div className="space-y-3 mt-2">
            <div className="h-7 w-48 skeleton rounded-xl" />
            <div className="h-4 w-64 skeleton rounded-lg" />
            <div className="h-10 w-full skeleton rounded-full mt-4" />
          </div>
        )}

        {/* ── Inline method picker (no saved methods) ───────────────────── */}
        {!loadingProfile && showPicker && (
          <MethodPicker
            current={methods}
            onSave={saveMethodsToDB}
          />
        )}

        {/* ── Method chooser (has saved methods, none chosen yet) ────────── */}
        {!loadingProfile && !showPicker && methods.length > 0 && !activeMethod && (
          <MethodChooser
            methods={methods}
            onSelect={setActive}
          />
        )}

        {/* ── Upload UI ─────────────────────────────────────────────────── */}
        {!loadingProfile && !showPicker && activeMethod && (
          <>
            {/* Title + back-to-chooser link */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-[22px] font-bold text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {METHOD_META[activeMethod].label}
                </h1>
                <p className="text-[13px] text-neutral-400 mt-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                  SPAL reads your records and extracts them automatically.
                </p>
              </div>
              {methods.length > 1 && (
                <button
                  onClick={() => { setActive(null); setRecords([]); setParseError(""); }}
                  className="flex items-center gap-1 text-[11px] font-semibold mt-1 flex-shrink-0"
                  style={{ color: "#22C55E", fontFamily: "var(--font-satoshi)" }}
                >
                  <PencilEdit01Icon size={11} />
                  Switch
                </button>
              )}
            </div>

            {/* Upload area */}
            {meta && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMethod}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {meta.inputType === "file" ? (
                    <FileUploadZone method={activeMethod!} onFile={handleFile} fileRef={fileRef} />
                  ) : (
                    <VisualUploadZone
                      method={activeMethod!}
                      onImage={handleImage}
                      imageRef={imageRef}
                      pasteText={pasteText}
                      onPasteChange={setPasteText}
                      onPasteSubmit={handlePasteSubmit}
                      processing={processing}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Hidden file inputs */}
            <input ref={fileRef}  type="file" accept=".csv,.xlsx,.xls,.ods,.pdf,.txt" className="hidden"
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            <input ref={imageRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { handleImage(e.target.files?.[0]); e.target.value = ""; }} />

            {/* Duplicate file warning */}
            <AnimatePresence>
              {showDupeBanner && dupeFile && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 rounded-2xl overflow-hidden"
                  style={{ border: "1.5px solid #FCD34D", background: "#FFFBEB" }}
                >
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start gap-2.5 mb-3">
                      <Alert01Icon size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[13px] font-bold text-amber-800 leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
                          Looks like you&apos;ve imported this file before
                        </p>
                        <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                          <span className="font-semibold">{dupeFile.name}</span> was already uploaded. Importing again may create duplicate records.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setDupeBanner(false); setDupeFile(null); }}
                        className="flex-1 h-10 rounded-xl border border-amber-300 text-[12.5px] font-semibold text-amber-700 active:opacity-70"
                        style={{ fontFamily: "var(--font-satoshi)" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { setDupeBanner(false); doProcessFile(dupeFile); setDupeFile(null); }}
                        className="flex-1 h-10 rounded-xl bg-amber-500 text-white text-[12.5px] font-bold active:opacity-80"
                        style={{ fontFamily: "var(--font-satoshi)" }}
                      >
                        Import anyway
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing indicator */}
            <AnimatePresence>
              {processing && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mt-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-spal-green border-t-transparent animate-spin flex-shrink-0" />
                  <p className="text-[13px] font-medium text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    SPAL is reading your records…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {parseError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5"
                >
                  <Alert01Icon size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[12.5px] text-red-600 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {parseError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review section */}
            <AnimatePresence>
              {records.length > 0 && !processing && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                        Review records
                      </p>
                      <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                        {records.length} found · check and fix before saving
                      </p>
                    </div>
                    {records.some(r => r.confidence === "low") && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ background: "#FEF3C7", color: "#92400E", fontFamily: "var(--font-satoshi)" }}>
                        <Alert01Icon size={11} />
                        {records.filter(r => r.confidence === "low").length} needs review
                      </span>
                    )}
                  </div>

                  {missingDateCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5"
                    >
                      <p className="text-[12px] font-semibold text-amber-800 mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
                        {missingDateCount} {missingDateCount === 1 ? "record has" : "records have"} no date — set a fallback:
                      </p>
                      <input
                        type="date"
                        value={fallbackDate}
                        max={today()}
                        onChange={e => setFallbackDate(e.target.value)}
                        className="h-10 px-3 rounded-xl border-2 border-amber-200 bg-white text-[13px] text-spal-navy font-medium outline-none focus:border-spal-blue transition-colors"
                        style={{ fontFamily: "var(--font-satoshi)" }}
                      />
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {records.map(record => (
                        <ReviewCard
                          key={record._id}
                          record={record}
                          fallbackDate={fallbackDate}
                          onChange={patch => updateRecord(record._id, patch)}
                          onRemove={() => removeRecord(record._id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips (only when nothing loaded yet) */}
            {records.length === 0 && !processing && (
              <div className="mt-6 rounded-2xl px-4 py-4 space-y-2.5"
                style={{ background: "#fff", border: "1.5px solid #E5E7EB" }}>
                <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Tips
                </p>
                {[
                  "For spreadsheets, export as CSV for best results.",
                  "For WhatsApp or notes, paste the text or take a clear screenshot.",
                  "SPAL will flag any records it isn't sure about.",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight01Icon size={13} className="text-spal-green mt-0.5 flex-shrink-0" />
                    <p className="text-[12.5px] text-neutral-500 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Import CTA */}
      <AnimatePresence>
        {records.length > 0 && !processing && !showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 z-20"
            style={{
              bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
              paddingBottom: "12px",
              background: "linear-gradient(to top, #EEF3E9 75%, transparent)",
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ fontFamily: "var(--font-satoshi)", background: "#22C55E", boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }}
            >
              {saving
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Importing…</>
                : `Import ${records.length} ${records.length === 1 ? "record" : "records"}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MethodChooser — pick from saved methods ───────────────────────────────────

function MethodChooser({
  methods,
  onSelect,
}: {
  methods:  TrackingMethod[];
  onSelect: (m: TrackingMethod) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1
        className="text-[22px] font-bold text-spal-navy leading-tight mb-1"
        style={{ fontFamily: "var(--font-satoshi)" }}
      >
        Where are your records?
      </h1>
      <p className="text-[13px] text-neutral-400 mb-6" style={{ fontFamily: "var(--font-satoshi)" }}>
        Pick the one you want to import from today.
      </p>

      <div className="space-y-3">
        {methods.map((m, i) => {
          const info = METHOD_META[m];
          return (
            <motion.button
              key={m}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(m)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 text-left transition-all duration-150 active:opacity-80"
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
                border:    "1.5px solid #F0F0F0",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${info.accent}14`, color: info.accent }}
              >
                {info.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {info.label}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {info.sub}
                </p>
              </div>
              <ArrowRight01Icon size={18} className="text-neutral-300 flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Nudge to update methods */}
      <div className="mt-8 flex items-center justify-center gap-1.5">
        <p className="text-[12px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
          Using a different method now?
        </p>
        <a
          href="/profile"
          className="text-[12px] font-semibold"
          style={{ color: "#2563EB", fontFamily: "var(--font-satoshi)" }}
        >
          Update in Settings
        </a>
      </div>
    </motion.div>
  );
}

// ── MethodPicker — inline method selector ─────────────────────────────────────

function MethodPicker({
  current,
  onSave,
}: {
  current: TrackingMethod[];
  onSave: (methods: TrackingMethod[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<TrackingMethod>>(new Set(current));
  const [saving,   setSaving]   = useState(false);

  function toggle(m: TrackingMethod) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

  async function handleSave() {
    if (!selected.size) return;
    setSaving(true);
    await onSave(Array.from(selected));
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[22px] font-bold text-spal-navy leading-tight mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
        How do you track your records?
      </h1>
      <p className="text-[13px] text-neutral-400 mb-5" style={{ fontFamily: "var(--font-satoshi)" }}>
        Select how you currently manage your business records. You can pick multiple.
      </p>

      <div className="space-y-2.5">
        {ALL_METHODS.map((m, i) => {
          const info       = METHOD_META[m];
          const isSelected = selected.has(m);
          return (
            <motion.button
              key={m}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggle(m)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
              style={{
                border:     isSelected ? `1.5px solid ${info.accent}` : "1.5px solid transparent",
                boxShadow:  isSelected
                  ? `0 0 0 3px ${info.accent}18, 0 2px 8px rgba(0,0,0,0.06)`
                  : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${info.accent}14`, color: info.accent }}
              >
                {info.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {info.label}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {info.sub}
                </p>
              </div>
              <div
                className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                style={{
                  border:     isSelected ? `2px solid ${info.accent}` : "2px solid #D4D4D8",
                  background: isSelected ? info.accent : "transparent",
                }}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={selected.size === 0 || saving}
        className="w-full h-14 rounded-2xl font-bold text-[15px] mt-6 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        style={{
          fontFamily: "var(--font-satoshi)",
          background: selected.size > 0 ? "#22C55E" : "#E4E4E7",
          color:      selected.size > 0 ? "#fff"    : "#A1A1AA",
        }}
      >
        {saving
          ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
          : `Continue${selected.size > 0 ? ` (${selected.size} selected)` : ""}`}
      </button>
    </motion.div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────

function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-12 pb-5">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
        style={{ background: "rgba(15,23,42,0.06)" }}
        aria-label="Back"
      >
        <ArrowLeft01Icon size={18} />
      </button>
      <span className="text-[16px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
        Import Record
      </span>
    </div>
  );
}

// ── FileUploadZone ────────────────────────────────────────────────────────────

function FileUploadZone({
  method, onFile, fileRef,
}: {
  method:  TrackingMethod;
  onFile:  (f: File | null) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  const hint = method === "excel"
    ? "From Excel, go to File → Save As → CSV, then upload here."
    : method === "google_sheets"
    ? "From Google Sheets: File → Download → CSV (.csv), then upload here."
    : "Upload a CSV or spreadsheet file.";

  return (
    <div>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-2xl bg-white flex flex-col items-center justify-center gap-3 py-10 active:scale-[0.99] transition-transform"
        style={{ border: "2px dashed #D1D5DB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
          <Upload01Icon size={22} color="#2563EB" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Tap to upload a file
          </p>
          <p className="text-[11.5px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
            .csv · .xlsx · .xls · .pdf
          </p>
        </div>
      </button>
      <p className="text-[12px] text-neutral-400 mt-3 leading-relaxed text-center" style={{ fontFamily: "var(--font-satoshi)" }}>
        {hint}
      </p>
    </div>
  );
}

// ── VisualUploadZone ──────────────────────────────────────────────────────────

function VisualUploadZone({
  method, onImage, imageRef, pasteText, onPasteChange, onPasteSubmit, processing,
}: {
  method:        TrackingMethod;
  onImage:       (f: File | null) => void;
  imageRef:      React.RefObject<HTMLInputElement | null>;
  pasteText:     string;
  onPasteChange: (v: string) => void;
  onPasteSubmit: () => void;
  processing:    boolean;
}) {
  const imageHint: Partial<Record<TrackingMethod, string>> = {
    whatsapp:  "Screenshot your WhatsApp notes or messages",
    notebook:  "Take a clear photo of your notebook page",
    notes_app: "Screenshot your notes",
    receipts:  "Photograph your receipts clearly",
  };
  const textHint: Partial<Record<TrackingMethod, string>> = {
    whatsapp:  "Or paste your WhatsApp messages here",
    notebook:  "Or type out what's in your notebook",
    notes_app: "Or paste your notes directly here",
    receipts:  "Or list your receipt amounts and descriptions",
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => imageRef.current?.click()}
        className="w-full rounded-2xl bg-white flex items-center gap-4 px-5 py-4 active:scale-[0.99] transition-transform text-left"
        style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
          <Camera01Icon size={20} color="#22C55E" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Upload photo or screenshot
          </p>
          <p className="text-[11.5px] text-neutral-400 mt-0.5 leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>
            {imageHint[method] ?? "Take a clear photo of your records"}
          </p>
        </div>
        <ArrowRight01Icon size={16} className="text-neutral-300 flex-shrink-0" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-[11px] text-neutral-400 font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>or</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
            <AlignBoxTopLeftIcon size={15} color="#2563EB" />
          </div>
          <p className="text-[13px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
            Paste as text
          </p>
        </div>
        <textarea
          rows={4}
          placeholder={textHint[method] ?? "Paste your records here…"}
          value={pasteText}
          onChange={e => onPasteChange(e.target.value)}
          className="w-full px-4 pb-3 text-[13px] text-spal-navy placeholder:text-neutral-300 bg-transparent outline-none resize-none leading-relaxed"
          style={{ fontFamily: "var(--font-satoshi)" }}
        />
        <AnimatePresence>
          {pasteText.trim().length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-neutral-100 px-4 py-3 overflow-hidden"
            >
              <button
                onClick={onPasteSubmit}
                disabled={processing}
                className="w-full h-10 rounded-xl bg-spal-blue text-white font-semibold text-[13px] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-satoshi)" }}
              >
                {processing
                  ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Reading…</>
                  : "Extract records"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({
  record, fallbackDate, onChange, onRemove,
}: {
  record:       ReviewRecord;
  fallbackDate: string;
  onChange:     (patch: Partial<ReviewRecord>) => void;
  onRemove:     () => void;
}) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [desc,        setDesc]        = useState(record.description);
  const descRef = useRef<HTMLInputElement>(null);
  const isLow   = record.confidence === "low";

  function commitDesc() {
    const trimmed = desc.trim() || record.description;
    onChange({ description: trimmed, confidence: "high" });
    setDesc(trimmed);
    setEditingDesc(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.22 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border:    isLow ? "1.5px solid #FCD34D" : "1.5px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {isLow && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100" style={{ background: "#FFFBEB" }}>
          <Alert01Icon size={13} color="#D97706" />
          <p className="text-[11.5px] font-semibold text-amber-700" style={{ fontFamily: "var(--font-satoshi)" }}>
            SPAL isn&apos;t sure about this one — please review
          </p>
        </div>
      )}

      <div className="px-4 py-3.5">
        {/* Type toggle + Amount */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 flex-shrink-0">
            <button
              onClick={() => onChange({ type: "sale", confidence: "high" })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-bold transition-all duration-150"
              style={{
                background: record.type === "sale" ? "#22C55E" : "transparent",
                color:      record.type === "sale" ? "#fff"    : "#9CA3AF",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              <ArrowUp01Icon size={12} />Sale
            </button>
            <button
              onClick={() => onChange({ type: "expense", confidence: "high" })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-bold transition-all duration-150"
              style={{
                background: record.type === "expense" ? "#F97316" : "transparent",
                color:      record.type === "expense" ? "#fff"    : "#9CA3AF",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              <ArrowDown01Icon size={12} />Expense
            </button>
          </div>
          <p className="text-[15px] font-bold flex-shrink-0"
            style={{ color: record.type === "sale" ? "#22C55E" : "#F97316", fontFamily: "var(--font-satoshi)" }}>
            {record.type === "sale" ? "+" : "–"}{formatCurrency(record.amount)}
          </p>
        </div>

        {/* Description */}
        <div className="mb-2.5">
          {editingDesc ? (
            <input
              ref={descRef}
              autoFocus
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={e => { if (e.key === "Enter") commitDesc(); }}
              className="w-full text-[13px] font-medium text-spal-navy outline-none border-b-2 border-spal-blue pb-1 bg-transparent"
              style={{ fontFamily: "var(--font-satoshi)" }}
            />
          ) : (
            <button onClick={() => { setEditingDesc(true); setTimeout(() => descRef.current?.focus(), 50); }} className="text-left w-full">
              <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                {record.description || <span className="text-neutral-300">Tap to add description</span>}
              </p>
              {record.category && (
                <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED",
                    color:      record.type === "sale" ? "#16A34A" : "#EA580C",
                  }}>
                  {record.category}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Payment status — sales only */}
        {record.type === "sale" && (
          <div className="mb-2.5">
            <div className="flex gap-1.5">
              {(['paid', 'owing'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ payment_status: s, confidence: "high" })}
                  className="flex-1 h-8 rounded-full text-[11px] font-bold transition-all duration-150 flex items-center justify-center gap-1"
                  style={{
                    background: record.payment_status === s ? (s === 'paid' ? '#22C55E' : '#F97316') : '#F4F4F5',
                    color: record.payment_status === s ? '#fff' : '#9CA3AF',
                    fontFamily: "var(--font-satoshi)",
                  }}
                >
                  {s === 'paid' ? <><Tick01Icon size={13} /> Paid</> : <><Clock01Icon size={13} />{' '}Owes me</>}
                </button>
              ))}
            </div>
            {record.payment_status === 'owing' && (
              <input
                type="text"
                value={record.customer_name}
                onChange={e => onChange({ customer_name: e.target.value })}
                placeholder="Customer name (optional)"
                className="mt-1.5 w-full h-8 px-3 rounded-xl text-[11px] text-spal-navy outline-none"
                style={{ background: '#FFF7ED', border: '1px solid #FED7AA', fontFamily: "var(--font-satoshi)" }}
              />
            )}
          </div>
        )}

        {/* Date + Remove */}
        <div className="flex items-center justify-between">
          {editingDate ? (
            <input
              type="date"
              autoFocus
              value={record.record_date ?? fallbackDate}
              max={today()}
              onChange={e => { onChange({ record_date: e.target.value, confidence: "high" }); setEditingDate(false); }}
              onBlur={() => setEditingDate(false)}
              className="h-8 px-2 rounded-xl border-2 border-spal-blue text-[12px] text-spal-navy font-medium outline-none bg-white"
              style={{ fontFamily: "var(--font-satoshi)" }}
            />
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-[11.5px] font-semibold transition-colors"
              style={{
                background: record.record_date ? "#F0FDF4" : "#FEF3C7",
                color:      record.record_date ? "#16A34A" : "#92400E",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              <Calendar01Icon size={11} />
              {record.record_date ? friendlyDate(record.record_date) : `Using fallback · ${friendlyDate(fallbackDate)}`}
            </button>
          )}
          <button
            onClick={onRemove}
            className="text-[11.5px] font-semibold text-neutral-400 active:text-red-400 transition-colors"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}
