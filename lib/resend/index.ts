/**
 * Resend Email — https://resend.com
 *
 * We call Resend's REST API directly (no SMTP, no SDK dependency).
 * This mirrors the Termii pattern: no API key → dev mode (logs to console).
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendOTPviaEmail(
  email: string,
  otp:   string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  // ── DEV MODE: no API key — just log to console ────────────────────────────
  if (!apiKey) {
    console.log("\n────────────────────────────────────────");
    console.log(`  [SPAL DEV] OTP for ${email}: ${otp}`);
    console.log("────────────────────────────────────────\n");
    return { success: true };
  }

  // ── PROD MODE: Resend REST API ─────────────────────────────────────────────
  let res: Response;
  let rawText = "";

  try {
    res = await fetch(RESEND_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:    "SPAL <hello@spal.ng>",
        to:      email,
        subject: `${otp} — your SPAL verification code`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Logo / Brand -->
        <tr><td style="padding-bottom:32px;" align="center">
          <div style="display:inline-block;">
            <span style="font-size:28px;font-weight:900;letter-spacing:-1px;">
              <span style="color:#22C55E;">S</span><span style="color:#2563EB;">P</span><span style="color:#FF8A00;">A</span><span style="color:#8B5CF6;">L</span>
            </span>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Header -->
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#22C55E;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
          <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0F172A;line-height:1.2;">
            Here&rsquo;s your code
          </h1>
          <p style="margin:0 0 32px;font-size:14px;color:#64748B;line-height:1.6;">
            Enter this code in SPAL to verify your account. It expires in <strong style="color:#0F172A;">10 minutes</strong>.
          </p>

          <!-- OTP Code Box -->
          <div style="background:#0F172A;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;font-weight:900;letter-spacing:14px;color:#ffffff;font-variant-numeric:tabular-nums;">${otp}</span>
          </div>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #F1F5F9;margin:0 0 24px;">

          <!-- Footer note -->
          <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
            If you didn&rsquo;t request this code, you can safely ignore this email — your account is not at risk.
          </p>

        </td></tr>

        <!-- Bottom tagline -->
        <tr><td style="padding-top:24px;" align="center">
          <p style="margin:0;font-size:12px;color:#94A3B8;">
            Sent by <strong style="color:#0F172A;">SPAL</strong> &middot; Your Business Companion
          </p>
          <p style="margin:4px 0 0;font-size:11px;color:#CBD5E1;">
            <a href="https://spal.ng" style="color:#22C55E;text-decoration:none;">spal.ng</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
        `,
      }),
    });

    rawText = await res.text();
  } catch (networkErr) {
    console.error("[Resend] Network error:", networkErr);
    return {
      success: false,
      error: "Email service unreachable. Please try again in a moment.",
    };
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawText);
  } catch {
    console.error("[Resend] Non-JSON response:", rawText.slice(0, 300));
    return {
      success: false,
      error: "Email service returned an unexpected response. Please try again.",
    };
  }

  if (!res.ok) {
    console.error("[Resend] HTTP", res.status, data);
    const msg = typeof data.message === "string"
      ? data.message
      : `Email delivery failed (${res.status}).`;
    return { success: false, error: msg };
  }

  console.log("[Resend] Sent to", email, "id:", data.id);
  return { success: true };
}
