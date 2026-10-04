"use client";
// H01 Spal home: the companion's front door. Recent chats, suggested prompts, modes.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpalSymbol } from "@/components/brand/SpalSymbol";
import { CheckInCard } from "@/components/spal/CheckInCard";
import { useJourney } from "@/components/journey/useJourney";
import { FF, Section, TopBar, cardCls } from "@/components/journey/ui";
import { suggestedPrompts } from "@/lib/engine/spal";

type Chat = { id: string; title: string; updated_at: string };
const MODES = [
  { label: "Chat", hint: "Ask anything", href: "/ask", live: true },
  { label: "Brainstorm", hint: "Think out loud", live: false },
  { label: "Challenge", hint: "Bring a problem", live: false },
  { label: "Voice", hint: "Hands-free", live: false },
] as const;

export default function SpalHome() {
  const router = useRouter();
  const { state } = useJourney();
  const [chats, setChats] = useState<Chat[] | null>(null);

  useEffect(() => {
    fetch("/api/conversations").then((r) => r.json()).then((j) => setChats(j.success ? (j.data as Chat[]).slice(0, 4) : [])).catch(() => setChats([]));
  }, []);

  const prompts = state.status === "ready"
    ? suggestedPrompts(state.data.level, { hasEverRecorded: state.data.hasEverRecorded, hardSeason: state.data.hardSeason })
    : suggestedPrompts(1, { hasEverRecorded: true, hardSeason: false });

  function ask(p: string) {
    try { sessionStorage.setItem("spal_ask_prefill", p); } catch { /* falls back to opening an empty chat */ }
    router.push("/ask");
  }

  return (
    <div data-testid="screen-H01" className="min-h-full pb-nav bg-spal-bg">
      <TopBar back={false} title="Spal" right={<Link href="/spal/memory" className="h-10 px-4 rounded-full bg-white text-[13px] font-bold text-spal-navy flex items-center border border-neutral-200 active:scale-95 transition-transform">What Spal knows</Link>} />

      <div className="px-5 flex items-center gap-4">
        <SpalSymbol symbol="profit" size={64} spin />
        <div>
          <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">How can I help?</h1>
          <p className="text-[14px] text-neutral-600">I learn your business as we talk.</p>
        </div>
      </div>

      <div className="px-5 mt-5"><CheckInCard /></div>

      <Section title="Ask me">
        <div className="space-y-2.5">
          {prompts.map((p) => (
            <button key={p} type="button" onClick={() => ask(p)} className={`${cardCls} w-full text-left px-4 py-3.5 text-[15px] font-medium text-spal-navy active:scale-[0.99] transition-transform`}>{p}</button>
          ))}
        </div>
      </Section>

      <Section title="Ways to talk">
        <div className="grid grid-cols-2 gap-3">
          {MODES.map((m) => m.live ? (
            <Link key={m.label} href={m.href} className={`${cardCls} p-4 active:scale-[0.98] transition-transform`}>
              <span style={{ fontFamily: FF }} className="block text-[16px] font-bold text-spal-navy">{m.label}</span>
              <span className="block text-[13px] text-neutral-500">{m.hint}</span>
            </Link>
          ) : (
            <div key={m.label} aria-disabled className="rounded-[20px] bg-white/50 border border-dashed border-neutral-300 p-4">
              <span style={{ fontFamily: FF }} className="block text-[16px] font-bold text-neutral-500">{m.label}</span>
              <span className="block text-[13px] text-neutral-400">Coming soon</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recent chats" action={<Link href="/ask/history" className="text-[13px] font-medium text-neutral-500">See all</Link>}>
        {chats === null ? <div role="status" aria-label="Loading" className="h-20 rounded-[20px] bg-white/70 animate-pulse" />
          : chats.length === 0 ? <div className={`${cardCls} p-5 text-center text-[14px] text-neutral-600`}>No chats yet. Ask me something above and it will show up here.</div>
          : <div className={`${cardCls} px-4 divide-y divide-neutral-100`}>
              {chats.map((c) => (
                <Link key={c.id} href={`/ask/history/${c.id}`} className="block py-3.5 text-[15px] text-spal-navy truncate active:opacity-60">{c.title}</Link>
              ))}
            </div>}
      </Section>
    </div>
  );
}
