"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cancel01Icon, Target01Icon, Mic01Icon, PencilEdit02Icon,
  ThumbsUpIcon, ThumbsDownIcon, Note04Icon, Loading03Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import type { CoachGoal } from "@/lib/types";

const GRADIENT = "linear-gradient(180deg, #7B92F0 0%, #9FB4EE 30%, #BFD3E6 55%, #CFE3D4 78%, #DDEBD4 100%)";

type Phase = "idle" | "recording" | "processing" | "done" | "error";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s} secs` : `${s} secs`;
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function GoalCapturePage() {
  const { addCoachGoals } = useSPALStore();

  const [phase, setPhase]           = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration]     = useState(0);
  const [feedback, setFeedback]     = useState<"up" | "down" | null>(null);
  const [typing, setTyping]         = useState(false);
  const [typedText, setTypedText]   = useState("");

  const recognitionRef = useRef<any>(null);
  const finalRef       = useRef("");
  const startTimeRef   = useRef<number | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef       = useRef(false);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  useEffect(() => {
    endedRef.current = false;
    return () => {
      endedRef.current = true;
      stopTimer();
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    };
  }, []);

  // ── Send transcript → AI → store ──────────────────────────────────────────
  const processTranscript = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) { setPhase("idle"); return; }
    setPhase("processing");
    try {
      const res = await fetch("/api/ai/extract-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: clean }),
      });
      const data = await res.json();
      if (endedRef.current) return;
      const rawGoals: { title: string; breakdowns: string[] }[] = data?.data?.goals ?? [];
      if (!data.success || rawGoals.length === 0) { setPhase("error"); return; }

      const now = new Date().toISOString();
      const goals: CoachGoal[] = rawGoals.map((g) => ({
        id: newId(),
        title: g.title,
        createdAt: now,
        dueDate: null,
        status: "active",
        progress: 0,
        breakdowns: g.breakdowns.map((b) => ({ id: newId(), title: b, completed: false })),
      }));
      addCoachGoals(goals);
      setPhase("done");
    } catch {
      if (!endedRef.current) setPhase("error");
    }
  }, [addCoachGoals]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  function startRecording() {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { setTyping(true); return; } // fall back to typing if unsupported

    finalRef.current = "";
    setTranscript("");
    setDuration(0);
    startTimeRef.current = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0]?.transcript ?? "";
        if (e.results[i].isFinal) finalRef.current += seg + " ";
        else interim += seg;
      }
      setTranscript((finalRef.current + interim).trim());
    };
    r.onerror = () => { /* keep whatever we have; stop handler will fire */ };
    r.onend = () => {
      recognitionRef.current = null;
      stopTimer();
      if (endedRef.current) return;
      // Only auto-process if the user pressed stop (phase set to processing-intent)
    };

    recognitionRef.current = r;
    setPhase("recording");
    try { r.start(); } catch { /* already started */ }
  }

  function stopRecording() {
    stopTimer();
    const finalText = (finalRef.current + " " + transcript).trim() || transcript.trim();
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    processTranscript(finalText);
  }

  function submitTyped() {
    const t = typedText.trim();
    if (!t) return;
    setTyping(false);
    setTranscript(t);
    processTranscript(t);
  }

  function resetForAnother() {
    setPhase("idle");
    setTranscript("");
    setTypedText("");
    setFeedback(null);
    setDuration(0);
    finalRef.current = "";
  }

  const isRecording = phase === "recording";

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden" style={{ background: GRADIENT }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={() => { window.location.href = "/home"; }}
          aria-label="Close"
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
        >
          <Cancel01Icon size={18} color="#121212" />
        </button>
        <button
          onClick={() => { window.location.href = "/set-goals/list"; }}
          aria-label="Your goals"
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
        >
          <Target01Icon size={20} color="#121212" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="font-black leading-tight mb-5" style={{ color: "#121212", fontFamily: "var(--font-satoshi)", fontSize: "clamp(28px, 8vw, 40px)", letterSpacing: "-0.02em" }}>
                I&apos;ll be listening, tell me what your goals are for today
              </h1>
              <p className="text-[16px] leading-relaxed" style={{ color: "#3A4252", fontFamily: "var(--font-satoshi)" }}>
                For example say &lsquo;I will record all business sales before closing for the day&rsquo;
              </p>
            </motion.div>
          )}

          {isRecording && (
            <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <p className="font-bold leading-snug" style={{ color: "#121212", fontFamily: "var(--font-satoshi)", fontSize: "clamp(24px, 7vw, 34px)", letterSpacing: "-0.01em" }}>
                {transcript || "Listening…"}
              </p>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mb-4">
                <Loading03Icon size={32} color="#22C55E" />
              </motion.div>
              <p className="text-[17px] font-semibold" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>
                SPAL is planning your goals…
              </p>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <p className="text-[18px] font-bold mb-2" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>
                I didn&apos;t quite catch that
              </p>
              <p className="text-[14px] mb-5" style={{ color: "#3A4252", fontFamily: "var(--font-satoshi)" }}>
                Try again and tell me your goals for today.
              </p>
              <button
                onClick={resetForAnother}
                className="h-11 px-6 rounded-full text-white font-bold text-[14px] active:scale-95 transition-transform"
                style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-5 pb-10" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}>
        {/* Ended summary cards */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              key="done-cards"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3 mb-6"
            >
              <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <Target01Icon size={20} color="#121212" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>Voice chat has ended</p>
                  <p className="text-[12px] text-neutral-500 mt-0.5">You spoke for {fmtDuration(duration)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setFeedback("up")} aria-label="Helpful" className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90" style={{ background: feedback === "up" ? "#DCFCE7" : "transparent" }}>
                    <ThumbsUpIcon size={15} color={feedback === "up" ? "#16A34A" : "#9CA3AF"} />
                  </button>
                  <button onClick={() => setFeedback("down")} aria-label="Not helpful" className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90" style={{ background: feedback === "down" ? "#FEE2E2" : "transparent" }}>
                    <ThumbsDownIcon size={15} color={feedback === "down" ? "#DC2626" : "#9CA3AF"} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => { window.location.href = "/set-goals/list"; }}
                className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
              >
                <p className="flex-1 text-[14px] font-bold leading-snug" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>
                  Click on the goals list page to see your goals
                </p>
                <Note04Icon size={20} color="#121212" className="flex-shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic + pencil row (hidden during processing) */}
        {phase !== "processing" && (
          <div className="flex items-center justify-center gap-5">
            <div className="relative flex items-center justify-center">
              {/* Pulsing rings */}
              {(phase === "idle" || phase === "done") && (
                <motion.span
                  className="absolute rounded-full"
                  style={{ width: 140, height: 140, background: isRecording ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)" }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              {isRecording && (
                <motion.span
                  className="absolute rounded-full"
                  style={{ width: 140, height: 140, background: "rgba(239,68,68,0.22)" }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? "Stop and plan" : "Start speaking"}
                className="relative w-24 h-24 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                style={{
                  background: isRecording ? "#EF4444" : "#22C55E",
                  boxShadow: isRecording ? "0 8px 24px rgba(239,68,68,0.45)" : "0 8px 24px rgba(34,197,94,0.45)",
                }}
              >
                {isRecording ? (
                  <span className="w-7 h-7 rounded-md border-[3px] border-white" />
                ) : (
                  <Mic01Icon size={30} color="#fff" />
                )}
              </button>
            </div>

            <button
              onClick={() => setTyping(true)}
              aria-label="Type your goals instead"
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
            >
              <PencilEdit02Icon size={18} color="#22C55E" />
            </button>
          </div>
        )}
      </div>

      {/* Typing sheet */}
      <AnimatePresence>
        {typing && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(15,23,42,0.35)" }}
            onClick={() => setTyping(false)}
          >
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl px-5 pt-5"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
            >
              <p className="text-[16px] font-bold mb-3" style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}>
                Type your goals
              </p>
              <textarea
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                autoFocus
                rows={3}
                placeholder="e.g. I want to record all my sales and make at least ₦25,000 today"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-[15px] outline-none focus:border-spal-green resize-none"
                style={{ color: "#121212", fontFamily: "var(--font-satoshi)" }}
              />
              <button
                onClick={submitTyped}
                disabled={!typedText.trim()}
                className="w-full h-12 rounded-2xl text-white font-bold text-[15px] mt-3 active:scale-[0.98] transition-transform disabled:opacity-40"
                style={{ background: "#22C55E", fontFamily: "var(--font-satoshi)" }}
              >
                Plan my goals
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
