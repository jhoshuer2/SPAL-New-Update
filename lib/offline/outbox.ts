// Offline outbox (spec §11): writes are saved on the device first, then synced when there's a network.
// Core is storage-agnostic so it is fully testable; `idbStore` is the browser implementation.
export type OutboxItem = {
  clientId: string;
  kind: "record";
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  /** Set when the server rejected it for good (bad data). Kept so nothing is silently lost. */
  failed?: string;
};

export interface OutboxStore {
  put(item: OutboxItem): Promise<void>;
  all(): Promise<OutboxItem[]>;
  remove(clientId: string): Promise<void>;
}

export type SendResult = "ok" | "retry" | { reject: string };
export type Sender = (item: OutboxItem) => Promise<SendResult>;

export function createOutbox(store: OutboxStore, send: Sender, now: () => number = Date.now) {
  let flushing: Promise<{ sent: number; left: number }> | null = null;

  async function enqueue(kind: OutboxItem["kind"], payload: Record<string, unknown>, clientId = crypto.randomUUID()): Promise<string> {
    await store.put({ clientId, kind, payload: { ...payload, client_id: clientId }, createdAt: now(), attempts: 0 });
    return clientId;
  }

  /** Oldest first. Network trouble stops the run (try again later); a bad item is parked, not retried forever. One flush at a time. */
  function flush(): Promise<{ sent: number; left: number }> {
    if (flushing) return flushing;
    flushing = (async () => {
      let sent = 0;
      const items = (await store.all()).filter((i) => !i.failed).sort((a, b) => a.createdAt - b.createdAt);
      for (const item of items) {
        const r = await send(item);
        if (r === "ok") { await store.remove(item.clientId); sent++; }
        else if (r === "retry") { await store.put({ ...item, attempts: item.attempts + 1 }); break; }
        else await store.put({ ...item, attempts: item.attempts + 1, failed: r.reject });
      }
      const left = (await store.all()).filter((i) => !i.failed).length;
      return { sent, left };
    })().finally(() => { flushing = null; });
    return flushing;
  }

  const pending = async () => (await store.all()).filter((i) => !i.failed).length;
  const failed = async () => (await store.all()).filter((i) => i.failed);
  return { enqueue, flush, pending, failed };
}

/** In-memory store: tests, and the fallback when IndexedDB is unavailable (private mode). */
export function memoryStore(): OutboxStore {
  const m = new Map<string, OutboxItem>();
  return { put: async (i) => void m.set(i.clientId, i), all: async () => [...m.values()], remove: async (id) => void m.delete(id) };
}

/** IndexedDB store; falls back to memory if the browser blocks it. */
export function idbStore(dbName = "spal-outbox"): OutboxStore {
  let dbp: Promise<IDBDatabase> | null = null;
  const open = () => (dbp ??= new Promise<IDBDatabase>((res, rej) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("items", { keyPath: "clientId" });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  }));
  const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await open();
    return new Promise<T>((res, rej) => { const r = fn(db.transaction("items", mode).objectStore("items")); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  };
  const fallback = memoryStore();
  const guard = async <T>(fn: () => Promise<T>, fb: () => Promise<T>): Promise<T> => { try { return await fn(); } catch { return fb(); } };
  return {
    put: (i) => guard(() => run("readwrite", (s) => s.put(i)).then(() => undefined), () => fallback.put(i)),
    all: () => guard(() => run<OutboxItem[]>("readonly", (s) => s.getAll() as IDBRequest<OutboxItem[]>), () => fallback.all()),
    remove: (id) => guard(() => run("readwrite", (s) => s.delete(id)).then(() => undefined), () => fallback.remove(id)),
  };
}
