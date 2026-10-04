"use client";
// Full-screen PIN pad. Mounted once in the main layout. Locks on cold start and after 5 minutes in the background.
import { useCallback, useEffect, useRef, useState } from "react";
import { SpalSymbol } from "@/components/brand/SpalSymbol";
import { checkPin, shouldLock, waitAfterFailures } from "@/lib/applock/core";
import { addFail, clearPin, isUnlockedThisSession, LOCK_EVENT, markUnlocked, readFails, readPin } from "@/lib/applock/store";

export function AppLock() {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [wait, setWait] = useState(0);
  const hiddenAt = useRef<number | null>(null);

  const evaluate = useCallback(() => {
    setLocked(shouldLock({ enabled: !!readPin(), unlockedThisSession: isUnlockedThisSession(), hiddenAt: hiddenAt.current, now: Date.now() }));
  }, []);

  useEffect(() => {
    const first = setTimeout(evaluate, 0); // cold start check, just after mount
    const vis = () => {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now();
      else { evaluate(); hiddenAt.current = null; }
    };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener(LOCK_EVENT, evaluate);
    return () => { clearTimeout(first); document.removeEventListener("visibilitychange", vis); window.removeEventListener(LOCK_EVENT, evaluate); };
  }, [evaluate]);

  // Wrong-PIN back-off countdown
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => Math.max(0, w - 1000)), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function submit(p: string) {
    const stored = readPin(); if (!stored) return setLocked(false);
    if (await checkPin(p, stored)) { markUnlocked(); hiddenAt.current = null; setLocked(false); setPin(""); setMsg(""); return; }
    addFail();
    const f = readFails();
    const w = waitAfterFailures(f.n);
    setPin(""); setWait(w);
    setMsg(w ? `Too many tries. Wait ${w >= 60_000 ? `${Math.round(w / 60_000)} min` : `${w / 1000}s`}.` : "That PIN isn't right.");
  }
  function press(d: string) {
    if (wait > 0) return;
    const next = (pin + d).slice(0, 6);
    setPin(next);
  }
  async function forgot() {
    // The PIN can't be recovered (it only exists as a hash). Logging out clears it; signing back in sets things up again.
    clearPin(); await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {}); window.location.href = "/login";
  }

  if (!locked) return null;
  return (
    <div data-testid="screen-lock" role="dialog" aria-modal="true" aria-label="Spal is locked" className="fixed inset-0 z-[100] flex flex-col items-center bg-spal-bg px-8 pt-[calc(var(--sat)+56px)] pb-[calc(var(--sab)+24px)]">
      <SpalSymbol symbol="focus" size={56} />
      <h1 style={{ fontFamily: "var(--font-satoshi)" }} className="mt-5 text-[24px] font-bold text-spal-navy">Enter your PIN</h1>
      <div className="mt-6 flex gap-3" aria-label={`${pin.length} digits entered`} role="img">{Array.from({ length: Math.max(4, pin.length) }).map((_, i) => <span key={i} className={`w-3.5 h-3.5 rounded-full border-2 border-spal-navy ${i < pin.length ? "bg-spal-navy" : ""}`} />)}</div>
      <p role="alert" className="mt-3 h-5 text-[14px] text-red-600">{msg}</p>
      <div className="mt-6 grid grid-cols-3 gap-x-6 gap-y-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} type="button" onClick={() => press(d)} disabled={wait > 0} aria-label={d} className="w-[72px] h-[72px] rounded-full bg-white text-[26px] font-bold text-spal-navy shadow-[var(--shadow-card)] active:scale-95 transition-transform disabled:opacity-40">{d}</button>)}
        <button type="button" onClick={() => setPin(pin.slice(0, -1))} aria-label="Delete last digit" className="w-[72px] h-[72px] rounded-full text-[15px] font-medium text-neutral-600 active:opacity-60">Delete</button>
        <button type="button" onClick={() => press("0")} disabled={wait > 0} aria-label="0" className="w-[72px] h-[72px] rounded-full bg-white text-[26px] font-bold text-spal-navy shadow-[var(--shadow-card)] active:scale-95 transition-transform disabled:opacity-40">0</button>
        <button type="button" onClick={() => submit(pin)} disabled={pin.length < 4 || wait > 0} aria-label="Unlock" className="w-[72px] h-[72px] rounded-full bg-[#22C55E] text-white text-[15px] font-bold disabled:opacity-30 active:scale-95 transition-transform">Go</button>
      </div>
      <button type="button" onClick={forgot} className="mt-auto min-h-11 text-[14px] text-neutral-500 underline">Forgot your PIN? Log out</button>
    </div>
  );
}
