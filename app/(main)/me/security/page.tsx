"use client";
// L04 Security: change password, app lock (PIN), log out everywhere.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FF, Section, TopBar, cardCls } from "@/components/journey/ui";
import { Group, inputCls, Notice, primaryCls, Toggle } from "@/components/me/ui";
import { passwordHint, pinProblem } from "@/lib/engine/me";
import { hashPin } from "@/lib/applock/core";
import { clearPin, LOCK_EVENT, readPin, savePin } from "@/lib/applock/store";

export default function Security() {
  const router = useRouter();
  const [lockOn, setLockOn] = useState(false);
  const [setting, setSetting] = useState(false);
  const [pin, setPin] = useState(""); const [pin2, setPin2] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [cur, setCur] = useState(""); const [nw, setNw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLockOn(!!readPin()), 0); return () => clearTimeout(t); }, []);

  async function saveLock() {
    const p = pinProblem(pin); if (p) return setPinMsg({ ok: false, t: p });
    if (pin !== pin2) return setPinMsg({ ok: false, t: "The two PINs don't match." });
    savePin(await hashPin(pin)); setLockOn(true); setSetting(false); setPin(""); setPin2(""); setPinMsg({ ok: true, t: "App lock is on. Spal will ask for your PIN when you open it, and after 5 minutes away." });
  }
  async function changePw() {
    setBusy(true); setPwMsg(null);
    try {
      const j = await (await fetch("/api/me/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: cur, next: nw }) })).json();
      if (!j.success) throw new Error(j.error);
      setCur(""); setNw(""); setPwMsg({ ok: true, t: "Password changed." });
    } catch (e) { setPwMsg({ ok: false, t: e instanceof Error && e.message ? e.message : "Could not change your password." }); }
    setBusy(false);
  }
  async function everywhere() {
    setBusy(true);
    const j = await fetch("/api/me/sign-out-everywhere", { method: "POST" }).then((r) => r.json()).catch(() => ({ success: false }));
    if (j.success) { clearPin(); router.replace("/login"); } else setBusy(false);
  }
  const hint = nw ? passwordHint(nw) : null;

  return (
    <div data-testid="screen-L04" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Security" />
      <Section title="App lock">
        <Group>
          <Toggle label="Lock with a PIN" hint="Asked when you open Spal and after 5 minutes away. Fingerprint and face unlock arrive with the phone app." on={lockOn} onChange={(v) => { if (v) { setSetting(true); setPinMsg(null); } else { clearPin(); setLockOn(false); setSetting(false); window.dispatchEvent(new Event(LOCK_EVENT)); setPinMsg({ ok: true, t: "App lock is off." }); } }} />
        </Group>
        {setting && (
          <div className={`${cardCls} mt-3 p-4 space-y-3`}>
            <label className="block text-[13px] font-medium text-neutral-600">New PIN (4 to 6 digits)<input inputMode="numeric" type="password" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputCls} mt-1.5`} /></label>
            <label className="block text-[13px] font-medium text-neutral-600">Type it again<input inputMode="numeric" type="password" autoComplete="off" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputCls} mt-1.5`} /></label>
            <div className="flex gap-2"><button type="button" onClick={saveLock} className="h-11 px-5 rounded-full bg-[#22C55E] text-white text-[14px] font-bold">Turn on</button><button type="button" onClick={() => { setSetting(false); setPin(""); setPin2(""); }} className="h-11 px-4 text-[14px] text-neutral-600">Cancel</button></div>
          </div>
        )}
        {pinMsg && <div className="mt-3"><Notice ok={pinMsg.ok}>{pinMsg.t}</Notice></div>}
        <p className="mt-2 text-[12px] text-neutral-500 leading-snug">Your PIN stays on this phone and can&apos;t be recovered. If you forget it, log out and back in.</p>
      </Section>

      <Section title="Change password">
        <div className={`${cardCls} p-4 space-y-3`}>
          <label className="block text-[13px] font-medium text-neutral-600">Current password<input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={`${inputCls} mt-1.5`} /></label>
          <label className="block text-[13px] font-medium text-neutral-600">New password<input type="password" autoComplete="new-password" value={nw} onChange={(e) => setNw(e.target.value)} className={`${inputCls} mt-1.5`} />{hint && <span className={`block mt-1 text-[12px] ${hint.ok ? "text-spal-green-700" : "text-neutral-500"}`}>{hint.message}</span>}</label>
          {pwMsg && <Notice ok={pwMsg.ok}>{pwMsg.t}</Notice>}
          <button type="button" onClick={changePw} disabled={busy || !cur || !hint?.ok} style={{ fontFamily: FF }} className={primaryCls}>{busy ? "Saving…" : "Change password"}</button>
        </div>
      </Section>

      <Section title="Signed-in devices">
        <div className={`${cardCls} p-4`}>
          <p className="text-[14px] text-neutral-600 leading-snug">A list of the devices you&apos;re signed in on is coming soon. For now you can log out of all of them at once.</p>
          <button type="button" onClick={everywhere} disabled={busy} className="mt-3 h-12 px-5 rounded-full bg-white border border-neutral-300 text-[15px] font-bold text-spal-navy active:scale-95 transition-transform disabled:opacity-50">Log out everywhere</button>
        </div>
      </Section>
    </div>
  );
}
