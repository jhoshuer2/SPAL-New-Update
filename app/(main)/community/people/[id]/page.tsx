"use client";
// I09 Entrepreneur profile: a public view of someone's journey. Only what the privacy-safe views allow.
import { use, useCallback, useEffect, useState } from "react";
import { Avatar, PostCard, ReportSheet } from "@/components/community/ui";
import { EmptyBlock, ErrorBlock, FF, PendingBlock, ScreenSkeleton, TopBar, cardCls } from "@/components/journey/ui";
import { LEVELS } from "@/lib/engine/levels";
import { BUSINESS_TYPE_LABEL } from "@/lib/engine/me";
import type { FeedPost } from "@/lib/community/types";
import type { Level } from "@/lib/engine/placement";

type Profile = { id: string; display_name: string; avatar_url: string | null; bio: string | null; current_level: number; state: string | null; business_type: string | null; created_at: string; is_me: boolean };

export default function Person({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prof, setProf] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error" | "pending" | "gone">("loading");
  const [menu, setMenu] = useState<FeedPost | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    fetch(`/api/community/people/${id}`).then((r) => r.json()).then((j) => {
      if (j.pending) return setStatus("pending");
      if (!j.success) return setStatus(j.error?.includes("isn't available") ? "gone" : "error");
      setProf(j.data.profile); setPosts(j.data.posts); setStatus("ok");
    }).catch(() => setStatus("error"));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const noop = () => {};
  return (
    <div data-testid="screen-I09" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Profile" />
      {status === "loading" && <ScreenSkeleton />}
      {status === "error" && <ErrorBlock onRetry={load} />}
      {status === "pending" && <div className="px-5"><PendingBlock /></div>}
      {status === "gone" && <div className="px-5"><EmptyBlock title="Profile not available" body="This person's profile is private, or it doesn't exist." href="/community" cta="Back to the community" /></div>}
      {status === "ok" && prof && (
        <div className="px-5 space-y-4">
          <div className={`${cardCls} p-5 text-center`}>
            <div className="flex justify-center"><Avatar name={prof.display_name} src={prof.avatar_url} size={72} /></div>
            <h1 style={{ fontFamily: FF }} className="mt-3 text-[24px] font-bold text-spal-navy">{prof.display_name}</h1>
            <p className="mt-0.5 text-[14px] text-neutral-600">Level {prof.current_level} · {LEVELS[prof.current_level as Level].name}</p>
            <p className="text-[13px] text-neutral-500">{[prof.business_type && BUSINESS_TYPE_LABEL[prof.business_type], prof.state].filter(Boolean).join(" · ")}</p>
            {prof.bio && <p className="mt-3 text-[15px] text-spal-navy leading-snug">{prof.bio}</p>}
            <p className="mt-3 text-[12px] text-neutral-400">On Spal since {new Date(prof.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</p>
          </div>
          <h2 style={{ fontFamily: FF }} className="text-[17px] font-bold text-spal-navy">Shared on their journey</h2>
          {posts.length === 0 ? <EmptyBlock title="Nothing shared yet" body="Their milestones and posts will show up here." /> : (
            <div className="space-y-3">{posts.map((p) => <PostCard key={p.id} post={p} actions={false} onReact={noop} onSave={noop} onMenu={setMenu} />)}</div>
          )}
        </div>
      )}
      <ReportSheet target={menu ? { type: "post", id: menu.id, mine: menu.is_mine } : null} onClose={() => setMenu(null)} onDone={(m) => { setToast(m); setTimeout(() => setToast(""), 2800); }} />
      {toast && <div role="status" className="fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4"><span className="rounded-full bg-spal-navy text-white text-[14px] px-4 py-2.5 shadow-[var(--shadow-card-lg)]">{toast}</span></div>}
    </div>
  );
}
