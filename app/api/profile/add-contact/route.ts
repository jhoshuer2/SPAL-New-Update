import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * POST /api/profile/add-contact
 *
 * Verifies an OTP and links the email/phone to the logged-in user's account.
 * Blocks if that contact is already registered to ANY other account.
 *
 * Body: { type: "email" | "phone", contact: string, token: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { type, contact, token } = await req.json();
    if (!type || !contact || !token) {
      return NextResponse.json({ success: false, error: "Missing fields." }, { status: 400 });
    }

    const trimmed  = contact.trim().toLowerCase();
    const otpHash  = hashOTP(token);
    const admin    = createAdminClient();

    // 1. Verify the OTP
    const { data: otpRecord } = await admin
      .from("phone_otps")
      .select("id")
      .eq("phone", trimmed)
      .eq("otp_hash", otpHash)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Wrong code or it has expired. Try again." },
        { status: 400 }
      );
    }

    // Mark OTP used
    await admin.from("phone_otps").update({ used: true }).eq("id", otpRecord.id);

    // 2. Check the contact isn't already linked to a DIFFERENT account
    const column = type === "email" ? "email" : "phone_number";
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq(column, trimmed)
      .maybeSingle();

    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { success: false, error: `This ${type} is already linked to another SPAL account.` },
        { status: 409 }
      );
    }

    if (existing?.id === user.id) {
      return NextResponse.json(
        { success: false, error: `This ${type} is already linked to your account.` },
        { status: 409 }
      );
    }

    // 3. Update the users table
    const { error: updateErr } = await admin
      .from("users")
      .update({ [column]: trimmed })
      .eq("id", user.id);

    if (updateErr) {
      console.error("[add-contact] Update error:", updateErr);
      return NextResponse.json({ success: false, error: "Could not update your account." }, { status: 500 });
    }

    // 4. Fetch updated profile
    const { data: updated } = await admin.from("users").select("*").eq("id", user.id).maybeSingle();

    return NextResponse.json({ success: true, data: { user: updated } });
  } catch (err) {
    console.error("[add-contact] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
