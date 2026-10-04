// spal-privacy-guard (spec §9.2, I03): find private details in a draft post before it is shared. Pure and instant.
// This warns; it does not forbid. The author decides, but is never surprised.
export type Finding = { kind: "amount" | "phone" | "account" | "email"; start: number; end: number; text: string };

const MONEY_WORDS = /\b(sales?|sold|profit|revenue|made|earn(?:ed|ing)?|income|cost|spent|price|paid|pay|owe[sd]?|debt|loan|salary|budget|turnover|worth)\b/i;
// A number with optional thousands commas, never a trailing comma: 45,000 or 45000.50
const NUM = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?`;

function collect(text: string, re: RegExp, kind: Finding["kind"], out: Finding[], accept?: (m: RegExpExecArray) => boolean) {
  for (const m of text.matchAll(re)) {
    const full = m as RegExpExecArray;
    if (accept && !accept(full)) continue;
    out.push({ kind, start: full.index!, end: full.index! + full[0].length, text: full[0] });
  }
}

export function scanPrivate(text: string): Finding[] {
  const found: Finding[] = [];
  // Phone numbers first (so a phone is never also reported as an account number)
  collect(text, /(?:\+?234|\b0)[\s-]?[789][01]\d[\s-]?\d{3}[\s-]?\d{4}\b/g, "phone", found);
  collect(text, /[\w.+-]+@[\w-]+\.[\w.-]+/g, "email", found);
  collect(text, /\b\d{10}\b/g, "account", found, (m) => !found.some((f) => f.kind === "phone" && m.index! >= f.start && m.index! < f.end));
  // Money: currency marker, comma-grouped thousands, or k/m next to a money word
  collect(text, new RegExp(String.raw`(?:₦|\bNGN\s?|\bN(?=\d))\s?${NUM}(?:\s?(?:k|m|million|thousand))?\b`, "gi"), "amount", found);
  collect(text, new RegExp(String.raw`\b${NUM}(?:\s?(?:k|m|million|thousand))?\s?(?:naira|ngn)\b`, "gi"), "amount", found);
  collect(text, /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, "amount", found);
  collect(text, /\b\d+(?:\.\d+)?\s?(?:k|m)\b/gi, "amount", found, (m) => {
    const around = text.slice(Math.max(0, m.index! - 25), m.index! + m[0].length + 25);
    return MONEY_WORDS.test(around);
  });

  // Drop findings that sit inside a longer one (e.g. "₦1,500" also matches the comma-grouped rule), keep the widest.
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Finding[] = [];
  for (const f of found) if (!out.some((o) => f.start >= o.start && f.end <= o.end)) out.push(f);
  return out;
}

export function redact(text: string, findings: Finding[]): string {
  let out = "", pos = 0;
  for (const f of [...findings].sort((a, b) => a.start - b.start)) {
    if (f.start < pos) continue;
    out += text.slice(pos, f.start) + (f.kind === "amount" ? "[amount hidden]" : f.kind === "phone" ? "[phone hidden]" : f.kind === "email" ? "[email hidden]" : "[number hidden]");
    pos = f.end;
  }
  return out + text.slice(pos);
}

export const KIND_LABEL: Record<Finding["kind"], string> = { amount: "an amount of money", phone: "a phone number", account: "what looks like an account number", email: "an email address" };

/** "an amount of money", "an amount of money and a phone number", "a, b and c". */
export function describeFindings(findings: Finding[]): string {
  const parts = [...new Set(findings.map((f) => KIND_LABEL[f.kind]))];
  return parts.length <= 1 ? parts[0] ?? "" : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
