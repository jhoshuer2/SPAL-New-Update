// L04 · log out on every device, this one included.
import { NextResponse } from "next/server";
import { authed, failed, unauthorized } from "@/lib/community/server";

export async function POST() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  return error ? failed("Could not sign you out everywhere. Please try again.") : NextResponse.json({ success: true });
}
