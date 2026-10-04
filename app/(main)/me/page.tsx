"use client";
// L01 Me: profile and settings hub. Opens from the avatar on Home.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/community/ui";
import { ErrorBlock, FF, ScreenSkeleton, TopBar, cardCls } from "@/components/journey/ui";
import { Group, Row, useMe } from "@/components/me/ui";
import { LEVELS } from "@/lib/engine/levels";
import { graceDaysLeft } from "@/lib/engine/me";
import type { Level } from "@/lib/engine/placement";

export default function Me() {
  const router = useRouter();
  const { state, reload } = useMe();
  const [del, setDel] = useState<{ scheduled: boolean; purge_after?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/me/delete").then((r) => r.json()).then((j) => j.success && setDel(j.data)).catch(() => {}); }, []);

  async function logout() { setBusy(true); await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {}); router.replace("/login"); }
  async function cancelDeletion() { setBusy(true); const j = await fetch("/api/me/delete", { method: "DELETE" }).then((r) => r.json()).catch(() => ({ success: false })); if (j.success) setDel({ scheduled: false }); setBusy(false); }

  return (
    <div data-testid="screen-L01" className="min-h-full pb-nav bg-spal-bg">
      <TopBar title="Me" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "ready" && (() => {
        const m = state.me;
        const name = m.display_name || m.full_name?.split(" ")[0] || "You";
        return (
          <div className="px-5 space-y-5">
            {del?.scheduled && del.purge_after && (
              <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-4">
                <p style={{ fontFamily: FF }} className="text-[15px] font-bold text-red-900">Your account is scheduled for deletion</p>
                <p className="mt-1 text-[14px] text-red-900 leading-snug">Everything will be permanently deleted in {graceDaysLeft(del.purge_after)} days. Changed your mind?</p>
                <button type="button" disabled={busy} onClick={cancelDeletion} className="mt-3 h-11 px-5 rounded-full bg-red-900 text-white text-[14px] font-bold disabled:opacity-60">Keep my account</button>
              </div>
            )}
            <div className={`${cardCls} p-5 flex items-center gap-4`}>
              <Avatar name={name} src={m.avatar_url} size={64} />
              <div className="min-w-0 flex-1">
                <p style={{ fontFamily: FF }} className="text-[22px] leading-tight font-bold text-spal-navy truncate">{name}</p>
                <p className="text-[14px] text-neutral-600">Level {m.current_level} · {LEVELS[m.current_level as Level].name}</p>
                {m.business_name && <p className="text-[13px] text-neutral-500 truncate">{m.business_name}</p>}
              </div>
            </div>
            <Group>
              <Row title="Business profile" sub="Name, logo, CAC, TIN, address" href="/business/profile" />
              <Row title="Edit profile" sub="Photo, name, bio, location" href="/me/edit" />
              {m.profile_visibility === "public" && <Row title="See my public profile" sub="How others see you" href={`/community/people/${m.id}`} />}
            </Group>
            <Group>
              <Row title="Privacy centre" sub="Who sees what, and what Spal remembers" href="/me/privacy" />
              <Row title="Security" sub="Password and app lock" href="/me/security" />
              <Row title="Notifications" sub="What reaches you, and when" href="/me/notifications" />
            </Group>
            <Group>
              <Row title="Help & feedback" href="/me/help" />
              <Row title="About & legal" href="/me/about" />
              <Row title="Businesses, billing and badges" sub="The classic account page" href="/profile" />
            </Group>
            <button type="button" onClick={logout} disabled={busy} className="w-full h-14 rounded-full bg-white border border-neutral-200 text-[16px] font-bold text-spal-navy active:scale-[0.98] transition-transform disabled:opacity-60">Log out</button>
            <Link href="/community" className="block text-center text-[14px] text-neutral-500 pb-2">Back to the community</Link>
          </div>
        );
      })()}
    </div>
  );
}
