/**
 * Paystack webhook handler.
 *
 * Two payment kinds are supported (distinguished by metadata.kind):
 *   1. legacy "pro" plan (subscriptions table)             — kind missing or "pro"
 *   2. per-coach voice subscriptions (₦x/month per coach)  — kind === "coach_sub"
 *
 * For coach payments we upsert a coach_subscriptions row and insert a
 * coach_payments receipt that powers /billing.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const rawBody   = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const hash      = crypto.createHmac("sha512", PAYSTACK_SECRET).update(rawBody).digest("hex");

    if (hash !== signature) {
      console.warn("[webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event     = JSON.parse(rawBody);
    const admin     = createAdminClient();
    const eventType = event.event as string;
    const data      = event.data ?? {};
    const metadata  = data.metadata ?? {};
    const kind      = metadata.kind ?? (data.plan ? "pro" : null);

    // ── COACH SUBSCRIPTION PAYMENTS ─────────────────────────────────────────
    if (kind === "coach_sub") {
      const userId  = metadata.user_id  as string | undefined;
      const coachId = metadata.coach_id as string | undefined;

      if (!userId || !coachId) {
        console.warn("[webhook coach_sub] missing metadata user_id or coach_id");
        return NextResponse.json({ received: true });
      }

      if (eventType === "charge.success") {
        const now       = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Idempotent payment insert keyed on the Paystack reference
        await admin
          .from("coach_payments")
          .upsert({
            user_id:            userId,
            coach_id:           coachId,
            paystack_reference: data.reference,
            amount:             data.amount,
            status:             "succeeded",
            paid_at:            data.paid_at ?? now.toISOString(),
          }, { onConflict: "paystack_reference" });

        // If the user re-subscribes before expiry, extend from the existing end-date
        const { data: existing } = await admin
          .from("coach_subscriptions")
          .select("current_period_end")
          .eq("user_id",  userId)
          .eq("coach_id", coachId)
          .maybeSingle();

        let newPeriodEnd = periodEnd;
        if (existing?.current_period_end) {
          const prev = new Date(existing.current_period_end);
          if (prev > now) {
            newPeriodEnd = new Date(prev);
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
          }
        }

        await admin
          .from("coach_subscriptions")
          .upsert({
            user_id:                     userId,
            coach_id:                    coachId,
            status:                      "active",
            amount:                      data.amount,
            paystack_customer_code:      data.customer?.customer_code ?? null,
            paystack_authorization_code: data.authorization?.authorization_code ?? null,
            current_period_end:          newPeriodEnd.toISOString(),
            cancelled_at:                null,
            updated_at:                  now.toISOString(),
          }, { onConflict: "user_id,coach_id" });

        console.log(`[webhook] coach sub extended user=${userId} coach=${coachId} until=${newPeriodEnd.toISOString()}`);
        return NextResponse.json({ received: true });
      }

      if (eventType === "charge.failed") {
        await admin.from("coach_payments").upsert({
          user_id:            userId,
          coach_id:           coachId,
          paystack_reference: data.reference,
          amount:             data.amount,
          status:             "failed",
          paid_at:            data.paid_at ?? new Date().toISOString(),
        }, { onConflict: "paystack_reference" });
        return NextResponse.json({ received: true });
      }
    }

    // ── LEGACY "PRO" PLAN handling (kept for backwards compat) ──────────────
    if (eventType === "charge.success" && (kind === "pro" || !kind)) {
      const userId = metadata.user_id;
      const billingCycle = metadata.billing_cycle ?? "monthly";
      if (userId) {
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        else                            periodEnd.setMonth(periodEnd.getMonth() + 1);

        await admin.from("subscriptions").upsert({
          user_id: userId,
          plan: "pro",
          billing_cycle: billingCycle,
          status: "active",
          paystack_customer_code: data.customer?.customer_code,
          paystack_subscription_code: data.subscription_code ?? null,
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        }, { onConflict: "user_id" });

        await admin.from("users").update({ subscription_plan: "pro" }).eq("id", userId);
      }
    }

    if (eventType === "subscription.disable") {
      const subscriptionCode = data.subscription_code;
      await admin
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("paystack_subscription_code", subscriptionCode);
    }

    if (eventType === "invoice.payment_failed") {
      const subscriptionCode = data.subscription?.subscription_code;
      if (subscriptionCode) {
        await admin
          .from("subscriptions")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("paystack_subscription_code", subscriptionCode);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("POST /api/payments/webhook", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
