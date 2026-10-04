// Permanent deletion after the 30-day grace period (spec §13, L10). Irreversible, so it is deliberately narrow:
// ONLY requests whose grace period has ended AND that were never cancelled are touched.
export type PurgeDeps = {
  expired(nowIso: string): Promise<string[]>;                 // user ids: purge_after < now AND cancelled_at IS NULL
  removeFiles(userId: string): Promise<void>;                 // uploaded images under <userId>/
  deleteProfileRows(userId: string): Promise<void>;           // public.users row (cascades to the user's data)
  deleteAuthUser(userId: string): Promise<void>;              // the sign-in account
};

export async function purgeExpired(deps: PurgeDeps, now = new Date()): Promise<{ purged: string[]; failed: { id: string; error: string }[] }> {
  const purged: string[] = [], failed: { id: string; error: string }[] = [];
  for (const id of await deps.expired(now.toISOString())) {
    try {
      await deps.removeFiles(id).catch(() => {});  // files are best effort: never block the data deletion on them
      await deps.deleteProfileRows(id);
      await deps.deleteAuthUser(id);
      purged.push(id);
    } catch (e) { failed.push({ id, error: e instanceof Error ? e.message : "unknown" }); } // one failure never stops the rest
  }
  return { purged, failed };
}
