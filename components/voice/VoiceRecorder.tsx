"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | "listening"   // recording + silence detection running
  | "processing"  // transcribe + parse in flight
  | "confirming"  // parsed records shown, waiting for user confirmation
  | "saving"      // writing to DB
  | "done"        // success
  | "error";      // something went wrong

interface ParsedRecord {
  type: "sale" | "expense";
  amount: number;
  description: string;
  category: string;
}

// ── AI Orb ────────────────────────────────────────────────────────────────────

function AIOrb({ phase }: { phase: Phase }) {
  const isListening  = phase === "listening";
  const isProcessing = phase === "processing" || phase === "saving";
  const isDone       = phase === "done";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
      {/* Pulse rings — only while listening */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: 96 + i * 22, height: 96 + i * 22 }}
          animate={
            isListening
              ? { scale: [1, 1.25, 1], opacity: [0.35, 0, 0.35] }
              : { scale: 1, opacity: 0 }
          }
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
          // Green ring
          initial={false}
        >
          <div className="w-full h-full rounded-full border border-spal-green/30" />
        </motion.div>
      ))}

      {/* Core orb */}
      <motion.div
        animate={
          isDone       ? { scale: [1, 1.15, 1] }   :
          isProcessing ? { rotate: 360 }            :
          isListening  ? { scale: [1, 1.07, 1] }   :
          {}
        }
        transition={
          isDone       ? { duration: 0.5, ease: "easeOut" }                        :
          isProcessing ? { duration: 2, repeat: Infinity, ease: "linear" }         :
          isListening  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }    :
          {}
        }
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: isDone
            ? "#1DB954"
            : "linear-gradient(135deg, #1DB954 0%, #2563EB 100%)",
          boxShadow: isListening
            ? "0 0 48px rgba(29,185,84,0.55), 0 0 16px rgba(29,185,84,0.3)"
            : "0 0 24px rgba(29,185,84,0.25)",
        }}
      >
        {isDone ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="text-white text-2xl font-bold"
          >
            ✓
          </motion.span>
        ) : isProcessing ? (
          <motion.div
            className="w-7 h-7 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          /* Mic icon */
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 10a1 1 0 0 1 2 0 8 8 0 0 1-7 7.93V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.07A8 8 0 0 1 4 11a1 1 0 0 1 2 0 6 6 0 0 0 12 0z" />
          </svg>
        )}
      </motion.div>
    </div>
  );
}

// ── Chat bubbles ──────────────────────────────────────────────────────────────

