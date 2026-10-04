"use client";
// L03 Privacy centre: every privacy control in one place.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorBlock, FF, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { Group, Notice, patchMe, Row, Toggle, useMe, type MeData } from "@/components/me/ui";

const PRIVATE = ["Your sales, expenses and profit", "Who owes you and who you owe", "Your plans, budget and documents", "Your journey moments and goals", "What Spal remembers about you", "Your phone number and email"];

function Body({ me, set }: { me: MeData; set: (p: Partial<MeData>) => void }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [blocked, setBlocked] = useState<number | null>(null);
  useEffect(() => { fetch("/api/community/block").then((r) => r.json()).then((j) => j.success && setBlocked(j.data.count)).catch(() => {}); }, []);

  async function change<K extends keyof MeData>(key: K, value: MeData[K]) {
    const prev = me[key]; set({ [key]: value } as Partial<MeData>);          // optimistic
    const e = await patchMe({ [key]: value });
    if (e) { set({ [key]: prev } as Partial<MeData>); setMsg({ ok: false, t: e }); } else setMsg(null);
  }
  async function unblockAll() {
    const j = await fetch("/api/community/block", { method: "DELETE" }).then((r) => r.json()).catch(() => ({ success: false }));
    if (j.success) { setBlocked(0); setMsg({ ok: true, t: "Everyone is unblocked." }); } else setMsg({ ok: false, t: "Couldn't unblock. Please try again." });
  }
  return (
    <>
      <Section title="Always private">
        <div className={`${cardCls} p-4`}>
          <ul className="space-y-2">{PRIVATE.map((p) => <li key={p} className="flex gap-2.5 text-[14px] text-spal-navy leading-snug"><span aria-hidden className="mt-0.5 text-spal-green-700">🔒</span>{p}</li>)}</ul>
          <p className="mt-3 text-[12px] text-neutral-500 leading-snug">These are never shown in the community, and no one else can read them. Only you decide what to share.</p>
        </div>
      </Section>
      <Section title="In the community">
        <Group>
          <Toggle label="Show my profile to the community" hint={me.profile_visibility === "public" ? "People can see your name, level, business type and state." : "Hidden. You can still post anonymously."} on={me.profile_visibility === "public"} onChange={(v) => change("profile_visibility", v ? "public" : "hidden")} />
          <Toggle label="Post anonymously by default" hint="You can still choose for each post." on={me.anonymous_default} onChange={(v) => change("anonymous_default", v)} />
        </Group>
        <div className={`${cardCls} mt-3 p-4 flex items-center justify-between gap-3`}>
          <p className="text-[14px] text-spal-navy leading-snug">{blocked === null ? "People you've blocked" : blocked === 0 ? "You haven't blocked anyone." : `You've blocked ${blocked} ${blocked === 1 ? "person" : "people"}.`}</p>
          {!!blocked && <button type="button" onClick={unblockAll} className="shrink-0 min-h-11 px-4 rounded-full border border-neutral-300 text-[13px] font-bold text-spal-navy active:scale-95">Unblock all</button>}
        </div>
      </Section>
      <Section title="What Spal remembers">
        <Group>
          <Row title="What Spal knows" sub="See, edit or delete anything" href="/spal/memory" />
          <Toggle label="Pause learning" hint="Spal stops picking up new facts. What it knows stays until you delete it." on={me.memory_paused} onChange={(v) => change("memory_paused", v)} />
        </Group>
      </Section>
      <Section title="Your data">
        <Group>
          <div className="py-3.5 opacity-60"><p style={{ fontFamily: FF }} className="text-[16px] font-bold text-spal-navy">Mentor data sharing</p><p className="text-[13px] text-neutral-500">Coming with mentors. You&apos;ll choose exactly what to share, each time.</p></div>
          <div className="py-3.5 opacity-60"><p style={{ fontFamily: FF }} className="text-[16px] font-bold text-spal-navy">Export my data</p><p className="text-[13px] text-neutral-500">Coming soon: your records, journey and posts in one download.</p></div>
          <Row title="Delete account" sub="Permanently delete everything after 30 days" href="/me/delete" danger />
        </Group>
      </Section>
      {msg && <div className="px-5 mt-3"><Notice ok={msg.ok}>{msg.t}</Notice></div>}
    </>
  );
}

export default function Privacy() {
  const { state, reload, set } = useMe();
  return (
    <div data-testid="screen-L03" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Privacy centre" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "ready" && <Body me={state.me} set={set} />}
      <p className="px-5 mt-6 text-center text-[13px]"><Link href="/me" className="text-neutral-500 underline">Back to Me</Link></p>
    </div>
  );
}
