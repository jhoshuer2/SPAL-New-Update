"use client";
// C01: one community post from people at your level. Quiet if there's nothing to show or it isn't live yet.
import { useEffect, useState } from "react";
import Link from "next/link";
import { FF, cardCls } from "@/components/journey/ui";
import { Avatar } from "@/components/community/ui";
import type { FeedPost } from "@/lib/community/types";

export function CommunityPeek() {
  const [post, setPost] = useState<FeedPost | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/community/feed?tab=level").then((r) => r.json()).then((j) => setPost(j.success ? j.data.posts[0] ?? null : null)).catch(() => setPost(null));
  }, []);
  return (
    <div className="px-5 mt-3" data-testid="community-peek">
      {post ? (
        <Link href={`/community/post/${post.id}`} className={`${cardCls} p-4 block active:scale-[0.99] transition-transform`}>
          <span className="block text-[12px] font-medium text-neutral-500 uppercase tracking-[0.08em]">From people at your level</span>
          <span className="mt-2 flex items-center gap-2.5"><Avatar name={post.anonymous ? null : post.author_name} src={post.author_avatar} size={28} /><span style={{ fontFamily: FF }} className="text-[14px] font-bold text-spal-navy truncate">{post.anonymous ? "Anonymous member" : post.author_name}</span></span>
          <span className="mt-1.5 block text-[14px] text-spal-navy leading-snug line-clamp-3">{post.body}</span>
        </Link>
      ) : post === null ? (
        <Link href="/community" className="block rounded-[20px] bg-white/70 border border-dashed border-neutral-300 p-4 text-[14px] text-neutral-600 active:opacity-70">Join the community. See how others are doing, and share your own journey.</Link>
      ) : null}
    </div>
  );
}
