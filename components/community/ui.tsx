"use client";
// Community UI: avatar, post card, and the report & block sheet (I15).
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FF, cardCls } from "@/components/journey/ui";
import { REPORT_REASONS, timeAgo, type ReportReason } from "@/lib/engine/community";
import { LEVELS } from "@/lib/engine/levels";
import { BUSINESS_TYPE_LABEL } from "@/lib/engine/me";
import type { FeedPost } from "@/lib/community/types";
import type { Level } from "@/lib/engine/placement";

export function Avatar({ name, src, size = 40 }: { name: string | null; src?: string | null; size?: number }) {
  return (
    <span className="rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-[#D9C7B8]" style={{ width: size, height: size }} aria-hidden>
      {src ? <Image src={src} alt="" width={size} height={size} className="w-full h-full object-cover" /> : <span style={{ fontFamily: FF, fontSize: size * 0.42 }} className="text-white font-bold">{name ? name.charAt(0).toUpperCase() : "?"}</span>}
    </span>
  );
}

const TONE: Record<string, { bg: string; fg: string; label: string }> = {
  win: { bg: "#E7F6EC", fg: "#15803D", label: "Win" }, struggle: { bg: "#FFF3EC", fg: "#C2410C", label: "Struggle" },
  question: { bg: "#EAF0FC", fg: "#1D4ED8", label: "Question" }, update: { bg: "#F4F4F5", fg: "#3F3F46", label: "Update" }, milestone: { bg: "#EEE7FB", fg: "#6D28D9", label: "Milestone" },
};

export function PostCard({ post, onReact, onSave, onMenu, link = true, actions = true }: { post: FeedPost; onReact: (p: FeedPost) => void; onSave: (p: FeedPost) => void; onMenu: (p: FeedPost) => void; link?: boolean; actions?: boolean }) {
  const tone = TONE[post.type] ?? TONE.update;
  const who = post.anonymous ? "Anonymous member" : post.author_name ?? "Spal member";
  const head = (
    <div className="flex items-center gap-3">
      <Avatar name={post.anonymous ? null : post.author_name} src={post.author_avatar} />
      <span className="flex-1 min-w-0">
        <span style={{ fontFamily: FF }} className="block text-[15px] font-bold text-spal-navy truncate">{who}</span>
        <span className="block text-[12px] text-neutral-500 truncate">
          {post.author_level !== null && `Level ${post.author_level} · ${LEVELS[post.author_level as Level].name}`}
          {post.author_business_type && !post.anonymous ? ` · ${BUSINESS_TYPE_LABEL[post.author_business_type] ?? ""}` : ""} · {timeAgo(post.created_at)}
        </span>
      </span>
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: tone.bg, color: tone.fg }}>{tone.label}</span>
    </div>
  );
  return (
    <article className={`${cardCls} p-4`} data-testid="post-card">
      {post.anonymous || !post.author_id ? head : <Link href={`/community/people/${post.author_id}`} className="block active:opacity-70">{head}</Link>}
      <div className="mt-3">
        {link ? <Link href={`/community/post/${post.id}`} className="block"><p className="text-[15px] leading-relaxed text-spal-navy whitespace-pre-wrap">{post.body}</p></Link> : <p className="text-[15px] leading-relaxed text-spal-navy whitespace-pre-wrap">{post.body}</p>}
      </div>
      {post.attachment?.kind === "milestone" && (
        <div className="mt-3 rounded-2xl bg-[#EEE7FB] px-4 py-3"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6D28D9]">Milestone · Level {post.attachment.level}</p><p style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">{post.attachment.title}</p></div>
      )}
      {post.attachment?.kind === "moment" && (
        <div className="mt-3 rounded-2xl bg-spal-bg px-4 py-3"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">From their journey</p><p className="text-[14px] text-spal-navy leading-snug">{post.attachment.text}</p></div>
      )}
      {post.media_urls.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.media_urls.map((u) => <Image key={u} src={u} alt="Photo shared with this post" width={600} height={600} className="w-full h-44 object-cover rounded-xl bg-neutral-100" unoptimized />)}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1 -mx-2">
        {actions && <button type="button" onClick={() => onReact(post)} aria-pressed={!!post.my_reaction} aria-label={`Cheer, ${post.reaction_count} so far`}
          className={`min-h-11 px-3 rounded-full flex items-center gap-1.5 text-[14px] font-medium active:scale-95 transition-transform ${post.my_reaction ? "text-spal-green-700 bg-spal-green-50" : "text-neutral-600"}`}>
          <span aria-hidden>👏</span><span className="tabular-nums">{post.reaction_count}</span>
        </button>}
        <Link href={`/community/post/${post.id}`} aria-label={`${post.comment_count} comments`} className="min-h-11 px-3 rounded-full flex items-center gap-1.5 text-[14px] font-medium text-neutral-600 active:opacity-60"><span aria-hidden>💬</span><span className="tabular-nums">{post.comment_count}</span></Link>
        {actions && <button type="button" onClick={() => onSave(post)} aria-pressed={post.saved} aria-label={post.saved ? "Remove from saved" : "Save post"} className={`min-h-11 px-3 rounded-full text-[14px] font-medium active:opacity-60 ${post.saved ? "text-spal-navy" : "text-neutral-600"}`}>{post.saved ? "Saved" : "Save"}</button>}
        <span className="flex-1" />
        <button type="button" onClick={() => onMenu(post)} aria-label="More options" className="min-h-11 min-w-11 rounded-full text-[18px] text-neutral-500 active:bg-neutral-100">⋯</button>
      </div>
    </article>
  );
}

