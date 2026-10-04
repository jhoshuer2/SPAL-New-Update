// Parse a typed sale such as "sold 3 cartons for 45k" (F03). Runs on the device: instant, free, works offline.
export type QuickSale = { item: string; qty: number | null; amountNaira: number | null };

const MULT: Record<string, number> = { k: 1_000, m: 1_000_000 };
const toNum = (n: string, suffix?: string) => parseFloat(n.replace(/,/g, "")) * (suffix ? MULT[suffix.toLowerCase()] : 1);

export function parseQuickSale(input: string): QuickSale {
  let t = input.trim().replace(/\s+/g, " ").replace(/^(i\s+)?(just\s+)?(sold|sell)\s+/i, "");
  if (!t) return { item: "", qty: null, amountNaira: null };

  // Amount: the last number that is marked as money (₦, k/m, or introduced by for/at/@/=). "@" means per unit.
  const money = [...t.matchAll(/(?:(for|at|@|=)\s*)?(₦)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\b/gi)]
    .filter((m) => m[1] || m[2] || m[4]);
  let amount: number | null = null, perUnit = false;
  const last = money[money.length - 1];
  if (last) {
    amount = toNum(last[3], last[4]);
    perUnit = last[1] === "@";
    t = (t.slice(0, last.index) + t.slice(last.index! + last[0].length)).trim();
  } else {
    // "rice 2500": a trailing bare number is the amount
    const m = /^(.*?)\s*₦?(\d[\d,]*(?:\.\d+)?)$/.exec(t);
    if (m && m[1] && !/^\d+$/.test(m[1])) { amount = toNum(m[2]); t = m[1].trim(); }
  }

  // Quantity: a leading whole number ("3 cartons of indomie")
  let qty: number | null = null;
  const q = /^(\d+)\s*(?:x\s*)?(.*)$/i.exec(t);
  if (q && q[2]) { qty = parseInt(q[1], 10); t = q[2]; }

  const item = t.replace(/^(of|x)\s+/i, "").replace(/\s*(for|at|@|=)\s*$/i, "").trim();
  if (amount !== null && perUnit && qty) amount *= qty;
  return { item, qty, amountNaira: amount !== null && Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null };
}
