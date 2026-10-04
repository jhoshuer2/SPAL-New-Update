// L07 · send feedback, report a bug, or ask for support. Stored for the team to read (service role only).
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, failed, notLive, unauthorized } from "@/lib/community/server";

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const { kind, message } = (await req.json().catch(() => ({}))) as { kind?: string; message?: string };
  if (!["feedback", "bug", "support"].includes(kind ?? "")) return bad("Choose what this is about.");
  const text = message?.trim().slice(0, 2000) ?? "";
  if (text.length < 3) return bad("Tell us a little more.");
  const { error } = await supabase.from("feedback").insert({ user_id: user.id, kind, message: text });
  if (notLive(error)) return NextResponse.json({ success: false, error: "Feedback is being set up. Please try again soon.", pending: true }, { status: 503 });
  return error ? failed("Could not send that. Please try again.") : NextResponse.json({ success: true });
}
