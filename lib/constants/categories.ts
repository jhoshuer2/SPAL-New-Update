// Single source of truth for all record categories.
// Used across AddRecordSheet, voice/picture parsers, and Insights.

export const SALE_CATEGORIES = [
  "Food", "Drinks", "Clothing", "Services", "Products", "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Stock", "Food", "Fuel", "Transport", "Rent", "Salary", "Utilities", "Other",
] as const;

// Combined unique list for Insights category breakdown
export const ALL_CATEGORIES = [
  ...new Set([...SALE_CATEGORIES, ...EXPENSE_CATEGORIES]),
] as const;

export type SaleCategory    = typeof SALE_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