/** I15 Report & block. Works for posts and comments, including anonymous ones (the server finds the author; you never see who). */
export function ReportSheet(props: Parameters<typeof ReportSheetInner>[0]) {
  // Re-mount per target so the chosen reason and any error start fresh each time.
  return <ReportSheetInner key={props.target ? `${props.target.type}:${props.target.id}` : "closed"} {...props} />;
}

function ReportSheetInner({ target, onClose, onDone, canDelete, onDelete }: { target: { type: "post" | "comment"; id: string; mine: boolean } | null; onClose: () => void; onDone: (msg: string) => void; canDelete?: boolean; onDelete?: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (!target) return; const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [target, onClose]);

  async function call(url: string, body: object, done: string) {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
      if (!j.success) throw new Error(j.error);
      onDone(done); onClose();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again."); }
    setBusy(false);
  }
  return (
    <AnimatePresence>
      {target && (
        <div data-testid="screen-I15" className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Report or block">
          <motion.div className="absolute inset-0 bg-spal-navy/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(var(--sab)+20px)] max-h-[85vh] overflow-y-auto" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" aria-hidden />
            {target.mine ? (
              <>
                <h2 style={{ fontFamily: FF }} className="text-[20px] font-bold text-spal-navy">Your {target.type}</h2>
                {canDelete && <button type="button" onClick={onDelete} className="mt-4 w-full min-h-14 rounded-2xl bg-red-50 text-red-700 text-[15px] font-bold active:scale-[0.98] transition-transform">Delete this {target.type}</button>}
                <button type="button" onClick={onClose} className="mt-2 w-full min-h-12 text-[15px] text-neutral-600">Close</button>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: FF }} className="text-[20px] font-bold text-spal-navy">What&apos;s wrong?</h2>
                <p className="mt-1 text-[13px] text-neutral-500">Reports are private. We look at every one.</p>
                <div className="mt-3 space-y-2" role="radiogroup" aria-label="Reason">
                  {REPORT_REASONS.map((r) => (
                    <button key={r.key} type="button" role="radio" aria-checked={reason === r.key} onClick={() => setReason(r.key)} className={`w-full min-h-12 text-left rounded-2xl border px-4 text-[15px] transition-colors ${reason === r.key ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{r.label}</button>
                  ))}
                </div>
                {err && <p role="alert" className="mt-3 text-[14px] text-red-600">{err}</p>}
                <button type="button" disabled={!reason || busy} onClick={() => call("/api/community/report", { target_type: target.type, target_id: target.id, reason }, "Thanks. We'll take a look.")} style={{ fontFamily: FF }} className="mt-4 w-full h-14 rounded-full bg-spal-navy text-white text-[16px] font-bold disabled:opacity-40 active:scale-[0.98] transition-transform">{busy ? "Sending…" : "Send report"}</button>
                <button type="button" disabled={busy} onClick={() => call("/api/community/block", target.type === "post" ? { post_id: target.id } : { comment_id: target.id }, "Blocked. You won't see each other any more.")} className="mt-2 w-full min-h-12 text-[15px] font-medium text-red-700 active:opacity-60">Block this person</button>
                <p className="mt-2 text-[12px] text-neutral-500 leading-snug">Blocking hides you from each other everywhere in Spal. Never share money, bank details or your phone number with someone you&apos;ve just met here.</p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
