/**
 * SPAL Mailer — Gmail SMTP via nodemailer
 *
 * Uses smtp.gmail.com which is universally reachable.
 * Requires a Gmail App Password (not your regular Gmail password):
 *   myaccount.google.com → Security → 2-Step Verification → App passwords
 *
 * Dev mode: if GMAIL_USER / GMAIL_APP_PASSWORD are missing, OTP is logged to console.
 */

import nodemailer from "nodemailer";

export interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendOTPviaEmail(
  email: string,
  otp:   string
): Promise<SendResult> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  // ── DEV MODE ──────────────────────────────────────────────────────────────
  if (!user || !pass) {
    console.log("\n────────────────────────────────────────");
    console.log(`  [SPAL DEV] OTP for ${email}: ${otp}`);
    console.log("────────────────────────────────────────\n");
    return { success: true };
  }

  // ── PROD MODE: Gmail SMTP ──────────────────────────────────────────────────
  try {
    const transporter = nodemailer.createTransport({
      host:   "smtp.gmail.com",
      port:   587,
      secure: false,          // STARTTLS
      auth:   { user, pass },
    });

    await transporter.sendMail({
      from:    `"SPAL" <${user}>`,
      to:      email,
      subject: `${otp} is your SPAL code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">Your SPAL verification code</h2>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.6;">
            Enter this code to continue setting up your business account.
            It expires in 10 minutes.
          </p>
          <div style="background:#F8F7F4;border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
            <span style="font-size:44px;font-weight:700;letter-spacing:10px;color:#0F172A;">${otp}</span>
          </div>
          <p style="margin:0;color:#94A3B8;font-size:12px;">
            If you didn&rsquo;t request this, you can safely ignore this email.
            Never share this code with anyone.
          </p>
        </div>
      `,
    });

    console.log("[Mailer] Sent OTP to", email);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Mailer] Send error:", message);
    return {
      success: false,
      error: "Could not send verification email. Please try again.",
    };
  }
}
