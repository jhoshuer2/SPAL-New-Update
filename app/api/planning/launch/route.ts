// E06 · launch plan, week by week to the first sale. POST creates the default plan; PUT saves ticks and edits.
import { NextRequest, NextResponse } from "next/server";
import { authed, bad, cleanText, missingTable, notReady, saveFailed, unauthorized } from "@/lib/planning/server";
import { defaultLaunchPlan, launchProgress, type Week } from "@/lib/engine/planning";

export async function POST() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const existing = await supabase.from("launch_plans").select("weeks").eq("user_id", user.id).maybeSingle();
  if (missingTable(existing.error)) return notReady();
  if (existing.data?.weeks && (existing.data.weeks as Week[]).length) return NextResponse.json({ success: true, data: { weeks: existing.data.weeks } }); // never overwrite progress
  const weeks = defaultLaunchPlan();
  const { error } = await supabase.from("launch_plans").upsert({ user_id: user.id, weeks }, { onConflict: "user_id" });
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { weeks, progress: launchProgress(weeks) } });
}

export async function PUT(req: NextRequest) {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { weeks?: Week[] };
  if (!Array.isArray(b.weeks) || b.weeks.length === 0 || b.weeks.length > 12) return bad("Your plan needs between 1 and 12 weeks.");
  const weeks: Week[] = b.weeks.map((w, i) => ({
    n: i + 1,
    title: cleanText(w.title, 60) || `Week ${i + 1}`,
    tasks: (Array.isArray(w.tasks) ? w.tasks : []).slice(0, 20).map((t) => ({
      id: cleanText(t.id, 40) || crypto.randomUUID(),
      text: cleanText(t.text, 140),
      done: !!t.done,
      remind_on: /^\d{4}-\d{2}-\d{2}$/.test(t.remind_on ?? "") ? t.remind_on : null,
    })).filter((t) => t.text),
  }));
  const { error } = await supabase.from("launch_plans").upsert({ user_id: user.id, weeks }, { onConflict: "user_id" });
  if (missingTable(error)) return notReady();
  if (error) return saveFailed();
  return NextResponse.json({ success: true, data: { progress: launchProgress(weeks) } });
}
