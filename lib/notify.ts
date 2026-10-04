// Server-side notifications (spec §12). The in-app copy (C04) is always saved; the push respects prefs, quiet hours and hard season.
import { createAdminClient } from "@/lib/supabase/admin";
import { NOTIFICATIONS, shouldPush, type NotifData, type NotifKey, type Prefs } from "@/lib/engine/notify";
import { sendPush, type Sub } from "@/lib/push/send";

const isMissingColumn = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42703" || e.code === "PGRST204" || /column .* does not exist|schema cache/i.test(e.message ?? ""));

export async function notify(userId: string, key: NotifKey, data: NotifData = {}): Promise<void> {
  try {
    const admin = createAdminClient();
    const def = NOTIFICATIONS[key];
    const { data: u } = await admin.from("users").select("*").eq("id", userId).single();
    const profile = (u ?? {}) as { hard_season?: boolean; show_amounts_in_notifications?: boolean; display_name?: string };
    const copy = def.copy({ name: profile.display_name, ...data }, !!profile.show_amounts_in_notifications);
    const deep_link = def.link(data);

    const row = { user_id: userId, type: key, title: copy.title, body: copy.body, data, category: def.category, deep_link };
    let ins = await admin.from("notifications").insert(row);
    if (isMissingColumn(ins.error)) { const { category: _c, deep_link: _d, ...legacy } = row; void _c; void _d; ins = await admin.from("notifications").insert(legacy); }
    if (ins.error) return;

    const pr = await admin.from("notification_prefs").select("enabled, quiet_start, quiet_end").eq("user_id", userId).eq("category", def.category).maybeSingle();
    const prefs: Prefs | undefined = pr.error || !pr.data ? undefined : { enabled: pr.data.enabled, quiet_start: String(pr.data.quiet_start).slice(0, 5), quiet_end: String(pr.data.quiet_end).slice(0, 5) };
    if (!shouldPush({ key, prefs, hardSeason: !!profile.hard_season, now: new Date() })) return;

    const subs = await admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").eq("user_id", userId);
    for (const s of (subs.data ?? []) as Sub[]) await sendPush(s, { title: copy.title, body: copy.body, url: deep_link, tag: key });
  } catch { /* a failed notification must never fail the action that caused it */ }
}

/**
 * Reactions are batched: while an unread "cheers" notification for this post is under an hour old,
 * bump its count instead of sending another (spec §12 reaction_batch).
 */
export async function notifyReaction(authorId: string, postId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const ex = await admin.from("notifications").select("id, data").eq("user_id", authorId).eq("type", "reaction_batch").is("read_at", null).gte("created_at", since).order("created_at", { ascending: false }).limit(20);
    const hit = (ex.data ?? []).find((n) => (n.data as { postId?: string })?.postId === postId);
    if (hit) {
      const count = ((hit.data as { count?: number }).count ?? 1) + 1;
      const copy = NOTIFICATIONS.reaction_batch.copy({ count }, false);
      await admin.from("notifications").update({ body: copy.body, data: { postId, count } }).eq("id", hit.id);
      return;
    }
    await notify(authorId, "reaction_batch", { postId, count: 1 });
  } catch { /* best effort */ }
}
