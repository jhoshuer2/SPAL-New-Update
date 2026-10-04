"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore } from "@/store";
import { getAdvisor } from "@/lib/advisors/config";
import type { Badge } from "@/lib/gamification/badges";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type VoiceChatState =
  | "idle"        // waiting for user to tap mic
  | "listening"   // recording user's voice
  | "processing"  // transcribe + generate + TTS in flight
  | "speaking";   // AI audio is playing

// ─────────────────────────────────────────────────────────────────────────────
// Suggested prompts
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  ade:    ["How can I increase my sales this week?", "Help me set a sales goal", "Why am I not making more profit?", "What's my best product?"],
  chioma: ["Where am I wasting money?", "How can I cut my expenses?", "Help me create a spending budget", "What's my biggest cost?"],
  emeka:  ["Why don't I have cash when I'm selling?", "How do I manage money between market days?", "Help me plan my cash for the week", "What is cash flow?"],
  fatima: ["How much should I save every day?", "How do I build an emergency fund?", "I want to save ₦50,000 in 3 months", "Why is saving so hard?"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Voice chat overlay — full screen, voice-to-voice conversation
// ─────────────────────────────────────────────────────────────────────────────

function VoiceChatOverlay({
  advisorId,
  conversationId,
  onClose,
  onConversationId,
}: {
  advisorId: string;
  conversationId: string | null;
  onClose: () => void;
  onConversationId: (id: string) => void;
}) {
  const advisor = getAdvisor(advisorId);
  const { setNewBadge } = useSPALStore();

  const [state, setState]       = useState<VoiceChatState>("idle");
  const [lastUser, setLastUser] = useState("");
  const [lastAI, setLastAI]     = useState("");
  const [error, setError]       = useState("");

  // ── Refs — avoid stale closures inside async callbacks ─────────────────────
  const stateRef         = useRef<VoiceChatState>("idle");
  const convIdRef        = useRef<string | null>(conversationId);
  const isMountedRef     = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  // Web Audio API — immune to browser autoplay policy once context is resumed
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const audioSourceRef   = useRef<AudioBufferSourceNode | null>(null);
  // VAD (Voice Activity Detection) — auto-detects when user stops speaking
  const vadTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const vadSourceRef     = useRef<MediaStreamAudioSourceNode | null>(null);

  // Keep stateRef in sync so async callbacks always see the latest value
  const setStateBoth = useCallback((s: VoiceChatState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // ── Mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    // Auto-start listening when overlay opens (like ChatGPT / Gemini)
    const t = setTimeout(() => { if (isMountedRef.current) startListening(); }, 350);
    return () => {
      isMountedRef.current = false;
      clearTimeout(t);
      stopVAD();
      try { audioSourceRef.current?.stop(); } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop VAD polling ───────────────────────────────────────────────────────
  function stopVAD() {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null; }
    try { vadSourceRef.current?.disconnect(); } catch { /* ignore */ }
    vadSourceRef.current = null;
  }

  // ── Unlock AudioContext — must be called inside or near a user gesture ─────
  function unlockAudio() {
    if (!audioCtxRef.current) {
      try {
        // Use any-cast to handle webkitAudioContext (old Safari) without confusing bundlers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const W = window as any;
        audioCtxRef.current = new (W.AudioContext || W.webkitAudioContext)() as AudioContext;
      } catch { return; } // browser doesn't support Web Audio
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
  }

  // ── Start recording + VAD ─────────────────────────────────────────────────
  async function startListening() {
    if (!isMountedRef.current || stateRef.current !== "idle") return;
    setError("");
    unlockAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,   // prevents AI speaker audio feeding back into mic
          noiseSuppression: true,
          autoGainControl:  true,
        },
      });
      if (!isMountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stopVAD();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 1000) processVoice(blob, mimeType);
        else if (isMountedRef.current) setStateBoth("idle");
      };

      mr.start(250);
      setStateBoth("listening");

      // ── VAD: watch mic volume, auto-stop when silence is detected ─────────
      const ctx = audioCtxRef.current;
      if (ctx) {
        const vadSrc   = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        vadSrc.connect(analyser);
        vadSourceRef.current = vadSrc;

        const data        = new Uint8Array(analyser.frequencyBinCount);
        const SPEAK_THRESH  = 15;    // avg amplitude 0-255 that counts as speech
        const SILENCE_MS    = 1600;  // ms of continuous quiet → auto-send
        const MIN_SPEAK_MS  = 350;   // ignore silence until user has started speaking
        let silenceStart: number | null = null;
        let hasSpeech = false;
        const recStart    = Date.now();

        vadTimerRef.current = setInterval(() => {
          if (!isMountedRef.current || stateRef.current !== "listening") {
            stopVAD(); return;
          }
          analyser.getByteFrequencyData(data);
          const avg     = data.reduce((a, b) => a + b, 0) / data.length;
          const elapsed = Date.now() - recStart;

          if (avg > SPEAK_THRESH) {
            hasSpeech    = true;   // speech detected — reset silence clock
            silenceStart = null;
          } else if (hasSpeech && elapsed > MIN_SPEAK_MS) {
            // User was speaking but now it's quiet
            if (silenceStart === null) {
              silenceStart = Date.now();
            } else if (Date.now() - silenceStart > SILENCE_MS) {
              // Silence long enough → auto-send
              stopVAD();
              unlockAudio(); // keep AudioContext live for upcoming playback
              if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
              }
            }
          }
        }, 80); // ~12 checks/second
      }

    } catch {
      if (isMountedRef.current) {
        setError("Microphone access is required for voice chat.");
        setStateBoth("idle");
      }
    }
  }

  // ── Manual send — tap button to send immediately without waiting for silence
  function stopListening() {
    unlockAudio(); // synchronous user gesture keeps AudioContext running
    stopVAD();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  // ── Interrupt AI mid-speech → immediately restart listening ──────────────
  function interruptAI() {
    try { audioSourceRef.current?.stop(); } catch { /* ignore */ }
    audioSourceRef.current = null;
    setStateBoth("idle");
    scheduleRestart(300);
  }

  // ── Auto-restart helper (called after AI finishes or on no-speech) ─────────
  function scheduleRestart(delayMs = 600) {
    setTimeout(() => {
      if (isMountedRef.current && stateRef.current === "idle") startListening();
    }, delayMs);
  }

  // ── Play TTS audio via AudioContext (bypasses autoplay policy) ─────────────
  async function playBase64Audio(audioBase64: string) {
    const ctx = audioCtxRef.current;
    if (!ctx || !isMountedRef.current) { setStateBoth("idle"); return; }

    try {
      // Decode data-URL base64 → ArrayBuffer
      const b64  = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
      const bin  = atob(b64);
      const buf  = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

      const audioBuffer = await ctx.decodeAudioData(buf.buffer.slice(0));
      if (!isMountedRef.current) return;

      // Stop any previous playback
      try { audioSourceRef.current?.stop(); } catch { /* ignore */ }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      audioSourceRef.current = source;

      source.onended = () => {
        audioSourceRef.current = null;
        if (!isMountedRef.current) return;
        setStateBoth("idle");
        scheduleRestart(700); // auto-restart → hands-free conversation
      };

      source.start();
      setStateBoth("speaking");
    } catch (err) {
      console.error("Voice playback error:", err);
      if (isMountedRef.current) { setStateBoth("idle"); scheduleRestart(600); }
    }
  }

  // ── Main pipeline: audio → Whisper → GPT → TTS → play ────────────────────
  async function processVoice(blob: Blob, mimeType: string) {
    if (!isMountedRef.current) return;
    setStateBoth("processing");
    setLastUser("");

    try {
      const formData = new FormData();
      formData.append("audio",          blob, `recording.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
      formData.append("advisorId",      advisorId);
      formData.append("conversationId", convIdRef.current ?? "null");

      const res  = await fetch("/api/advisors/voice", { method: "POST", body: formData });
      if (!isMountedRef.current) return;
      const data = await res.json();

      if (!data.success) {
        if (data.error === "upgrade_required") { onClose(); return; }
        if (data.error === "no_speech") {
          // Didn't catch anything — silently restart instead of speaking an error
          if (isMountedRef.current) { setStateBoth("idle"); scheduleRestart(400); }
          return;
        }
        if (isMountedRef.current) { setError(data.error ?? "Something went wrong."); setStateBoth("idle"); }
        return;
      }

      const { userText, replyText, audioBase64, conversationId: newConvId, newBadges } = data.data;

      if (isMountedRef.current) { setLastUser(userText); setLastAI(replyText); }

      if (newConvId && newConvId !== convIdRef.current) {
        convIdRef.current = newConvId;
        onConversationId(newConvId);
      }

      if (newBadges?.length > 0) setTimeout(() => setNewBadge(newBadges[0] as Badge), 800);

      await playBase64Audio(audioBase64);
    } catch {
      if (isMountedRef.current) {
        setError("Connection error. Check your internet.");
        setStateBoth("idle");
      }
    }
  }

  // ── Avatar ring colour per advisor ────────────────────────────────────────
  const ringColors: Record<string, string> = {
    ade:    "rgba(29,185,84,",
    chioma: "rgba(249,115,22,",
    emeka:  "rgba(37,99,235,",
    fatima: "rgba(139,92,246,",
  };
  const ring = ringColors[advisorId] ?? "rgba(29,185,84,";

  if (!advisor) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col max-w-[480px] mx-auto"
      style={{ background: "linear-gradient(160deg, #0F172A 0%, #1e1b4b 60%, #0F172A 100%)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe pt-6 pb-3">
        <button
          onClick={() => { interruptAI(); onClose(); }}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm font-[family-name:var(--font-satoshi)]">{advisor.name}</p>
          <p className="text-white/50 text-xs">{advisor.title}</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Central avatar */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Animated avatar orb */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse rings — only when speaking */}
          {state === "speaking" && [1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ background: `${ring}0.08)` }}
              initial={{ width: 100, height: 100, opacity: 0 }}
              animate={{ width: 100 + i * 44, height: 100 + i * 44, opacity: [0, 0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
            />
          ))}

          {/* Listening ring */}
          {state === "listening" && (
            <motion.div
              className="absolute rounded-full border-2"
              style={{ borderColor: `${ring}0.6)`, width: 120, height: 120 }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Avatar circle */}
          <motion.div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl ${advisor.avatarColor} ${advisor.avatarTextColor}`}
            animate={
              state === "speaking"
                ? { scale: [1, 1.04, 1], transition: { duration: 0.5, repeat: Infinity } }
                : state === "processing"
                ? { scale: 0.95, opacity: 0.7 }
                : { scale: 1, opacity: 1 }
            }
          >
            {state === "processing" ? (
              <div className="w-8 h-8 border-3 border-white/40 border-t-white rounded-full animate-spin" style={{ borderWidth: 3 }} />
            ) : (
              advisor.avatarLetter
            )}
          </motion.div>
        </div>

        {/* Transcripts */}
        <div className="w-full max-w-xs text-center space-y-3">
          {lastUser && (
            <motion.p
              key={lastUser}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/40 text-sm italic"
            >
              &ldquo;{lastUser}&rdquo;
            </motion.p>
          )}

          <AnimatePresence mode="wait">
            <motion.p
              key={lastAI}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-white/90 text-base leading-relaxed font-medium"
            >
              {lastAI}
            </motion.p>
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-safe pb-10 flex flex-col items-center gap-4">

        {/* Status label */}
        <motion.p
          key={state}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/50 text-xs font-medium uppercase tracking-widest"
        >
          {state === "idle"       && "Starting…"}
          {state === "listening"  && "Listening…"}
          {state === "processing" && "Thinking…"}
          {state === "speaking"   && `${advisor.name} is speaking`}
        </motion.p>

        {/* Main action button */}
        {state === "speaking" ? (
          // Square — tap to interrupt, restarts listening
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={interruptAI}
            className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center active:bg-white/25 transition-colors"
            aria-label="Interrupt"
          >
            <div className="w-6 h-6 bg-white rounded-sm" />
          </motion.button>
        ) : state === "processing" ? (
          // Spinner while waiting for AI
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : state === "listening" ? (
          // Waveform animation — VAD auto-sends on silence.
          // Tap button = send immediately without waiting for silence timeout.
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={stopListening}
            className="w-20 h-20 rounded-full bg-red-500 shadow-lg shadow-red-500/40 flex items-center justify-center"
            aria-label="Send now"
          >
            <div className="flex items-end gap-[3px] h-7">
              {[0.5, 0.9, 0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-white rounded-full"
                  animate={{ scaleY: [h, 0.2, h] }}
                  transition={{ duration: 0.5 + (i % 3) * 0.1, repeat: Infinity, delay: i * 0.07 }}
                  style={{ height: "100%", transformOrigin: "bottom" }}
                />
              ))}
            </div>
          </motion.button>
        ) : (
          // Idle fallback — tap to restart if auto-start failed
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={startListening}
            className="w-20 h-20 rounded-full bg-white/20 border border-white/30 flex items-center justify-center active:bg-white/30 transition-colors shadow-lg"
            aria-label="Speak"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </motion.button>
        )}

        {/* Hint text — only show while listening so user knows VAD handles it */}
        <AnimatePresence>
          {state === "listening" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/25 text-[11px] text-center"
            >
              Auto-sends when you stop talking
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text chat waveform (used in text input bar voice)
// ─────────────────────────────────────────────────────────────────────────────

type TextVoiceState = "idle" | "recording" | "transcribing";

// ─────────────────────────────────────────────────────────────────────────────
// Main chat page
// ─────────────────────────────────────────────────────────────────────────────

function AdvisorChatContent() {
  const params       = useParams<{ advisorId: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { setNewBadge } = useSPALStore();

  const advisorId = params.advisorId;
  const advisor   = getAdvisor(advisorId);

  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [conversationId,  setConversationId]  = useState<string | null>(searchParams.get("convId") ?? null);
  const [error,           setError]           = useState("");
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [voiceModeOpen,   setVoiceModeOpen]   = useState(false);

  // Text-input voice recording
  const [textVoice,          setTextVoice]          = useState<TextVoiceState>("idle");
  const textMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textChunksRef        = useRef<Blob[]>([]);
  const textStreamRef        = useRef<MediaStream | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load existing conversation
  useEffect(() => {
    const convId = searchParams.get("convId");
    if (!convId || messages.length > 0) return;
    setLoadingHistory(true);
    fetch(`/api/advisors/conversations/${convId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.messages) {
          setMessages(
            d.data.messages.map((m: { role: string; content: string }, i: number) => ({
              id:      `hist-${i}`,
              role:    m.role as "user" | "assistant",
              content: m.content,
            }))
          );
          setConversationId(convId);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send a text message ───────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }]);
      setInput("");
      setError("");
      setLoading(true);

      try {
        const res  = await fetch("/api/advisors/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ advisorId, message: trimmed, conversationId }),
        });
        const data = await res.json();

        if (!data.success) {
          if (data.error === "upgrade_required") { router.push("/upgrade"); return; }
          setError(data.error ?? "Something went wrong.");
          return;
        }

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: data.data.reply },
        ]);
        if (data.data.conversationId) setConversationId(data.data.conversationId);
        if (data.data.newBadges?.length > 0) setNewBadge(data.data.newBadges[0] as Badge);
      } catch {
        setError("Can't reach advisor right now. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [advisorId, conversationId, loading, router, setNewBadge]
  );

  // ── Text input: voice-to-text tap-to-toggle ───────────────────────────────
  async function handleTextVoiceTap() {
    if (textVoice === "recording") { stopTextRecording(); return; }
    if (textVoice !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      textStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      textMediaRecorderRef.current = mr;
      textChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) textChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        textStreamRef.current?.getTracks().forEach((t) => t.stop());
        textStreamRef.current = null;
        const blob = new Blob(textChunksRef.current, { type: mimeType });
        if (blob.size < 1000) { setTextVoice("idle"); return; }
        setTextVoice("transcribing");
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res  = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.success && data.data?.text?.trim()) sendMessage(data.data.text.trim());
        } catch { /* silent */ }
        finally { setTextVoice("idle"); }
      };
      mr.start(250);
      setTextVoice("recording");
    } catch {
      setError("Microphone access denied.");
    }
  }

  function stopTextRecording() {
    if (textMediaRecorderRef.current?.state === "recording") textMediaRecorderRef.current.stop();
  }

  function cancelTextRecording() {
    if (textMediaRecorderRef.current?.state === "recording") {
      textMediaRecorderRef.current.onstop = null;
      textMediaRecorderRef.current.stop();
    }
    textStreamRef.current?.getTracks().forEach((t) => t.stop());
    textStreamRef.current = null;
    setTextVoice("idle");
  }

  if (!advisor) return <div className="flex items-center justify-center h-full"><p className="text-neutral-400">Advisor not found.</p></div>;

  const prompts = SUGGESTED_PROMPTS[advisorId] ?? [];

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 bg-spal-bg border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-neutral-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${advisor.avatarColor} ${advisor.avatarTextColor}`}>
              {advisor.avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-spal-navy font-[family-name:var(--font-satoshi)] leading-tight">{advisor.name}</h1>
              <p className="text-xs text-neutral-400">{advisor.title}</p>
            </div>
            {/* Voice mode button */}
            <button
              onClick={() => setVoiceModeOpen(true)}
              className="w-9 h-9 rounded-full bg-spal-purple-50 border border-spal-purple-100 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
              aria-label="Start voice conversation"
            >
              <svg className="w-4 h-4 text-spal-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setConversationId(null); setError(""); }}
                className="text-xs text-spal-blue font-semibold px-3 h-8 rounded-full bg-spal-blue/10 flex-shrink-0"
              >
                New
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scroll-container px-4 py-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-neutral-200 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyAdvisorChat advisor={advisor} prompts={prompts} onPrompt={sendMessage} onVoice={() => setVoiceModeOpen(true)} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                  >
                    {msg.role === "assistant" && (
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold mb-0.5 ${advisor.avatarColor} ${advisor.avatarTextColor}`}>
                        {advisor.avatarLetter}
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-spal-blue text-white rounded-br-md" : "bg-white text-spal-navy rounded-bl-md shadow-sm border border-neutral-100"}`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${advisor.avatarColor} ${advisor.avatarTextColor}`}>{advisor.avatarLetter}</div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-neutral-100">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-xs text-red-400 bg-red-50 rounded-xl px-4 py-2 inline-block">{error}</p>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <AnimatePresence mode="wait">
          {textVoice === "recording" ? (
            <motion.div key="rec" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white border-t border-neutral-100 px-6 pt-5 pb-safe flex-shrink-0">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-end gap-[3px] h-7">
                  {[0.5, 0.9, 0.6, 1, 0.7, 0.9, 0.5, 0.6, 0.8].map((h, i) => (
                    <motion.div key={i} className="w-[3px] bg-red-400 rounded-full"
                      animate={{ scaleY: [h, 0.2, h] }}
                      transition={{ duration: 0.6 + (i % 3) * 0.1, repeat: Infinity, delay: i * 0.06 }}
                      style={{ height: "100%", transformOrigin: "bottom" }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-neutral-500">Listening... tap stop when done</p>
                <div className="flex gap-3 w-full">
                  <button onClick={cancelTextRecording} className="flex-1 h-12 rounded-2xl bg-neutral-100 text-neutral-500 text-sm font-semibold">Cancel</button>
                  <button onClick={stopTextRecording} className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-sm" />Stop
                  </button>
                </div>
              </div>
            </motion.div>
          ) : textVoice === "transcribing" ? (
            <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white border-t border-neutral-100 px-6 pt-4 pb-safe flex-shrink-0">
              <div className="flex items-center justify-center gap-2 py-3">
                <div className="w-4 h-4 border-2 border-spal-blue border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-400">Transcribing...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="idle-bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-4 py-3 bg-white border-t border-neutral-100 pb-safe flex-shrink-0">
              <div className="flex items-center gap-2 bg-neutral-50 rounded-2xl px-3 h-12 border border-neutral-200 focus-within:border-spal-blue transition-colors">
                <motion.button onClick={handleTextVoiceTap} disabled={loading} whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 disabled:opacity-30">
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </motion.button>
                <input ref={inputRef} type="text" placeholder={`Ask ${advisor.name} anything...`}
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-spal-navy placeholder:text-neutral-300 outline-none disabled:opacity-60" />
                <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 bg-spal-blue rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice conversation overlay */}
      <AnimatePresence>
        {voiceModeOpen && (
          <VoiceChatOverlay
            advisorId={advisorId}
            conversationId={conversationId}
            onClose={() => setVoiceModeOpen(false)}
            onConversationId={(id) => setConversationId(id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state with voice mode CTA
// ─────────────────────────────────────────────────────────────────────────────

function EmptyAdvisorChat({
  advisor,
  prompts,
  onPrompt,
  onVoice,
}: {
  advisor: ReturnType<typeof getAdvisor>;
  prompts: string[];
  onPrompt: (s: string) => void;
  onVoice: () => void;
}) {
  if (!advisor) return null;
  return (
    <div className="flex flex-col h-full py-4">
      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-md ${advisor.avatarColor} ${advisor.avatarTextColor}`}
        >
          {advisor.avatarLetter}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">Hi! I&apos;m {advisor.name}</h2>
          <p className="text-sm text-neutral-400 mt-1 leading-relaxed max-w-xs mx-auto">{advisor.tagline}</p>
        </motion.div>
      </div>

      {/* Voice mode CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={onVoice}
        className={`mx-auto mb-5 flex items-center gap-3 px-5 py-3 rounded-2xl border active:scale-95 transition-transform ${advisor.avatarColor} shadow-md`}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span className={`text-sm font-bold ${advisor.avatarTextColor}`}>Talk to {advisor.name}</span>
      </motion.button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wide mb-3">Or type a question...</p>
        <div className="space-y-2.5">
          {prompts.map((prompt, i) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPrompt(prompt)}
              className="w-full text-left bg-white rounded-2xl px-4 py-3.5 text-sm text-spal-navy font-medium shadow-sm border border-neutral-100 active:bg-neutral-50 transition-colors"
            >
              <span className="mr-2">💬</span>{prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper
// ─────────────────────────────────────────────────────────────────────────────

export default function AdvisorChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-spal-blue border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdvisorChatContent />
    </Suspense>
  );
}
