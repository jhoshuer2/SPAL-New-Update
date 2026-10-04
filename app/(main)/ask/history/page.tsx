"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon, Folder01Icon, MessageAdd01Icon, Search01Icon, Calendar03Icon, Delete02Icon } from "hugeicons-react";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

interface Conversation {
  id: string;
  title: string;
  messages: { role: string; content: string; timestamp: string }[];
  created_at: string;
  updated_at: string;
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = isoDate(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (isoDate(d) === today) return "Today";
  if (isoDate(d) === isoDate(y)) return "Yesterday";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export default function AskHistoryPage() {
  const router = useRouter();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/conversations").then((r) => r.json())
      .then((d) => { if (d.success) setConvs(d.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function del(id: string) {
    setConvs((c) => c.filter((x) => x.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = convs.filter((c) => !q || (c.title ?? "").toLowerCase().includes(q));
    const map = new Map<string, Conversation[]>();
    for (const c of filtered) {
      const key = (c.updated_at ?? c.created_at).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [convs, query]);

  return (
    <div className="min-h-full pb-16" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
            <ArrowLeft01Icon size={20} color="#0F172A" />
          </button>
          <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>Chat History</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => { window.location.href = "/ask/folders"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Chat folders">
            <Folder01Icon size={19} color="#0F172A" />
          </button>
          <button onClick={() => { window.location.href = "/ask"; }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="New chat">
            <MessageAdd01Icon size={19} color="#0F172A" />
          </button>
        </div>
      </div>

      {/* Search + calendar */}
      <div className="px-5 mt-3 flex items-center gap-2.5">
        <div className="flex-1 flex items-center gap-2.5 bg-white/70 rounded-2xl px-4" style={{ height: 52 }}>
          <Search01Icon size={18} color="#9CA3AF" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for any chat..."
            className="flex-1 bg-transparent outline-none text-[14px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
        </div>
        <button className="rounded-2xl flex items-center justify-center active:scale-95" style={{ background: "#22C55E", height: 52, width: 52 }} aria-label="Filter by date">
          <Calendar03Icon size={22} color="#fff" />
        </button>
      </div>

      {/* List */}
      <div className="px-5 mt-5">
        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[64px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center" style={{ paddingTop: "20vh" }}>
            <p className="text-[18px] font-black text-spal-navy" style={{ fontFamily: FF }}>No chats yet</p>
            <p className="text-[14px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Start a conversation with SPAL.</p>
            <button onClick={() => { window.location.href = "/ask"; }}
              className="mt-5 h-12 px-6 rounded-full text-white font-black text-[15px] active:scale-95" style={{ background: "#22C55E", fontFamily: FF }}>
              Chat with SPAL
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, rows]) => (
              <div key={date}>
                <p className="text-[15px] font-black text-neutral-500 mb-3" style={{ fontFamily: FF }}>{dayLabel(date)}</p>
                <div className="space-y-2.5">
                  {rows.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="group relative">
                      <button onClick={() => router.push(`/ask/history/${c.id}`)}
                        className="w-full text-left bg-white rounded-2xl px-5 py-4 active:scale-[0.99] transition-transform"
                        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                        <p className="text-[15px] font-bold text-spal-navy truncate pr-8" style={{ fontFamily: FF }}>{c.title || "Untitled chat"}</p>
                      </button>
                      <button onClick={() => del(c.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "#FEE0E1" }} aria-label="Delete chat">
                        <Delete02Icon size={15} color="#DC2626" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
