"use client";
// Browser wiring for the outbox: POST each saved record to /api/records, and sync on reconnect.
import { createOutbox, idbStore, type OutboxItem, type SendResult } from "./outbox";

async function send(item: OutboxItem): Promise<SendResult> {
  try {
    const res = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.payload) });
    if (res.ok) return "ok"; // 201 created, or 200 duplicate: both mean the server has it
    if (res.status === 401 || res.status === 408 || res.status === 429 || res.status >= 500) return "retry"; // signed out / busy / server trouble: keep it
    const j = await res.json().catch(() => ({}));
    return { reject: (j as { error?: string }).error ?? `Rejected (${res.status})` };
  } catch { return "retry"; } // offline
}

let box: ReturnType<typeof createOutbox> | null = null;
export const outbox = () => (box ??= createOutbox(idbStore(), send));

export const SYNC_EVENT = "spal:outbox";
const ping = () => typeof window !== "undefined" && window.dispatchEvent(new Event(SYNC_EVENT));

/** Save on the device, then try to sync straight away. Always resolves quickly with a saved clientId. */
export async function saveRecordOffline(payload: Record<string, unknown>): Promise<string> {
  const id = await outbox().enqueue("record", payload);
  ping();
  void syncNow();
  return id;
}

export async function syncNow() {
  const r = await outbox().flush();
  ping();
  return r;
}
