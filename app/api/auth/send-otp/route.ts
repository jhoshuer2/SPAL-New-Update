import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOTPviaSMS  } from "@/lib/termii";
import { sendOTPviaEmail } from "@/lib/resend";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOTP(): string {
  // crypto.randomInt gives uniform distribution (no modulo bias)
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function normalizePhone(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s\-().]/g, "");
  const digits  = cleaned.startsWith("+")
    ? cleaned.slice(1).replace(/\D/g, "")
    : cleaned.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

// POST /api/auth/send-otp
export async function POST(req: NextRequest) {
  try {
    const { phone, email } = await req.json();

    // ── EMAIL PATH ────────────────────────────────────────────────────────────
    //
    //  Same flow as phone: generate OTP → hash → send via Resend API → store hash.
    //  We store the email address in the `phone` column of phone_otps so we can
    //  reuse the same table and rate-limit logic without a new migration.
    //
    if (email && typeof email === "string") {
      const trimmedEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, error: "Invalid email address." },
          { status: 400 }
        );
      }

      // Rate-limit: max 3 active OTPs per address in the last 10 minutes
      const admin       = createAdminClient();
      const tenMinsAgo  = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count }   = await admin
        .from("phone_otps")
        .select("id", { count: "exact", head: true })
        .eq("phone", trimmedEmail)
        .eq("used", false)
        .gte("created_at", tenMinsAgo);

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { success: false, error: "Too many codes sent. Please wait a few minutes before trying again." },
          { status: 429 }
        );
      }

      const otp       = generateOTP();
      const otpHash   = hashOTP(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Send email first — if Resend fails, don't store the OTP
      const { success: sent, error: emailError } = await sendOTPviaEmail(trimmedEmail, otp);
      if (!sent) {
        console.error("[send-otp] Email delivery failed:", emailError);
        return NextResponse.json(
          { success: false, error: emailError ?? "Failed to send verification code. Please try again." },
          { status: 502 }
        );
      }

      const { error: dbError } = await admin.from("phone_otps").insert({
        phone:      trimmedEmail,   // email stored as contact identifier
        otp_hash:   otpHash,
        expires_at: expiresAt,
      });
      if (dbError) {
        console.error("[send-otp] DB insert error:", dbError);
        return NextResponse.json(
          { success: false, error: "Could not save code. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: { email: trimmedEmail } });
    }

    // ── PHONE PATH ────────────────────────────────────────────────────────────

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Phone number or email is required." },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format." },
        { status: 400 }
      );
    }

    // Rate-limit: max 3 active OTPs per number in the last 10 minutes
    const admin = createAdminClient();
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { count } = await admin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone", normalized)
      .eq("used", false)
      .gte("created_at", tenMinsAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { success: false, error: "Too many codes sent. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    // Generate OTP + hash
    const otp       = generateOTP();
    const otpHash   = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Send SMS first (if Termii fails, we don't save the OTP)
    const { success: sent, error: smsError } = await sendOTPviaSMS(normalized, otp);

    if (!sent) {
      console.error("[send-otp] SMS delivery failed:", smsError);
      return NextResponse.json(
        { success: false, error: smsError ?? "Failed to send verification code. Please try again." },
        { status: 502 }
      );
    }

    // Store the OTP hash
    const { error: dbError } = await admin.from("phone_otps").insert({
      phone:      normalized,
      otp_hash:   otpHash,
      expires_at: expiresAt,
    });

    if (dbError) {
      console.error("[send-otp] DB insert error:", dbError);
      return NextResponse.json(
        { success: false, error: "Could not save code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { phone: normalized } });
  } catch (err) {
    console.error("[send-otp] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
