"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft01Icon } from "hugeicons-react";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  duration: number;
  created_at: string;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtDuration(secs: number) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ConversationPage() {
  const router   = useRouter();
  const { id }   = useParams<{ id: string }>();
  const [conv, setConv]     = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    fetch(`/api/conversations/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          // Title column may not exist on the row yet — derive from first message.
          const msgs = Array.isArray(d.data.messages) ? d.data.messages : [];
          const firstUser = msgs.find((m: Message) => m.role === "user");
          const title = d.data.title || (firstUser
            ? firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? "…" : "")
            : "Chat");
          setConv({ ...d.data, title });
        }
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#EEF3E9" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 mt-0.5"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
            aria-label="Back"
          >
            <ArrowLeft01Icon size={18} color="#0F172A" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-black text-spal-navy leading-snug truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
              {loading ? "Loading…" : conv?.title || "Untitled chat"}
            </h1>
            {conv && (
              <p className="text-[12.5px] text-neutral-400 mt-0.5">
                {new Date(conv.created_at).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                {fmtDuration(conv.duration) && ` · ${fmtDuration(conv.duration)}`}
              </p>
            )}
          </div>
        </div>

        {/* Read-only notice */}
        {conv && (
          <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-2.5 mt-4 border border-neutral-100">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5l-1.72 1.72a.75.75 0 001.06 1.06l2-2a.75.75 0 00.22-.53v-4.75z" fill="#8B3CFF" />
            </svg>
            <p className="text-[12px] text-neutral-500">This conversation is read-only. Start a new chat to continue.</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 px-5 pb-32 pt-2">
        {loading ? (
          <div className="space-y-4 mt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`h-12 rounded-2xl animate-pulse ${i % 2 === 0 ? "bg-purple-200 w-40" : "bg-white w-52"}`} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-bold text-spal-navy mb-2" style={{ fontFamily: "var(--font-satoshi)" }}>Couldn't load this chat</p>
            <p className="text-[13px] text-neutral-400">It may have been deleted or something went wrong.</p>
            <button
              onClick={() => router.back()}
              className="mt-5 h-10 px-5 rounded-full text-white text-[13px] font-bold"
              style={{ background: "#8B3CFF" }}
            >
              Go back
            </button>
          </div>
        ) : !conv?.messages?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] text-neutral-400">No messages in this conversation.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {conv.messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* SPAL avatar */}
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1" style={{ background: "linear-gradient(135deg, #B57BFF, #8B3CFF)" }}>
                    <Image src="/spal-ai.webp" alt="SPAL" width={28} height={28} className="w-full h-full object-contain" />
                  </div>
                )}

                <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className="px-4 py-3 text-[14px] leading-relaxed"
                    style={{
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: msg.role === "user" ? "#8B3CFF" : "#FFFFFF",
                      color: msg.role === "user" ? "#FFFFFF" : "#0F172A",
                      fontFamily: "var(--font-inter-tight, sans-serif)",
                      boxShadow: msg.role === "assistant" ? "0 1px 6px rgba(0,0,0,0.07)" : "none",
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[11px] text-neutral-400 px-1">{fmtTime(msg.timestamp)}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {conv && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", background: "linear-gradient(0deg, #EEF3E9 70%, transparent)" }}>
          <button
            onClick={() => router.push("/ask")}
            className="w-full h-[52px] rounded-full text-white font-bold text-[15px] active:scale-95 transition-transform"
            style={{ background: "#8B3CFF", fontFamily: "var(--font-satoshi)" }}
          >
            Start a new chat
          </button>
        </div>
      )}
    </div>
  );
}
