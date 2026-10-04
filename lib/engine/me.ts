// Me & settings logic (L01–L05, L10). Pure.
/** The values the live `users.business_type` check constraint allows (migration 001). */
export const LEGACY_BUSINESS_TYPES = ["food_seller", "bar_owner", "fashion_vendor", "salon", "kiosk", "market_trader", "other"] as const;
export const BUSINESS_TYPE_LABEL: Record<string, string> = {
  food_seller: "Food seller", bar_owner: "Bar owner", fashion_vendor: "Fashion vendor", salon: "Salon", kiosk: "Kiosk", market_trader: "Market trader", other: "Other",
};

/** PIN rules for the app lock (L04): 4 to 6 digits, nothing trivially guessable. */
export function pinProblem(pin: string): string | null {
  if (!/^\d{4,6}$/.test(pin)) return "Use 4 to 6 digits.";
  if (/^(\d)\1+$/.test(pin)) return "That's too easy to guess. Try different digits.";
  if ("0123456789".includes(pin) || "9876543210".includes(pin)) return "That's too easy to guess. Try different digits.";
  return null;
}

/** Password strength hint (A05/L04): a nudge, not a gate. */
export function passwordHint(pw: string): { ok: boolean; message: string } {
  if (pw.length < 8) return { ok: false, message: "Use at least 8 characters." };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (kinds < 2) return { ok: false, message: "Mix letters with numbers or symbols." };
  return { ok: true, message: pw.length >= 12 ? "Strong." : "Good." };
}

/** Days left in the 30-day deletion grace period (never negative). */
export const graceDaysLeft = (purgeAfter: string, now = Date.now()): number => Math.max(0, Math.ceil((Date.parse(purgeAfter) - now) / 86_400_000));
