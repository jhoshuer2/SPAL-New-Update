"use client";
// Offline banner + sync pill (spec §11). Quiet when all is well; clear when records are waiting or couldn't sync.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { outbox, syncNow, SYNC_EVENT } from "@/lib/offline/sync";

const subscribeOnline = (cb: () => void) => { window.addEventListener("online", cb); window.addEventListener("offline", cb); return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); }; };

export function SyncStatus() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try { setPending(await outbox().pending()); setFailed((await outbox().failed()).length); } catch { /* storage blocked: nothing to show */ }
  }, []);
  const sync = useCallback(async () => { setSyncing(true); try { await syncNow(); } finally { setSyncing(false); refresh(); } }, [refresh]);

  useEffect(() => {
    const on = () => sync();
    const vis = () => { if (document.visibilityState === "visible" && navigator.onLine) sync(); };
    window.addEventListener("online", on);
    window.addEventListener(SYNC_EVENT, refresh); document.addEventListener("visibilitychange", vis);
    // First check happens just after mount (not inside the effect body), then on every reconnect.
    const first = setTimeout(() => { refresh(); if (navigator.onLine) sync(); }, 0);
    return () => { clearTimeout(first); window.removeEventListener("online", on); window.removeEventListener(SYNC_EVENT, refresh); document.removeEventListener("visibilitychange", vis); };
  }, [refresh, sync]);

  if (online && !pending && !failed) return null;
  const text = !online ? `You're offline${pending ? ` · ${pending} waiting to sync` : ". Your records are saved on this phone."}`
    : syncing ? `Syncing ${pending}…` : pending ? `${pending} waiting to sync` : `${failed} couldn't sync`;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(var(--sat)+8px)] z-[80] flex justify-center px-4">
      <span className={`pointer-events-auto rounded-full px-4 py-2 text-[13px] font-medium shadow-[var(--shadow-card-lg)] ${!online ? "bg-spal-navy text-white" : failed && !pending ? "bg-amber-100 text-amber-900" : "bg-white text-spal-navy"}`}>
        {text}
        {online && pending > 0 && !syncing && <button type="button" onClick={sync} className="ml-3 underline min-h-8">Sync now</button>}
      </span>
    </div>
  );
}
