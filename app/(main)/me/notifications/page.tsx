"use client";
// L05 Notification settings: a switch per category, quiet hours, check-in rhythm, amounts on the lock screen.
import { useEffect, useState } from "react";
import { ErrorBlock, FF, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { Group, inputCls, Notice, patchMe, primaryCls, Toggle, useMe, type MeData } from "@/components/me/ui";
import { CATEGORIES } from "@/lib/engine/notify";

type Prefs = { categories: Record<string, boolean>; quiet_start: string; quiet_end: string };
const RHYTHMS = [["daily", "Every day"], ["few_weekly", "A few times a week"], ["weekly", "Once a week"]] as const;

function Body({ me }: { me: MeData }) {
  const [p, setP] = useState<Prefs | null>(null);
  const [rhythm, setRhythm] = useState(me.checkin_frequency);
  const [time, setTime] = useState(me.checkin_time);
  const [amounts, setAmounts] = useState(me.show_amounts_in_notifications);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { fetch("/api/me/notification-prefs").then((r) => r.json()).then((j) => (j.success ? setP(j.data) : setFailed(true))).catch(() => setFailed(true)); }, []);

  async function save() {
    if (!p) return;
    setBusy(true); setMsg(null);
    try {
      const r = await (await fetch("/api/me/notification-prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })).json();
      if (!r.success) throw new Error(r.error);
      const e = await patchMe({ checkin_frequency: rhythm, checkin_time: time, show_amounts_in_notifications: amounts });
      if (e) throw new Error(e);
      setMsg({ ok: true, t: "Saved." });
    } catch (e) { setMsg({ ok: false, t: e instanceof Error && e.message ? e.message : "Could not save. Please try again." }); }
    setBusy(false);
  }
  if (failed) return <ErrorBlock onRetry={() => location.reload()} />;
  if (!p) return <ScreenSkeleton />;
  return (
    <div className="space-y-0">
      <Section title="What you hear about">
        <Group>{CATEGORIES.map((c) => <Toggle key={c.key} label={c.label} hint={c.hint} on={p.categories[c.key] !== false} onChange={(v) => setP({ ...p, categories: { ...p.categories, [c.key]: v } })} />)}</Group>
      </Section>
      <Section title="Quiet hours">
        <div className={`${cardCls} p-4`}>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-medium text-neutral-600">From<input type="time" value={p.quiet_start} onChange={(e) => setP({ ...p, quiet_start: e.target.value })} className={`${inputCls} mt-1.5`} /></label>
            <label className="text-[13px] font-medium text-neutral-600">Until<input type="time" value={p.quiet_end} onChange={(e) => setP({ ...p, quiet_end: e.target.value })} className={`${inputCls} mt-1.5`} /></label>
          </div>
          <p className="mt-2 text-[12px] text-neutral-500 leading-snug">No alerts on your phone in this window (Nigeria time). Everything still shows up inside Spal.</p>
        </div>
      </Section>
      <Section title="Check-in rhythm">
        <div className={`${cardCls} p-4 space-y-3`}>
          <div role="radiogroup" aria-label="How often" className="space-y-2">
            {RHYTHMS.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={rhythm === k} onClick={() => setRhythm(k)} className={`w-full min-h-12 text-left rounded-2xl border px-4 text-[15px] transition-colors ${rhythm === k ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}>{l}</button>)}
          </div>
          <label className="block text-[13px] font-medium text-neutral-600">Preferred time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputCls} mt-1.5`} /></label>
          <p className="text-[12px] text-neutral-500 leading-snug">{me.hard_season ? "You're in a hard season, so check-ins are weekly at most." : "Reminders go out in the early evening for now. We're working on exact times."}</p>
        </div>
      </Section>
      <Section title="On your lock screen">
        <Group><Toggle label="Show amounts in notifications" hint="Off by default, so a glance at your phone never shows your money." on={amounts} onChange={setAmounts} /></Group>
      </Section>
      <div className="px-5 mt-6 space-y-3">
        {msg && <Notice ok={msg.ok}>{msg.t}</Notice>}
        <button type="button" onClick={save} disabled={busy} style={{ fontFamily: FF }} className={primaryCls}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

export default function NotificationSettings() {
  const { state, reload } = useMe();
  return (
    <div data-testid="screen-L05" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Notifications" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "ready" && <Body me={state.me} />}
    </div>
  );
}
