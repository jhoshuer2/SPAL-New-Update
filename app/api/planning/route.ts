// E01 · everything the planning hub needs in one round trip.
import { NextResponse } from "next/server";
import { authed, missingTable, unauthorized } from "@/lib/planning/server";
import { budgetGap, launchProgress, validationProgress, type BudgetItem, type Conversation, type Week } from "@/lib/engine/planning";

export async function GET() {
  const { supabase, user } = await authed();
  if (!user) return unauthorized();
  const [idea, val, bud, launch] = await Promise.all([
    supabase.from("ideas").select("raw_text, summary, questions, alternatives").eq("user_id", user.id).maybeSingle(),
    supabase.from("validations").select("checklist, customer_conversations, summary").eq("user_id", user.id).maybeSingle(),
    supabase.from("budgets").select("items, available_kobo").eq("user_id", user.id).maybeSingle(),
    supabase.from("launch_plans").select("weeks").eq("user_id", user.id).maybeSingle(),
  ]);
  if ([idea, val, bud, launch].some((r) => missingTable(r.error))) return NextResponse.json({ success: true, data: { pending: true } });

  const conversations = (val.data?.customer_conversations ?? []) as Conversation[];
  const items = (bud.data?.items ?? []) as BudgetItem[];
  const weeks = (launch.data?.weeks ?? []) as Week[];
  return NextResponse.json({
    success: true,
    data: {
      idea: idea.data ?? null,
      validation: val.data ? { ...val.data, progress: validationProgress(conversations.length, val.data.checklist ?? {}) } : null,
      budget: bud.data ? { ...bud.data, result: budgetGap(items, Number(bud.data.available_kobo)) } : null,
      launch: launch.data ? { weeks, progress: launchProgress(weeks) } : null,
    },
  });
}