function AIBubble({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", damping: 22, stiffness: 280 }}
      className="flex items-start gap-2.5 self-start max-w-[88%]"
    >
      {/* SPAL avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-spal-green to-spal-blue flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
        S
      </div>
      <div className="bg-white/10 rounded-2xl rounded-tl-md px-4 py-2.5 text-white/90 text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="self-end max-w-[82%]"
    >
      <div className="bg-spal-green/20 border border-spal-green/20 rounded-2xl rounded-tr-md px-4 py-2.5 text-white/80 text-sm leading-relaxed italic">
        &ldquo;{text}&rdquo;
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VoiceRecorder() {
  const { voiceRecorderOpen, setVoiceRecorderOpen, bumpRecordSaved, setNewBadge } = useSPALStore();

  const [phase,      setPhase]      = useState<Phase>("listening");
  const [transcript, setTranscript] = useState("");
  const [parsed,     setParsed]     = useState<ParsedRecord[]>([]);
  const [errorMsg,   setErrorMsg]   = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const mimeTypeRef      = useRef("");

  // ── Auto-start when overlay opens ─────────────────────────────────────────
  useEffect(() => {
    if (voiceRecorderOpen) {
      resetState();
      startRecording();
    } else {
      cleanup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceRecorderOpen]);

  function resetState() {
    setPhase("listening");
    setTranscript("");
    setParsed([]);
    setErrorMsg("");
  }

  function cleanup() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // ── Start recording (manual stop only) ───────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = (
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
          .find((m) => MediaRecorder.isTypeSupported(m))
      ) ?? "";
      mimeTypeRef.current    = mimeType;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        await processAudio(blob);
      };

      recorder.start(250);
    } catch (err) {
      console.error("[VoiceRecorder] getUserMedia:", err);
      setPhase("error");
      setErrorMsg("Microphone access denied. Please allow microphone and try again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doStop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }

  // ── Transcribe + parse ────────────────────────────────────────────────────
  async function processAudio(blob: Blob) {
    setPhase("processing");
    try {
      const formData = new FormData();
      const ext = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
      formData.append("audio", blob, `recording.${ext}`);

      const transcribeRes  = await fetch("/api/ai/transcribe", { method: "POST", body: formData });
      const transcribeData = await transcribeRes.json();

      if (!transcribeData.success) {
        setPhase("error");
        setErrorMsg(transcribeData.error ?? "Couldn't understand the recording.");
        return;
      }

      const text: string = transcribeData.data.text;
      setTranscript(text);

      const parseRes  = await fetch("/api/ai/parse-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const parseData = await parseRes.json();

      if (!parseData.success || !parseData.data?.length) {
        setPhase("error");
        setErrorMsg(
          "Couldn't find any sales or expenses in that. Try: \"Sold rice for 5k, bought fuel for 2k\""
        );
        return;
      }

      setParsed(parseData.data);
      setPhase("confirming");
    } catch {
      setPhase("error");
      setErrorMsg("Something went wrong. Check your connection and try again.");
    }
  }

  // ── Save records ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (!parsed.length) return;
    setPhase("saving");
    try {
      const responses = await Promise.all(
        parsed.map((r) =>
          fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type:         r.type,
              amount:       r.amount,
              description:  r.description || undefined,
              category:     r.category    || undefined,
              input_method: "voice",
              raw_input:    transcript,
            }),
          }).then((res) => res.json())
        )
      );
      // Show first badge earned (if any)
      for (const resp of responses) {
        if (resp.newBadges?.length > 0) {
          setTimeout(() => setNewBadge(resp.newBadges[0]), 1200);
          break;
        }
      }
      bumpRecordSaved(); // triggers home page refresh
      setPhase("done");
      setTimeout(() => setVoiceRecorderOpen(false), 2000);
    } catch {
      setPhase("error");
      setErrorMsg("Failed to save. Please try again.");
    }
  }

  function handleRetry() {
    resetState();
    startRecording();
  }

  if (!voiceRecorderOpen) return null;

  const isListening  = phase === "listening";
  const isProcessing = phase === "processing" || phase === "saving";
  const isConfirming = phase === "confirming";
  const isDone       = phase === "done";
  const isError      = phase === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      className="fixed inset-0 z-[70] flex flex-col max-w-[480px] mx-auto"
      style={{
        background:
          "linear-gradient(155deg, #07141f 0%, #0f172a 55%, #071a0e 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-spal-green to-spal-blue flex items-center justify-center text-white text-[10px] font-bold">
            S
          </div>
          <span className="text-white/60 text-sm font-medium">SPAL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-spal-green animate-pulse" />
        </div>
        <button
          onClick={() => setVoiceRecorderOpen(false)}
          className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/50 text-sm hover:bg-white/15 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 px-5 overflow-y-auto pb-4">

        {/* Opening message */}
        <AIBubble delay={0.1}>
          What did you sell or spend today? Just talk — I&apos;ll handle the rest.
        </AIBubble>

        {/* Orb — visible while listening or processing */}
        <AnimatePresence>
          {(isListening || isProcessing) && (
            <motion.div
              key="orb"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", damping: 22 }}
              className="flex flex-col items-center gap-5 py-6"
            >
              <AIOrb phase={phase} />

              <div className="text-center space-y-1">
                {isListening && (
                  <p className="text-white/80 text-sm font-medium">Listening…</p>
                )}
                {phase === "processing" && (
                  <p className="text-white/50 text-sm">Thinking…</p>
                )}
                {phase === "saving" && (
                  <p className="text-white/50 text-sm">Saving your records…</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User transcript bubble */}
        <AnimatePresence>
          {(isConfirming || isDone || isError) && transcript && (
            <UserBubble key="transcript" text={transcript} />
          )}
        </AnimatePresence>

        {/* AI confirms records */}
        {isConfirming && (
          <>
            <AIBubble delay={0.1}>
              Got it{parsed.length > 1 ? ` — I found ${parsed.length} records` : ""}:
            </AIBubble>

            <div className="space-y-2 pl-9">
              {parsed.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring", damping: 22 }}
                  className="flex items-center gap-3 bg-white/[0.07] rounded-2xl px-3.5 py-3"
                >
                  <span className="text-lg flex-shrink-0">
                    {r.type === "sale" ? "💰" : "🧾"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {r.description || r.category || (r.type === "sale" ? "Sale" : "Expense")}
                    </p>
                    {r.category && r.description && (
                      <p className="text-white/40 text-xs">{r.category}</p>
                    )}
                  </div>
                  <p
                    className={`font-bold text-sm flex-shrink-0 ${
                      r.type === "sale" ? "text-spal-green" : "text-orange-400"
                    }`}
                  >
                    {r.type === "sale" ? "+" : "-"}
                    {formatCurrency(r.amount)}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Success message */}
        {isDone && (
          <AIBubble delay={0.1}>
            All saved! 🎉{" "}
            {parsed.length} record{parsed.length !== 1 ? "s" : ""} added to your books.
          </AIBubble>
        )}

        {/* Error message */}
        {isError && (
          <AIBubble>
            <span className="text-red-300">{errorMsg}</span>
          </AIBubble>
        )}
      </div>

      {/* ── Bottom actions ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* Big stop button — user taps when they're done speaking */}
        {isListening && (
          <motion.div
            key="stop-btn"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ delay: 0.4 }}
            className="px-5 pb-10 pt-2 flex flex-col items-center gap-3 flex-shrink-0"
          >
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={doStop}
              className="w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base"
              style={{
                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                boxShadow: "0 4px 24px rgba(220,38,38,0.45)",
              }}
              aria-label="Stop recording"
            >
              <div className="w-5 h-5 bg-white rounded-sm flex-shrink-0" />
              Done — process my voice
            </motion.button>
            <p className="text-white/25 text-xs">Tap when you&apos;re finished speaking</p>
          </motion.div>
        )}

        {isConfirming && (
          <motion.div
            key="confirm-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3 }}
            className="px-5 pb-10 pt-3 flex gap-3 flex-shrink-0"
          >
            <button
              onClick={handleRetry}
              className="h-13 px-5 rounded-full border border-white/15 text-white/55 text-sm font-medium h-12 active:border-white/30 transition-colors"
            >
              Redo
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="flex-1 h-12 text-white font-bold text-sm rounded-full"
              style={{
                background: "linear-gradient(135deg, #1DB954, #18a348)",
                boxShadow: "0 4px 20px rgba(29,185,84,0.45)",
              }}
            >
              Save {parsed.length} record{parsed.length !== 1 ? "s" : ""} ✓
            </motion.button>
          </motion.div>
        )}

        {isError && (
          <motion.div
            key="error-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pb-10 pt-3 flex gap-3 flex-shrink-0"
          >
            <button
              onClick={() => setVoiceRecorderOpen(false)}
              className="h-12 px-5 rounded-full border border-white/15 text-white/55 text-sm font-medium"
            >
              Close
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRetry}
              className="flex-1 h-12 bg-spal-green text-white font-bold text-sm rounded-full"
            >
              Try again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
