"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowLeft01Icon, ScanIcon, Camera01Icon, ArrowReloadHorizontalIcon, CheckmarkCircle02Icon,
  ArrowUpRight01Icon, ArrowDownLeft01Icon, Calendar01Icon, Alert01Icon, PencilEdit01Icon,
  ZoomInAreaIcon,
} from "hugeicons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewRecord {
  _id:         string;
  type:        "sale" | "expense";
  amount:      number;
  description: string;
  category:    string;
  record_date: string | null;
  confidence:  "high" | "low";
}

type Stage = "camera" | "processing" | "review" | "success";

let _uid = 0;
function uid() { return String(++_uid); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

function friendlyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const router = useRouter();
  const { bumpRecordSaved } = useSPALStore();

  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const [stage,        setStage]     = useState<Stage>("camera");
  const [capturedUrl,  setCaptured]  = useState<string | null>(null);
  const [error,        setError]     = useState<string | null>(null);
  const [camError,     setCamError]  = useState(false);
  const [records,      setRecords]   = useState<ReviewRecord[]>([]);
  const [fallbackDate, setFallback]  = useState(todayISO());
  const [saving,       setSaving]    = useState(false);
  const [savedCount,   setSavedCount] = useState(0);
  const [flash,        setFlash]     = useState(false);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCamError(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  // ── Capture frame from video ───────────────────────────────────────────────
  function captureFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
    stopCamera();
    processImage(dataUrl);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  // ── Handle file fallback (when camera API not available) ──────────────────
  async function handleFilePick(file: File | null | undefined) {
    if (!file) return;
    setStage("processing");
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setCaptured(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  // ── Send image to AI ──────────────────────────────────────────────────────
  async function processImage(dataUrl: string) {
    setStage("processing");
    setError(null);
    try {
      // Convert data URL → Blob → FormData
      const res0  = await fetch(dataUrl);
      const blob  = await res0.blob();
      const fd    = new FormData();
      fd.append("image", blob, "scan.jpg");

      const res  = await fetch("/api/ai/import-records", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const extracted: ReviewRecord[] = (data.data ?? []).map(
        (r: Omit<ReviewRecord, "_id">) => ({ ...r, _id: uid() })
      );
      if (extracted.length === 0) {
        setError("SPAL couldn't find any records in this photo. Try a clearer shot.");
        setStage("camera");
        startCamera();
        return;
      }
      setRecords(extracted);
      setStage("review");
    } catch {
      setError("Something went wrong reading the photo. Please try again.");
      setStage("camera");
      startCamera();
    }
  }

  // ── Retake ────────────────────────────────────────────────────────────────
  function retake() {
    setRecords([]);
    setCaptured(null);
    setError(null);
    setStage("camera");
    startCamera();
  }

  // ── Update / remove review record ─────────────────────────────────────────
  function updateRecord(id: string, patch: Partial<ReviewRecord>) {
    setRecords(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));
  }
  function removeRecord(id: string) {
    setRecords(prev => prev.filter(r => r._id !== id));
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!records.length || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        records.map(r =>
          fetch("/api/records", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type:         r.type,
              amount:       r.amount,
              description:  r.description,
              category:     r.category || undefined,
              input_method: "scan",
              record_date:  r.record_date ?? fallbackDate,
            }),
          })
        )
      );
      setSavedCount(records.length);
      bumpRecordSaved();
      setRecords([]);
      setStage("success");
    } catch {
      setSaving(false);
    }
  }

  const missingDateCount = records.filter(r => !r.record_date).length;

  // ── Success ───────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center text-center px-8 z-50"
        style={{ background: "#0F172A" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}>
          <div className="w-20 h-20 rounded-full bg-spal-green flex items-center justify-center mx-auto mb-5">
            <CheckmarkCircle02Icon size={38} color="white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-satoshi)" }}>
            {savedCount} {savedCount === 1 ? "record" : "records"} saved!
          </h2>
          <p className="text-neutral-400 text-sm mt-2">Your scan is done and records are saved.</p>
          <div className="flex gap-3 mt-8 w-full max-w-[300px]">
            <button onClick={() => { setSavedCount(0); setStage("camera"); startCamera(); }}
              className="flex-1 h-12 rounded-2xl border border-neutral-700 text-white font-semibold text-sm"
              style={{ fontFamily: "var(--font-satoshi)" }}>
              Scan more
            </button>
            <button onClick={() => router.push("/records")}
              className="flex-1 h-12 rounded-2xl bg-spal-green text-white font-semibold text-sm"
              style={{ fontFamily: "var(--font-satoshi)" }}>
              View records
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>

      {/* ── Camera stage ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(stage === "camera" || stage === "processing") && (
          <motion.div
            key="camera"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Live video */}
            {!camError ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              /* Camera not available — show file picker */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                style={{ background: "#0F172A" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <Camera01Icon size={28} color="#fff" />
                </div>
                <div className="text-center px-8">
                  <p className="text-white font-semibold text-base" style={{ fontFamily: "var(--font-satoshi)" }}>
                    Camera not available
                  </p>
                  <p className="text-neutral-400 text-sm mt-1.5 leading-relaxed">
                    Upload a photo of your receipt, notebook, or notes instead.
                  </p>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="h-12 px-8 rounded-2xl bg-spal-green text-white font-semibold text-[14px]"
                  style={{ fontFamily: "var(--font-satoshi)" }}
                >
                  Choose photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleFilePick(e.target.files?.[0])} />
              </div>
            )}

            {/* Scan frame overlay */}
            {!camError && stage === "camera" && (
              <div className="absolute inset-0 flex flex-col">
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-36"
                  style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }} />

                {/* Corner brackets */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {[
                      "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
                      "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
                      "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
                      "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 border-spal-green ${cls}`} />
                    ))}
                    {/* Scanning line */}
                    <motion.div
                      animate={{ y: [0, 240, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-2 right-2 h-0.5"
                      style={{ background: "linear-gradient(to right, transparent, #22C55E, transparent)" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ZoomInAreaIcon size={18} color="rgba(255,255,255,0.3)" />
                    </div>
                  </div>
                </div>

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-52"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
              </div>
            )}

            {/* Flash effect */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  initial={{ opacity: 0.7 }} animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-white pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 pt-12 pb-4 px-5 flex items-center gap-3 z-10">
              <button
                onClick={() => { stopCamera(); router.back(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                aria-label="Back"
              >
                <ArrowLeft01Icon size={18} color="#fff" />
              </button>
              <span className="text-white text-[15px] font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>
                Quick Scan
              </span>
            </div>

            {/* Hint text */}
            {!camError && stage === "camera" && (
              <div className="absolute left-0 right-0 flex justify-center"
                style={{ top: "calc(50% + 140px)" }}>
                <p className="text-white/60 text-[12.5px] text-center" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Point at a receipt, notebook, or notes
                </p>
              </div>
            )}

            {/* Error toast */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute left-5 right-5 flex items-start gap-2.5 rounded-2xl px-4 py-3.5"
                  style={{ bottom: "140px", background: "rgba(239,68,68,0.9)", backdropFilter: "blur(8px)" }}
                >
                  <Alert01Icon size={16} color="#fff" className="mt-0.5 flex-shrink-0" />
                  <p className="text-white text-[12.5px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom controls */}
            {!camError && (
              <div className="absolute bottom-0 left-0 right-0 pb-12 px-5">
                <div className="flex items-center justify-center gap-8">
                  {/* Retake / empty placeholder */}
                  <div className="w-11" />

                  {/* Shutter */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={stage === "camera" ? captureFrame : undefined}
                    disabled={stage === "processing"}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.95)" }}
                    aria-label="Capture"
                  >
                    {stage === "processing" ? (
                      <div className="w-7 h-7 rounded-full border-[3px] border-neutral-300 border-t-spal-green animate-spin" />
                    ) : (
                      <ScanIcon size={28} color="#0F172A" />
                    )}
                  </motion.button>

                  {/* Gallery / file fallback */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                    aria-label="Upload from gallery"
                  >
                    <Camera01Icon size={18} color="#fff" />
                  </button>
                </div>
                {stage === "processing" && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center text-white/70 text-[12px] mt-4"
                    style={{ fontFamily: "var(--font-satoshi)" }}
                  >
                    Reading your records…
                  </motion.p>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleFilePick(e.target.files?.[0])} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Review stage ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === "review" && (
          <motion.div
            key="review"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute inset-0 flex flex-col"
            style={{ background: "#EEF3E9" }}
          >
            {/* Thumbnail strip at top */}
            {capturedUrl && (
              <div className="relative h-32 w-full flex-shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedUrl} alt="Scanned" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(248,247,244,1))" }} />
                {/* Back button */}
                <button
                  onClick={retake}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
                  aria-label="Retake"
                >
                  <ArrowLeft01Icon size={17} color="#0F172A" />
                </button>
                {/* Retake button */}
                <button
                  onClick={retake}
                  className="absolute top-4 right-4 flex items-center gap-1.5 h-9 px-3.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
                >
                  <ArrowReloadHorizontalIcon size={13} color="#0F172A" />
                  <span className="text-[12px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    Retake
                  </span>
                </button>
              </div>
            )}

            {/* Review content */}
            <div className="flex-1 overflow-y-auto px-5 pb-36 pt-3">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[20px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    Review records
                  </h2>
                  <p className="text-[12.5px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {records.length} found · check and fix before saving
                  </p>
                </div>
                {records.some(r => r.confidence === "low") && (
                  <span className="mt-1 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ background: "#FEF3C7", color: "#92400E", fontFamily: "var(--font-satoshi)" }}>
                    <Alert01Icon size={11} />
                    {records.filter(r => r.confidence === "low").length} to review
                  </span>
                )}
              </div>

              {/* Fallback date picker if any record has no date */}
              <AnimatePresence>
                {missingDateCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5"
                  >
                    <p className="text-[12px] font-semibold text-amber-800 mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>
                      {missingDateCount} {missingDateCount === 1 ? "record has" : "records have"} no date — set a fallback:
                    </p>
                    <input
                      type="date"
                      value={fallbackDate}
                      max={todayISO()}
                      onChange={e => setFallback(e.target.value)}
                      className="h-10 px-3 rounded-xl border-2 border-amber-200 bg-white text-[13px] text-spal-navy font-medium outline-none focus:border-spal-blue"
                      style={{ fontFamily: "var(--font-satoshi)" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {records.map(record => (
                    <ScanReviewCard
                      key={record._id}
                      record={record}
                      fallbackDate={fallbackDate}
                      onChange={patch => updateRecord(record._id, patch)}
                      onRemove={() => removeRecord(record._id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Save CTA */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pt-3 pb-8"
              style={{ background: "linear-gradient(to top, #EEF3E9 75%, transparent)" }}>
              <button
                onClick={handleSave}
                disabled={saving || records.length === 0}
                className="w-full h-14 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  background: "#22C55E",
                  boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                }}
              >
                {saving
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
                  : `Save ${records.length} ${records.length === 1 ? "record" : "records"}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ScanReviewCard ────────────────────────────────────────────────────────────

function ScanReviewCard({
  record, fallbackDate, onChange, onRemove,
}: {
  record:      ReviewRecord;
  fallbackDate: string;
  onChange:    (patch: Partial<ReviewRecord>) => void;
  onRemove:    () => void;
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
            SPAL isn&apos;t sure — please review
          </p>
        </div>
      )}
      <div className="px-4 py-3.5">
        {/* Type toggle + amount */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 flex-shrink-0">
            {(["sale", "expense"] as const).map(t => (
              <button
                key={t}
                onClick={() => onChange({ type: t, confidence: "high" })}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-bold transition-all duration-150"
                style={{
                  background: record.type === t ? (t === "sale" ? "#22C55E" : "#F97316") : "transparent",
                  color:      record.type === t ? "#fff" : "#9CA3AF",
                  fontFamily: "var(--font-satoshi)",
                }}
              >
                {t === "sale"
                  ? <ArrowUpRight01Icon   size={12} />
                  : <ArrowDownLeft01Icon  size={12} />}
                {t === "sale" ? "Sale" : "Expense"}
              </button>
            ))}
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
            <button onClick={() => { setEditingDesc(true); setTimeout(() => descRef.current?.focus(), 50); }}
              className="text-left w-full flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-spal-navy truncate flex-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                {record.description || <span className="text-neutral-300">Tap to add description</span>}
              </p>
              <PencilEdit01Icon size={12} className="text-neutral-300 flex-shrink-0" />
            </button>
          )}
          {record.category && (
            <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: record.type === "sale" ? "#F0FDF4" : "#FFF7ED",
                color:      record.type === "sale" ? "#16A34A" : "#EA580C",
              }}>
              {record.category}
            </span>
          )}
        </div>

        {/* Date + remove */}
        <div className="flex items-center justify-between">
          {editingDate ? (
            <input
              type="date"
              autoFocus
              value={record.record_date ?? fallbackDate}
              max={todayISO()}
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
              {record.record_date ? friendlyDate(record.record_date) : `Fallback · ${friendlyDate(fallbackDate)}`}
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
