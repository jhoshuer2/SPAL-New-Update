// L04 · change password. Needs the current one; the new one gets a basic strength check.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, failed, unauthorized } from "@/lib/community/server";
import { verifyPassword } from "@/lib/auth/verify-password";
import { passwordHint } from "@/lib/engine/me";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { user } = await authed();
  if (!user) return unauthorized();
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!next || !passwordHint(next).ok) return bad(passwordHint(next ?? "").message);
  if (next === current) return bad("Choose a password you haven't used just now.");
  if (!(await verifyPassword(user, current ?? ""))) return NextResponse.json({ success: false, error: "That isn't your current password." }, { status: 403 });
  const { error } = await createAdminClient().auth.admin.updateUserById(user.id, { password: next });
  return error ? failed("Could not change your password. Please try again.") : NextResponse.json({ success: true });
}
