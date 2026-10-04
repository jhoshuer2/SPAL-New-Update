"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, MessageAdd01Icon, PlusSignIcon, Folder01Icon, Tick01Icon, Delete02Icon, Cancel01Icon } from "hugeicons-react";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

interface Folder { id: string; name: string; count: number }
interface Conv { id: string; title: string; folder_id?: string | null }

export default function FoldersPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [moveFor, setMoveFor] = useState<Conv | null>(null); // chat being moved

  const load = useCallback(async () => {
    try {
      const [f, c] = await Promise.all([
        fetch("/api/chat-folders").then((r) => r.json()),
        fetch("/api/conversations").then((r) => r.json()),
      ]);
      if (f.success) setFolders(f.data ?? []);
      if (c.success) setConvs(c.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function createFolder() {
    const name = newName.trim();
    setCreating(false); setNewName("");
    if (!name) return;
    const res = await fetch("/api/chat-folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await res.json();
    if (d.success) setFolders((f) => [...f, d.data]);
  }

  async function deleteFolder(id: string) {
    setFolders((f) => f.filter((x) => x.id !== id));
    if (activeFolder === id) setActiveFolder(null);
    setConvs((c) => c.map((x) => x.folder_id === id ? { ...x, folder_id: null } : x));
    await fetch(`/api/chat-folders/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function moveChat(convId: string, folderId: string | null) {
    setConvs((c) => c.map((x) => x.id === convId ? { ...x, folder_id: folderId } : x));
    setFolders((f) => f.map((fd) => ({ ...fd, count: convs.filter((x) => (x.id === convId ? folderId : x.folder_id) === fd.id).length })));
    setMoveFor(null);
    await fetch(`/api/conversations/${convId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder_id: folderId }) }).catch(() => {});
    load();
  }

  const shown = useMemo(
    () => activeFolder ? convs.filter((c) => c.folder_id === activeFolder) : convs,
    [convs, activeFolder]
  );

  return (
    <div className="min-h-full pb-16" style={{ background: BG, fontFamily: FF }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95" aria-label="Back">
            <ArrowLeft01Icon size={20} color="#0F172A" />
          </button>
          <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>Folders</h1>
        </div>
        <button onClick={() => { window.location.href = "/ask/history"; }}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95" aria-label="Chat history">
          <MessageAdd01Icon size={19} color="#0F172A" />
        </button>
      </div>

      {/* Folder cards */}
      <div className="px-5 mt-3">
        <div className="flex overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", gap: 12 }}>
          <FolderCard label="All Chats" count={convs.length} active={activeFolder === null} onClick={() => setActiveFolder(null)} />
          {folders.map((f) => (
            <FolderCard key={f.id} label={f.name} count={f.count} active={activeFolder === f.id}
              onClick={() => setActiveFolder(f.id)} onDelete={() => deleteFolder(f.id)} />
          ))}
          {/* New folder */}
          <button onClick={() => setCreating(true)} className="snap-start shrink-0 text-left active:scale-[0.98] transition-transform" style={{ width: 150 }}>
            <div className="w-12 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: "#16A34A" }} />
            <div className="rounded-2xl rounded-tl-none px-4 py-5 flex flex-col justify-center" style={{ background: "#22C55E", minHeight: 92 }}>
              <PlusSignIcon size={22} color="#fff" />
              <p className="text-[17px] font-black leading-tight mt-1 text-white" style={{ fontFamily: FF }}>New Folder</p>
            </div>
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="px-5 mt-6">
        <p className="text-[15px] font-black text-neutral-500 mb-3" style={{ fontFamily: FF }}>
          {activeFolder ? folders.find((f) => f.id === activeFolder)?.name ?? "Folder" : "All Chats"}
        </p>
        {loading ? (
          <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-[60px] bg-white rounded-2xl animate-pulse" />)}</div>
        ) : shown.length === 0 ? (
          <p className="text-center text-[14px] text-neutral-400 pt-10" style={{ fontFamily: FF }}>No chats here yet.</p>
        ) : (
          <div className="space-y-2.5">
            {shown.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <button onClick={() => router.push(`/ask/history/${c.id}`)} className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] font-bold text-spal-navy truncate" style={{ fontFamily: FF }}>{c.title || "Untitled chat"}</p>
                </button>
                <button onClick={() => setMoveFor(c)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90" style={{ background: "#EEF3E9" }} aria-label="Move to folder">
                  <Folder01Icon size={17} color="#16A34A" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create folder sheet */}
      <AnimatePresence>
        {creating && (
          <Sheet onClose={() => { setCreating(false); setNewName(""); }} title="New Folder">
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
              placeholder="Folder name" className="w-full rounded-2xl px-4 bg-white text-[15px] text-spal-navy outline-none"
              style={{ fontFamily: FF, height: 56, border: "1.5px solid #22C55E" }} />
            <button onClick={createFolder} disabled={!newName.trim()}
              className="w-full h-14 rounded-full text-white font-black text-[16px] mt-4 active:scale-[0.98] disabled:opacity-40" style={{ background: "#22C55E", fontFamily: FF }}>
              Create Folder
            </button>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Move-to-folder sheet */}
      <AnimatePresence>
        {moveFor && (
          <Sheet onClose={() => setMoveFor(null)} title="Move to folder">
            <div className="space-y-2.5">
              <MoveRow label="Unfiled" active={!moveFor.folder_id} onClick={() => moveChat(moveFor.id, null)} />
              {folders.map((f) => (
                <MoveRow key={f.id} label={f.name} active={moveFor.folder_id === f.id} onClick={() => moveChat(moveFor.id, f.id)} />
              ))}
              {folders.length === 0 && <p className="text-center text-[13px] text-neutral-400 py-2" style={{ fontFamily: FF }}>Create a folder first.</p>}
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderCard({ label, count, active, onClick, onDelete }: { label: string; count: number; active: boolean; onClick: () => void; onDelete?: () => void }) {
  return (
    <div className="snap-start shrink-0 relative" style={{ width: 150 }}>
      <button onClick={onClick} className="text-left w-full active:scale-[0.98] transition-transform">
        <div className="w-12 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: active ? "#22C55E" : "#fff" }} />
        <div className="rounded-2xl rounded-tl-none px-4 py-5 flex flex-col justify-center" style={{ background: active ? "#22C55E" : "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", minHeight: 92 }}>
          <p className="text-[17px] font-black leading-tight truncate" style={{ fontFamily: FF, color: active ? "#fff" : "#0F172A" }}>{label}</p>
          <p className="text-[13px] mt-1" style={{ fontFamily: FF, color: active ? "rgba(255,255,255,0.85)" : "#9CA3AF" }}>{count} Chat{count !== 1 ? "s" : ""}</p>
        </div>
      </button>
      {onDelete && (
        <button onClick={onDelete} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }} aria-label="Delete folder">
          <Delete02Icon size={12} color="#DC2626" />
        </button>
      )}
    </div>
  );
}

function MoveRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between rounded-2xl px-4 py-4 active:scale-[0.99]"
      style={{ background: "#F1F4EE" }}>
      <span className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: FF }}>{label}</span>
      {active && <Tick01Icon size={16} color="#22C55E" />}
    </button>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]" style={{ background: "rgba(10,14,26,0.4)" }} onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-[28px] bg-white px-5 pt-4 pb-safe" style={{ fontFamily: FF }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-black text-spal-navy" style={{ fontFamily: FF }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(15,23,42,0.06)" }} aria-label="Close">
            <Cancel01Icon size={16} />
          </button>
        </div>
        <div className="pb-6">{children}</div>
      </motion.div>
    </>
  );
}
