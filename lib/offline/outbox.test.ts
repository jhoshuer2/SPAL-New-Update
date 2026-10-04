import { describe, it, expect } from "vitest";
import { createOutbox, memoryStore, type OutboxItem, type SendResult } from "./outbox";

const mk = (send: (i: OutboxItem) => Promise<SendResult>) => {
  let t = 1000;
  const store = memoryStore();
  return { store, box: createOutbox(store, send, () => t++) };
};

describe("outbox", () => {
  it("saves first, stamping a client_id into the payload", async () => {
    const { store, box } = mk(async () => "retry");
    const id = await box.enqueue("record", { amount: 5 });
    const [item] = await store.all();
    expect(item.clientId).toBe(id);
    expect(item.payload).toMatchObject({ amount: 5, client_id: id });
    expect(await box.pending()).toBe(1);
  });

  it("sends oldest first and clears what the server accepted", async () => {
    const order: unknown[] = [];
    const { box } = mk(async (i) => { order.push(i.payload.n); return "ok"; });
    await box.enqueue("record", { n: 1 }); await box.enqueue("record", { n: 2 }); await box.enqueue("record", { n: 3 });
    expect(await box.flush()).toEqual({ sent: 3, left: 0 });
    expect(order).toEqual([1, 2, 3]);
  });

  it("stops on a network failure and keeps everything for next time", async () => {
    let calls = 0;
    const { box } = mk(async () => (++calls === 1 ? "ok" : "retry"));
    await box.enqueue("record", { n: 1 }); await box.enqueue("record", { n: 2 }); await box.enqueue("record", { n: 3 });
    expect(await box.flush()).toEqual({ sent: 1, left: 2 });
    expect(calls).toBe(2); // stopped after the first failure, did not hammer the third
  });

  it("parks a rejected item instead of retrying forever, and never loses it", async () => {
    const { box } = mk(async (i) => (i.payload.n === 2 ? { reject: "bad amount" } : "ok"));
    await box.enqueue("record", { n: 1 }); await box.enqueue("record", { n: 2 }); await box.enqueue("record", { n: 3 });
    expect(await box.flush()).toEqual({ sent: 2, left: 0 });
    expect((await box.failed()).map((f) => [f.payload.n, f.failed])).toEqual([[2, "bad amount"]]);
    expect(await box.flush()).toEqual({ sent: 0, left: 0 }); // not retried
  });

  it("runs one flush at a time, so overlapping triggers cannot double-send", async () => {
    let sends = 0;
    const { box } = mk(async () => { sends++; await new Promise((r) => setTimeout(r, 5)); return "ok"; });
    await box.enqueue("record", { n: 1 });
    await Promise.all([box.flush(), box.flush(), box.flush()]);
    expect(sends).toBe(1);
  });

  it("counts attempts", async () => {
    const { store, box } = mk(async () => "retry");
    await box.enqueue("record", { n: 1 });
    await box.flush(); await box.flush();
    expect((await store.all())[0].attempts).toBe(2);
  });
});
