/**
 * POST /api/payments/coach/initialize
 *   Body: { coach_id: string }
 *   Returns: { authorization_url, reference }
 *
 * Starts a Paystack one-shot charge for a single coach subscription.
 * The webhook handler creates/extends the coach_subscriptions row on success.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADVISORS } from "@/lib/advisors/config";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { coach_id } = await req.json() as { coach_id?: string };
    const coach = coach_id ? ADVISORS[coach_id] : null;

    if (!coach || coach.isFree || !coach.priceMonthly) {
      return NextResponse.json(
        { success: false, error: "Not a paid coach." },
        { status: 400 }
      );
    }

    // Get user email — required by Paystack
    const { data: profile } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Add an email to your profile before subscribing." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const reference = `coach_${coach.id}_${user.id}_${Date.now()}`;

    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: coach.priceMonthly * 100, // kobo
        currency: "NGN",
        reference,
        callback_url: `${appUrl}/billing?paid=${coach.id}`,
        metadata: {
          kind:      "coach_sub",
          user_id:   user.id,
          coach_id:  coach.id,
          full_name: profile?.full_name ?? "",
        },
      }),
    });

    const data = await resp.json();

    if (!data.status) {
      console.error("[paystack init] error:", data);
      return NextResponse.json(
        { success: false, error: data.message ?? "Paystack rejected the request." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        reference:         data.data.reference,
      },
    });
  } catch (err) {
    console.error("POST /api/payments/coach/initialize", err);
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment." },
      { status: 500 }
    );
  }
}
