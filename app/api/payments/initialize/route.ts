import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// Paystack plan codes — create these in your Paystack dashboard and paste the codes here
// Dashboard → Subscriptions → Plans → Create Plan
const PLAN_CODES: Record<string, string> = {
  monthly: process.env.PAYSTACK_PLAN_CODE_MONTHLY ?? "",
  yearly:  process.env.PAYSTACK_PLAN_CODE_YEARLY  ?? "",
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { plan } = await req.json() as { plan: "monthly" | "yearly" };
    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json({ success: false, error: "plan must be monthly or yearly" }, { status: 400 });
    }

    // Fetch user email (needed for Paystack)
    const { data: profile } = await supabase
      .from("users")
      .select("email, full_name, phone_number")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? `${user.id}@spal.app`;
    const planCode = PLAN_CODES[plan];

    const body: Record<string, unknown> = {
      email,
      amount: plan === "monthly" ? 200000 : 1800000, // kobo (₦2,000 / ₦18,000)
      currency: "NGN",
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/upgrade?success=true`,
      metadata: {
        user_id: user.id,
        billing_cycle: plan,
        full_name: profile?.full_name ?? "",
      },
    };

    // If plan codes are configured, use subscription flow
    if (planCode) {
      body.plan = planCode;
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.status) {
      console.error("Paystack init error:", data);
      return NextResponse.json({ success: false, error: data.message ?? "Paystack error" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
      },
    });
  } catch (err) {
    console.error("POST /api/payments/initialize", err);
    return NextResponse.json({ success: false, error: "Failed to initialize payment" }, { status: 500 });
  }
}
