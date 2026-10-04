// Permanently deletes accounts whose 30-day grace period has ended. NOT scheduled in vercel.json yet:
// run it by hand first on staging (it is irreversible). Protected by CRON_SECRET like the other cron routes.
import { NextRequest, NextResponse } from "next/server";
import { assertCron } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeExpired } from "@/lib/account/purge";

export async function GET(req: NextRequest) {
  if (!assertCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const result = await purgeExpired({
    expired: async (now) => {
      const { data, error } = await admin.from("account_deletions").select("user_id").lt("purge_after", now).is("cancelled_at", null).limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.user_id as string);
    },
    removeFiles: async (id) => {
      const { data } = await admin.storage.from("inventory").list(id, { limit: 1000 });
      if (data?.length) await admin.storage.from("inventory").remove(data.map((f) => `${id}/${f.name}`));
    },
    deleteProfileRows: async (id) => { const { error } = await admin.from("users").delete().eq("id", id); if (error) throw new Error(error.message); },
    deleteAuthUser: async (id) => { const { error } = await admin.auth.admin.deleteUser(id); if (error && !/not found/i.test(error.message)) throw new Error(error.message); },
  });
  // Counts only: no ids or personal data in logs (spec §13).
  console.log(`[purge-deleted] purged=${result.purged.length} failed=${result.failed.length}`);
  return NextResponse.json({ success: true, purged: result.purged.length, failed: result.failed.length });
}
