// I03 · create a post. Validated, privacy-scanned, and never exposes the author when anonymous.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, failed, notLive, pending, privacyGate, unauthorized } from "@/lib/community/server";
import { validatePost } from "@/lib/engine/community";
import { scanPrivate } from "@/lib/engine/privacy";

export async function POST(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown> & { attach?: { kind?: string; id?: string }; acknowledged?: boolean; clientId?: string };

  const v = validatePost({ type: b.type, body: b.body, anonymous: b.anonymous, audience: b.audience, media_urls: b.media_urls });
  if (!v.ok) return bad(v.error);
  const gate = privacyGate(v.value.body, b.acknowledged);
  if (gate) return gate;

  const { data: me, error: meErr } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (notLive(meErr)) return pending();
  const profile = (me ?? {}) as { profile_visibility?: string; current_level?: number };
  // Posting under your name needs a visible profile. Asked for explicitly, never assumed.
  if (!v.value.anonymous && profile.profile_visibility === "hidden") {
    return NextResponse.json({ success: false, code: "needs_visibility", error: "To post under your name, your profile needs to be visible." }, { status: 409 });
  }

  // Attachments are built server-side from the author's own records: a title and a level, never numbers.
  let attachment: Record<string, unknown> | null = null;
  if (b.attach?.kind === "milestone" && b.attach.id) {
    const { data: m } = await supabase.from("milestones").select("id, title, level").eq("key", b.attach.id).maybeSingle();
    const { data: um } = m ? await supabase.from("user_milestones").select("status").eq("user_id", user.id).eq("milestone_id", m.id).maybeSingle() : { data: null };
    if (!m || um?.status !== "done") return bad("You can only share milestones you've completed.");
    attachment = { kind: "milestone", title: m.title, level: m.level };
  } else if (b.attach?.kind === "moment" && b.attach.id) {
    const { data: mo } = await supabase.from("moments").select("type, text, occurred_on").eq("id", b.attach.id).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
    if (!mo) return bad("We couldn't find that moment.");
    if (scanPrivate(mo.text ?? "").length) return bad("That moment has private details in it, so it can't be attached. Write the post in your own words instead.");
    attachment = { kind: "moment", type: mo.type, text: mo.text, date: mo.occurred_on };
  }

  const { data, error } = await supabase.from("posts").insert({
    author_id: user.id, type: v.value.type, body: v.value.body, media_urls: v.value.media_urls, attachment,
    audience: "public", anonymous: v.value.anonymous, author_level: profile.current_level ?? 0, client_id: b.clientId ?? null,
  }).select("id").single();
  if (notLive(error)) return pending();
  if (error) return failed("Could not post. Please try again.");
  return NextResponse.json({ success: true, data });
}
