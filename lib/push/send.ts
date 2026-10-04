import webpush from "web-push";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Configured on first send, not at import, so `next build` works without the keys.
let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails("mailto:support@spal.app", pub, priv);
  return (vapidReady = true);
}

export interface PushPayload { title: string; body: string; url?: string; tag?: string }
export interface Sub { user_id: string; endpoint: string; p256dh: string; auth: string }

/** Only Vercel Cron (or our server) may trigger a cron route. */
export function assertCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed: with no secret configured, nobody gets in (not even "Bearer undefined")
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** All push subscriptions (one user can have several devices). */
export async function allSubscriptions(): Promise<Sub[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
  return (data ?? []) as Sub[];
}

/** Send one payload to one subscription; prunes dead subscriptions (410/404). */
export async function sendPush(sub: Sub, payload: PushPayload): Promise<boolean> {
  if (!ensureVapid()) return false;
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return true;
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "statusCode" in err ? (err as { statusCode: number }).statusCode : 0;
    if (code === 410 || code === 404) {
      await createAdminClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
    return false;
  }
}

/** Send the same payload to every subscription of a set of users. */
export async function sendToUsers(subs: Sub[], payloadFor: (userId: string) => PushPayload | null): Promise<number> {
  let sent = 0;
  for (const sub of subs) {
    const payload = payloadFor(sub.user_id);
    if (!payload) continue;
    if (await sendPush(sub, payload)) sent++;
  }
  return sent;
}
