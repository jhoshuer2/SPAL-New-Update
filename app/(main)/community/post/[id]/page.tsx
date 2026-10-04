"use client";
// I02 Post detail: one post and its conversation. React, reply, report.
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, PostCard, ReportSheet } from "@/components/community/ui";
import { ErrorBlock, FF, PendingBlock, ScreenSkeleton, TopBar, cardCls } from "@/components/journey/ui";
import { MAX_COMMENT, timeAgo } from "@/lib/engine/community";
import { describeFindings, scanPrivate } from "@/lib/engine/privacy";
import type { CommentRow, FeedPost } from "@/lib/community/types";

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error" | "pending" | "gone">("loading");
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [menu, setMenu] = useState<{ type: "post" | "comment"; id: string; mine: boolean } | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    fetch(`/api/community/posts/${id}`).then((r) => r.json()).then((j) => {
      if (j.pending) return setStatus("pending");
      if (j.error && !j.success) return setStatus(j.error.includes("isn't available") ? "gone" : "error");
      setPost(j.data.post); setComments(j.data.comments); setStatus("ok");
    }).catch(() => setStatus("error"));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const findings = scanPrivate(text);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  async function react() {
    if (!post) return;
    const was = post.my_reaction;
    setPost({ ...post, my_reaction: was ? null : "cheer", reaction_count: post.reaction_count + (was ? -1 : 1) });
    const j = await fetch(`/api/community/posts/${id}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: was ? null : "cheer" }) }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!j.success) setPost((p) => (p ? { ...p, my_reaction: was, reaction_count: post.reaction_count } : p));
  }
  async function save() {
    if (!post) return;
    setPost({ ...post, saved: !post.saved });
    const j = await fetch(`/api/community/posts/${id}/save`, { method: "POST" }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!j.success) setPost((p) => (p ? { ...p, saved: post.saved } : p));
  }
  async function reply() {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch(`/api/community/posts/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, anonymous: anon, acknowledged: ack }) })).json();
      if (j.code === "needs_visibility") { setAnon(true); throw new Error("Your profile is hidden, so this comment would be anonymous. Tap send again to post it anonymously."); }
      if (!j.success) throw new Error(j.error);
      setText(""); setAck(false); load();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not comment. Please try again."); }
    setBusy(false);
  }

  return (
    <div data-testid="screen-I02" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Post" />
      {status === "loading" && <ScreenSkeleton />}
      {status === "error" && <ErrorBlock onRetry={load} />}
      {status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {status === "gone" && <div className="px-5"><div className={`${cardCls} p-6 text-center`}><p className="text-[15px] text-spal-navy">This post isn&apos;t available. It may have been removed.</p><Link href="/community" className="mt-3 inline-block text-[14px] font-bold underline">Back to the community</Link></div></div>}
      {status === "ok" && post && (
        <div className="px-5 space-y-4">
          <PostCard post={post} link={false} onReact={react} onSave={save} onMenu={() => setMenu({ type: "post", id: post.id, mine: post.is_mine })} />

          <section aria-label="Comments">
            <h2 style={{ fontFamily: FF }} className="text-[17px] font-bold text-spal-navy mb-3">{comments.length ? `${comments.length} ${comments.length === 1 ? "reply" : "replies"}` : "No replies yet"}</h2>
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className={`${cardCls} p-3.5`}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.anonymous ? null : c.author_name} src={c.author_avatar} size={32} />
                    <span className="flex-1 min-w-0 text-[14px] font-bold text-spal-navy truncate">{c.anonymous ? "Anonymous member" : c.author_name}{c.author_id === post.author_id && !post.anonymous && <span className="ml-1.5 text-[11px] font-bold text-spal-green-700">Author</span>}</span>
                    <span className="text-[12px] text-neutral-400">{timeAgo(c.created_at)}</span>
                    <button type="button" aria-label="More options" onClick={() => setMenu({ type: "comment", id: c.id, mine: c.is_mine })} className="min-h-11 min-w-9 text-[16px] text-neutral-500">⋯</button>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-snug text-spal-navy whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className={`${cardCls} p-4`}>
            <label htmlFor="reply" className="sr-only">Write a reply</label>
            <textarea id="reply" value={text} onChange={(e) => { setText(e.target.value); setAck(false); }} rows={3} maxLength={MAX_COMMENT} placeholder="Write a kind, useful reply…" className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-[15px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
            {findings.length > 0 && (
              <p role="alert" className="mt-2 text-[13px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">This mentions {describeFindings(findings)}. Replies are public. <button type="button" aria-pressed={ack} onClick={() => setAck(!ack)} className="font-bold underline min-h-8">{ack ? "OK, sharing it ✓" : "Share it anyway"}</button></p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button type="button" role="switch" aria-checked={anon} onClick={() => setAnon(!anon)} className="min-h-11 flex items-center gap-2 text-[13px] text-neutral-600"><span aria-hidden className={`w-9 h-5 rounded-full p-0.5 transition-colors ${anon ? "bg-spal-navy" : "bg-neutral-300"}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${anon ? "translate-x-4" : ""}`} /></span>Anonymous</button>
              <span className="flex-1" />
              <button type="button" onClick={reply} disabled={busy || !text.trim() || (findings.length > 0 && !ack)} style={{ fontFamily: FF }} className="h-11 px-6 rounded-full bg-[#22C55E] text-white text-[14px] font-bold disabled:bg-neutral-200 disabled:text-neutral-400 active:scale-95 transition-transform">{busy ? "Sending…" : "Reply"}</button>
            </div>
            {err && <p role="alert" className="mt-2 text-[13px] text-red-600">{err}</p>}
          </div>
        </div>
      )}

      <ReportSheet target={menu} onClose={() => setMenu(null)} onDone={flash} canDelete
        onDelete={async () => {
          if (!menu) return; const m = menu; setMenu(null);
          const j = await fetch(m.type === "post" ? `/api/community/posts/${m.id}` : `/api/community/comments/${m.id}`, { method: "DELETE" }).then((r) => r.json()).catch(() => ({ success: false }));
          if (!j.success) return flash("Couldn't delete that. Please try again.");
          if (m.type === "post") router.replace("/community"); else load();
        }} />
      {toast && <div role="status" className="fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4"><span className="rounded-full bg-spal-navy text-white text-[14px] px-4 py-2.5 shadow-[var(--shadow-card-lg)]">{toast}</span></div>}
    </div>
  );
}
