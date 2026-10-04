// Money is integer kobo (₦1 = 100 kobo). Format as naira only at display time.
export type Kobo = number;

export const nairaToKobo = (naira: number): Kobo => Math.round(naira * 100);

export function formatNaira(kobo: Kobo, opts: { withKobo?: boolean } = {}): string {
  const sign = kobo < 0 ? '-' : '';
  const abs = Math.abs(kobo);
  const naira = Math.floor(abs / 100);
  const rem = abs % 100;
  const base = naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const tail = opts.withKobo || rem !== 0 ? `.${rem.toString().padStart(2, '0')}` : '';
  return `${sign}₦${base}${tail}`;
}

/** Parses "45k" -> 4_500_000 kobo, "1.5m", "2,500", "₦300". Returns null if invalid. */
export function parseMoneyShorthand(input: string): Kobo | null {
  const s = input.trim().toLowerCase().replace(/[₦,\s]/g, '');
  const m = /^(\d+(?:\.\d+)?)(k|m)?$/.exec(s);
  if (!m) return null;
  const mult = m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1;
  return nairaToKobo(parseFloat(m[1]) * mult);
}
