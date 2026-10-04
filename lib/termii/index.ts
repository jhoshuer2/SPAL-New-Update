/**
 * Termii SMS — Nigerian SMS provider
 * Docs: https://developers.termii.com/messaging
 *
 * We use the regular messaging API with channel "dnd".
 * The DND channel uses Termii's pre-approved N-Alert sender,
 * so no custom sender ID approval is required.
 */

const TERMII_SMS_URL = "https://api.ng.termii.com/api/sms/send";

export interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendOTPviaSMS(
  phone: string,
  otp: string
): Promise<SendResult> {
  const apiKey   = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "N-Alert";

  // ── DEV MODE: no API key — just log to console ────────────────────────────
  if (!apiKey) {
    console.log("\n────────────────────────────────────────");
    console.log(`  [SPAL DEV] OTP for ${phone}: ${otp}`);
    console.log("────────────────────────────────────────\n");
    return { success: true };
  }

  // ── PROD MODE: Termii messaging API ───────────────────────────────────────
  const message =
    `Your SPAL code is ${otp}. ` +
    `Valid for 10 minutes. Never share this code.`;

  let res: Response;
  let rawText = "";

  try {
    res = await fetch(TERMII_SMS_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        to:      phone,
        from:    "Termii",   // Termii's own pre-registered sender — no approval needed
        sms:     message,
        type:    "plain",
        channel: "generic",
      }),
    });

    rawText = await res.text();
  } catch (networkErr) {
    // Fetch itself threw — DNS or connectivity failure
    console.error("[Termii] Network error:", networkErr);
    return {
      success: false,
      error: "SMS service unreachable. Please try again in a moment.",
    };
  }

  // Parse JSON (Termii sometimes returns non-JSON on errors)
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawText);
  } catch {
    console.error("[Termii] Non-JSON response:", rawText.slice(0, 300));
    return {
      success: false,
      error: "SMS service returned an unexpected response. Please try again.",
    };
  }

  if (!res.ok) {
    console.error("[Termii] HTTP", res.status, data);
    const msg = typeof data.message === "string"
      ? data.message
      : `SMS delivery failed (${res.status}).`;
    return { success: false, error: msg };
  }

  // Termii returns { message_id: "...", ... } on success
  if (!data.message_id) {
    console.error("[Termii] No message_id in response:", data);
    const msg = typeof data.message === "string"
      ? data.message
      : "SMS could not be delivered. Please try again.";
    return { success: false, error: msg };
  }

  console.log("[Termii] Sent to", phone, "message_id:", data.message_id);
  return { success: true };
}
