"use client";
// I01 Feed: stories from other entrepreneurs. Tabs: For you, My level, Following (arrives with connections).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ErrorBlock, EmptyBlock, FF, PendingBlock, ScreenSkeleton, TopBar } from "@/components/journey/ui";
import { PostCard, ReportSheet } from "@/components/community/ui";
import type { FeedPost } from "@/lib/community/types";

const TABS = [["for_you", "For you"], ["level", "My level"], ["following", "Following"]] as const;

export default function Feed() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("for_you");
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [status, setStatus] = useState<"ok" | "error" | "pending">("ok");
  const [note, setNote] = useState("");
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState<FeedPost | null>(null);
  const [toast, setToast] = useState("");
  const gen = useRef(0);

  const load = useCallback((t: string, before?: string) => {
    const g = ++gen.current;
    const q = new URLSearchParams({ tab: t, ...(before ? { before } : {}) });
    fetch(`/api/community/feed?${q}`).then((r) => r.json()).then((j) => {
      if (g !== gen.current) return; // a newer tab was chosen meanwhile
      if (j.pending) return setStatus("pending");
      if (!j.success) return setStatus("error");
      setStatus("ok"); setNote(j.data.note ?? ""); setNext(j.data.next);
      setPosts((p) => (before ? [...(p ?? []), ...j.data.posts] : j.data.posts)); setMore(false);
    }).catch(() => g === gen.current && setStatus("error"));
  }, []);
  useEffect(() => { load(tab); }, [tab, load]);

  const patch = (id: string, fn: (p: FeedPost) => FeedPost) => setPosts((ps) => (ps ?? []).map((p) => (p.id === id ? fn(p) : p)));
  async function react(p: FeedPost) {
    const was = p.my_reaction;
    patch(p.id, (x) => ({ ...x, my_reaction: was ? null : "cheer", reaction_count: x.reaction_count + (was ? -1 : 1) })); // optimistic
    const j = await fetch(`/api/community/posts/${p.id}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: was ? null : "cheer" }) }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!j.success) patch(p.id, (x) => ({ ...x, my_reaction: was, reaction_count: p.reaction_count }));
  }
  async function save(p: FeedPost) {
    patch(p.id, (x) => ({ ...x, saved: !x.saved }));
    const j = await fetch(`/api/community/posts/${p.id}/save`, { method: "POST" }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!j.success) patch(p.id, (x) => ({ ...x, saved: p.saved }));
  }
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  return (
    <div data-testid="screen-I01" className="min-h-full pb-nav bg-spal-bg">
      <TopBar back={false} title="Community" right={<Link href="/community/post/new" style={{ fontFamily: FF }} className="h-10 px-4 rounded-full bg-[#22C55E] text-white text-[14px] font-bold flex items-center shadow-[var(--shadow-btn-green)] active:scale-95 transition-transform">Post</Link>} />
      <div className="px-5">
        <div className="flex bg-white rounded-full p-1 border border-neutral-200/70" role="tablist" aria-label="Feed">
          {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setPosts(null); setStatus("ok"); setTab(k); }} className={`flex-1 min-h-10 rounded-full text-[13px] font-bold transition-colors ${tab === k ? "bg-spal-navy text-white" : "text-neutral-500"}`}>{l}</button>)}
        </div>
      </div>

      {status === "error" && <ErrorBlock onRetry={() => load(tab)} />}
      {status === "pending" && <div className="px-5 mt-5"><PendingBlock /></div>}
      {status === "ok" && posts === null && <ScreenSkeleton />}
      {status === "ok" && posts && posts.length === 0 && (
        <div className="px-5 mt-5"><EmptyBlock title={tab === "following" ? "Following is coming" : "No posts yet"} body={note || (tab === "level" ? "No one at your level has posted yet. Be the first to share how it's going." : "Be the first to share a win, a struggle or a question.")} href={tab === "following" ? undefined : "/community/post/new"} cta={tab === "following" ? undefined : "Write a post"} /></div>
      )}
      {status === "ok" && posts && posts.length > 0 && (
        <div className="px-5 mt-4 space-y-3">
          {posts.map((p) => <PostCard key={p.id} post={p} onReact={react} onSave={save} onMenu={setMenu} />)}
          {next && <button type="button" disabled={more} onClick={() => { setMore(true); load(tab, next); }} className="w-full h-12 rounded-full bg-white border border-neutral-200 text-[14px] font-bold text-spal-navy disabled:opacity-50 active:scale-[0.98] transition-transform">{more ? "Loading…" : "Show more"}</button>}
        </div>
      )}

      <ReportSheet target={menu ? { type: "post", id: menu.id, mine: menu.is_mine } : null} onClose={() => setMenu(null)} onDone={flash} canDelete
        onDelete={async () => { if (!menu) return; const id = menu.id; setMenu(null); const j = await fetch(`/api/community/posts/${id}`, { method: "DELETE" }).then((r) => r.json()).catch(() => ({ success: false })); if (j.success) { setPosts((ps) => (ps ?? []).filter((p) => p.id !== id)); flash("Post deleted."); } else flash("Couldn't delete that. Please try again."); }} />
      {toast && <div role="status" className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,84px)+16px)] z-[90] flex justify-center px-4"><span className="rounded-full bg-spal-navy text-white text-[14px] px-4 py-2.5 shadow-[var(--shadow-card-lg)]">{toast}</span></div>}
    </div>
  );
}
