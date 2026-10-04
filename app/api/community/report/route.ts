// I15 · report a post, comment or person. Reporters can file; only moderators can read (service role).
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, failed, notLive, pending, unauthorized } from "@/lib/community/server";
import { REPORT_REASONS } from "@/lib/engine/community";

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { target_type?: string; target_id?: string; reason?: string; details?: string };
  if (!["post", "comment", "user"].includes(b.target_type ?? "") || !b.target_id) return bad("Nothing to report.");
  if (!REPORT_REASONS.some((r) => r.key === b.reason)) return bad("Pick a reason.");
  const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: b.target_type, target_id: b.target_id, reason: b.reason, details: b.details?.trim().slice(0, 500) || null });
  if (notLive(error)) return pending();
  if (error) return failed("Could not send your report. Please try again.");
  return NextResponse.json({ success: true });
}
