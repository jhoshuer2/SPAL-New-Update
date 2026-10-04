/**
 * Currency utilities for SPAL
 * Primary currency: NGN (Nigerian Naira)
 */

export const DEFAULT_CURRENCY = "NGN";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  USD: "$",
};

/**
 * Format a number as currency
 * e.g. 12500 → "₦12,500"
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  compact = false
): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  if (compact && amount >= 1000) {
    if (amount >= 1_000_000) {
      return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }

  return `${symbol}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Parse shorthand amounts from user input
 * "15k" → 15000, "2.5m" → 2500000
 */
export function parseAmount(input: string): number {
  const clean = input.trim().toLowerCase().replace(/[,₦₵$]/g, "");

  if (clean.endsWith("m")) {
    return parseFloat(clean) * 1_000_000;
  }
  if (clean.endsWith("k")) {
    return parseFloat(clean) * 1000;
  }
  return parseFloat(clean) || 0;
}

/**
 * Format a percentage change with sign
 * e.g. 12.5 → "+12.5%", -5 → "-5%"
 */
export function formatChange(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Calculate profit from sales and expenses
 */
export function calcProfit(sales: number, expenses: number): number {
  return sales - expenses;
}

/**
 * Get profit margin percentage
 */
export function profitMargin(sales: number, expenses: number): number {
  if (sales === 0) return 0;
  return ((sales - expenses) / sales) * 100;
}
