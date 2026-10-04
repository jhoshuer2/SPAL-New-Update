// App lock (L04, spec §13): a PIN that guards the app on a cold start and after 5 minutes in the background.
// The PIN never leaves the device. It is stored only as a salted PBKDF2 hash. (Fingerprint/face unlock needs the
// native app or WebAuthn and is not part of the web version yet.)
export const LOCK_AFTER_MS = 5 * 60 * 1000;
const ITER = 150_000;

const toHex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b instanceof Uint8Array ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer : b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h: string) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITER }, key, 256));
}

export type StoredPin = { salt: string; hash: string };
export async function hashPin(pin: string): Promise<StoredPin> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toHex(salt), hash: await derive(pin, salt) };
}
export async function checkPin(pin: string, stored: StoredPin): Promise<boolean> {
  const h = await derive(pin, fromHex(stored.salt));
  if (h.length !== stored.hash.length) return false;
  let diff = 0; for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ stored.hash.charCodeAt(i); // constant-time compare
  return diff === 0;
}

/** Lock on a cold start (never unlocked this session), or after more than 5 minutes away. */
export function shouldLock(o: { enabled: boolean; unlockedThisSession: boolean; hiddenAt: number | null; now: number }): boolean {
  if (!o.enabled) return false;
  if (!o.unlockedThisSession) return true;
  return o.hiddenAt !== null && o.now - o.hiddenAt > LOCK_AFTER_MS;
}

/** Wrong PINs slow down: nothing for 4 tries, then 30s, 1m, 5m, 15m. Returns ms to wait before the next try. */
export function waitAfterFailures(fails: number): number {
  if (fails < 5) return 0;
  return [30_000, 60_000, 300_000, 900_000][Math.min(fails - 5, 3)];
}
