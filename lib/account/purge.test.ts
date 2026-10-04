import { describe, it, expect } from "vitest";
import { purgeExpired, type PurgeDeps } from "./purge";

const deps = (ids: string[], log: string[], opts: { failOn?: string; filesFail?: boolean } = {}): PurgeDeps => ({
  expired: async () => ids,
  removeFiles: async (id) => { log.push(`files:${id}`); if (opts.filesFail) throw new Error("storage down"); },
  deleteProfileRows: async (id) => { if (id === opts.failOn) throw new Error("db error"); log.push(`rows:${id}`); },
  deleteAuthUser: async (id) => { log.push(`auth:${id}`); },
});

describe("purgeExpired", () => {
  it("deletes files, then data, then the sign-in account, for each expired user", async () => {
    const log: string[] = [];
    const r = await purgeExpired(deps(["u1", "u2"], log));
    expect(r.purged).toEqual(["u1", "u2"]);
    expect(log).toEqual(["files:u1", "rows:u1", "auth:u1", "files:u2", "rows:u2", "auth:u2"]);
  });
  it("one failure never stops the others, and a failed user keeps their sign-in", async () => {
    const log: string[] = [];
    const r = await purgeExpired(deps(["u1", "bad", "u3"], log, { failOn: "bad" }));
    expect(r.purged).toEqual(["u1", "u3"]);
    expect(r.failed).toEqual([{ id: "bad", error: "db error" }]);
    expect(log).not.toContain("auth:bad"); // data deletion failed first, so the account is left for the next run
  });
  it("a storage failure does not block deleting the data", async () => {
    const log: string[] = [];
    expect((await purgeExpired(deps(["u1"], log, { filesFail: true }))).purged).toEqual(["u1"]);
  });
  it("does nothing when nobody is due", async () => {
    const log: string[] = [];
    expect(await purgeExpired(deps([], log))).toEqual({ purged: [], failed: [] });
    expect(log).toEqual([]);
  });
});
