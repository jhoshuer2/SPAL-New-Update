"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft01Icon, Folder01Icon, MessageAdd01Icon, PlusSignSquareIcon,
  Mic01Icon, SentIcon, Image02Icon, File01Icon, ChartIncreaseIcon, Analytics01Icon, Cancel01Icon,
} from "hugeicons-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

const SUGGESTIONS = [
  "What is the price of rice in Kubwa?",
  "How much did I make in 2025?",
  "What is the price of tomatoes in Lagos?",
];

interface Msg { role: "user" | "assistant"; content: string }

export default function AskPage() {
  return <Suspense><AskInner /></Suspense>;
}

function AskInner() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [mode, setMode] = useState<"graph" | "analytics" | null>(null);
  const [attach, setAttach] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const attachRef = useRef<HTMLInputElement>(null);

  function pickAttachment() {
    setMenuOpen(false);
    setTimeout(() => attachRef.current?.click(), 0);
  }
  async function onAttach(files: FileList | null) {
    if (attachRef.current) attachRef.current.value = "";
    const file = files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setToast("Image must be less than 1MB"); setTimeout(() => setToast(""), 2400); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.success) setAttach({ url: d.url, name: file.name });
      else { setToast(d.error || "Upload failed"); setTimeout(() => setToast(""), 2400); }
    } catch { setToast("Upload failed"); setTimeout(() => setToast(""), 2400); }
    finally { setUploading(false); }
  }
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Honor a prefilled prompt set by other screens (Insights, Home orb, etc.).
  useEffect(() => {
    try {
      const pre = sessionStorage.getItem("spal_ask_prefill");
      if (pre) { sessionStorage.removeItem("spal_ask_prefill"); send(pre); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const msg = text.trim() || (attach ? "Please read this and answer for my business." : "");
    if (!msg || sending) return;
    const sendMode = mode; const sendAttach = attach;
    setInput(""); setMode(null); setAttach(null);
    setMessages((m) => [...m, { role: "user", content: sendAttach ? `📎 ${sendAttach.name}${text.trim() ? " — " + text.trim() : ""}` : msg }]);
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId, mode: sendMode, attachmentUrl: sendAttach?.url }),
      });
      const d = await res.json();
      if (d.success) {
        setMessages((m) => [...m, { role: "assistant", content: d.data.reply }]);
        if (d.data.conversationId) setConversationId(d.data.conversationId);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't answer that. Please try again." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Please check your connection." }]);
    } finally { setSending(false); }
  }

  async function toggleMic() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");
        try {
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
          const d = await res.json();
          if (d.success && d.data.text) setInput((prev) => (prev ? prev + " " : "") + d.data.text);
        } catch { /* ignore */ }
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch { setRecording(false); }
  }

  function newChat() { setMessages([]); setConversationId(null); setInput(""); }

  const empty = messages.length === 0 && !sending;

  return (
    <div className="flex flex-col" style={{ background: BG, fontFamily: FF, height: "100dvh" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { window.location.href = "/home"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
            <ArrowLeft01Icon size={20} color="#0F172A" />
          </button>
          <h1 className="text-[22px] font-black text-spal-navy tracking-wide" style={{ fontFamily: FF }}>ASK SPAL</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => { window.location.href = "/ask/folders"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Chat folders">
            <Folder01Icon size={19} color="#0F172A" />
          </button>
          <button onClick={() => { window.location.href = "/ask/history"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Chat history">
            <MessageAdd01Icon size={19} color="#0F172A" />
          </button>
        </div>
      </div>

      {/* Body */}
      {empty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Image src="/spal-ai.webp" alt="SPAL" width={140} height={140} className="w-32 h-32 object-contain" priority />
          <p className="text-[24px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>Start your first Conversation</p>
          <p className="text-[15px] text-neutral-500 mt-1.5 max-w-[300px]" style={{ fontFamily: FF }}>Ask SPAL anything you&apos;d like to know about your business</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => {
            if (m.role === "assistant") {
              const parsed = parseBlock(m.content);
              if (parsed) return <div key={i} className="flex justify-start"><div className="w-[90%]"><RichReply parsed={parsed} /></div></div>;
            }
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: FF, background: m.role === "user" ? "#22C55E" : "#fff",
                    color: m.role === "user" ? "#fff" : "#0F172A", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions (empty only) */}
      {empty && (
        <div className="px-5 space-y-3 mb-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="w-full text-left bg-white rounded-2xl px-5 py-4 text-[15px] font-medium text-spal-navy active:scale-[0.99] transition-transform"
              style={{ fontFamily: FF, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pt-2 pb-safe relative">
        <input ref={attachRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={(e) => onAttach(e.target.files)} />

        {/* Contextual + menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute left-4 bottom-[76px] z-50 bg-white rounded-2xl overflow-hidden py-1.5 w-56"
                style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.16)" }}>
                <MenuItem icon={<Image02Icon size={19} color="#16A34A" />} tint="#E7F6EC" label="Image upload" onClick={pickAttachment} />
                <MenuItem icon={<File01Icon size={19} color="#2563EB" />} tint="#EAF0FC" label="File upload" onClick={pickAttachment} />
                <MenuItem icon={<ChartIncreaseIcon size={19} color="#8B5CF6" />} tint="#EEE7FB" label="Graphs" onClick={() => { setMode("graph"); setMenuOpen(false); }} />
                <MenuItem icon={<Analytics01Icon size={19} color="#F97316" />} tint="#FDECDD" label="Analytics" onClick={() => { setMode("analytics"); setMenuOpen(false); }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Active mode / attachment chip */}
        {(mode || attach || uploading) && (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold"
              style={{ fontFamily: FF,
                background: mode === "graph" ? "#EEE7FB" : mode === "analytics" ? "#FDECDD" : "#EAF0FC",
                color: mode === "graph" ? "#8B5CF6" : mode === "analytics" ? "#F97316" : "#2563EB" }}>
              {uploading ? "Uploading…" : mode === "graph" ? "Graph mode" : mode === "analytics" ? "Analytics mode" : `📎 ${attach?.name}`}
              {!uploading && (
                <button onClick={() => { setMode(null); setAttach(null); }} aria-label="Clear"><Cancel01Icon size={13} /></button>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-full bg-white px-3"
          style={{ height: 60, border: "2px solid #C9B8F0", boxShadow: "0 6px 24px rgba(139,92,246,0.15)" }}>
          <button onClick={() => setMenuOpen((o) => !o)} className="w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90" aria-label="More options">
            <PlusSignSquareIcon size={24} color={menuOpen ? "#8B5CF6" : "#6B7280"} />
          </button>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask Anything.."
            className="flex-1 bg-transparent outline-none text-[16px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }}
          />
          <button onClick={toggleMic} className="w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90" aria-label="Voice to text">
            <Mic01Icon size={22} color={recording ? "#DC2626" : "#6B7280"} />
          </button>
          <button onClick={() => send(input)} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: input.trim() ? "#22C55E" : "#D6DDD2" }} aria-label="Send">
            <SentIcon size={18} color="#fff" />
          </button>
        </div>
        <AnimatePresence>
          {recording && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-[12.5px] font-semibold mt-2" style={{ color: "#DC2626", fontFamily: FF }}>
              Listening… tap the mic to stop
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.22 }} className="fixed left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-full"
            style={{ background: "#0F172A", bottom: 96, boxShadow: "0 10px 30px rgba(0,0,0,0.28)" }}>
            <span className="text-[14px] font-bold text-white" style={{ fontFamily: FF }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Parse a ```chart / ```analytics fenced JSON block from an assistant reply.
type Parsed =
  | { kind: "chart"; title?: string; chartType?: "bar" | "line"; data: { label: string; value: number }[]; summary?: string }
  | { kind: "analytics"; title?: string; metrics: { label: string; value: string }[]; summary?: string };

function parseBlock(content: string): Parsed | null {
  const m = content.match(/```(chart|analytics)\s*([\s\S]*?)```/i);
  if (!m) return null;
  try {
    const json = JSON.parse(m[2].trim());
    if (m[1].toLowerCase() === "chart" && Array.isArray(json.data)) {
      return { kind: "chart", title: json.title, chartType: json.chartType === "line" ? "line" : "bar", data: json.data, summary: json.summary };
    }
    if (m[1].toLowerCase() === "analytics" && Array.isArray(json.metrics)) {
      return { kind: "analytics", title: json.title, metrics: json.metrics, summary: json.summary };
    }
  } catch { /* fall through */ }
  return null;
}

function RichReply({ parsed }: { parsed: Parsed }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      {parsed.title && <p className="text-[15px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>{parsed.title}</p>}
      {parsed.kind === "chart" ? (
        <ResponsiveContainer width="100%" height={200}>
          {parsed.chartType === "line" ? (
            <LineChart data={parsed.data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A3AE" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#A1A3AE" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <BarChart data={parsed.data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="24%">
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A3AE" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#A1A3AE" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12 }} />
              <Bar dataKey="value" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {parsed.metrics.map((mm, i) => (
            <div key={i} className="rounded-2xl px-3.5 py-3" style={{ background: "#F1F4EE" }}>
              <p className="text-[12px] text-neutral-500" style={{ fontFamily: FF }}>{mm.label}</p>
              <p className="text-[18px] font-black text-spal-navy mt-0.5" style={{ fontFamily: FF }}>{mm.value}</p>
            </div>
          ))}
        </div>
      )}
      {parsed.summary && <p className="text-[13.5px] text-neutral-600 mt-3 leading-relaxed" style={{ fontFamily: FF }}>{parsed.summary}</p>}
    </div>
  );
}

function MenuItem({ icon, tint, label, onClick }: { icon: React.ReactNode; tint: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 active:bg-black/[0.03] transition-colors">
      <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint }}>{icon}</span>
      <span className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: FF }}>{label}</span>
    </button>
  );
}
