/**
 * Canonical category lists and normalizer.
 * All save paths run categories through normalizeCategory() before storing.
 */

export const SALE_CATEGORIES = [
  "Food",
  "Drinks",
  "Clothing",
  "Services",
  "Products",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Stock",
  "Food",
  "Fuel",
  "Transport",
  "Rent",
  "Salary",
  "Utilities",
  "Other",
] as const;

export type SaleCategory    = (typeof SALE_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Synonyms → canonical name (case-insensitive key lookup) */
const SYNONYM_MAP: Record<string, string> = {
  // Food variants
  "food sales":       "Food",
  "food sale":        "Food",
  "foods":            "Food",
  "meal":             "Food",
  "meals":            "Food",
  "snacks":           "Food",
  "snack":            "Food",

  // Drinks variants
  "beverage":         "Drinks",
  "beverages":        "Drinks",
  "drink":            "Drinks",
  "drinks sales":     "Drinks",
  "soft drinks":      "Drinks",

  // Clothing variants
  "clothes":          "Clothing",
  "apparel":          "Clothing",
  "fashion":          "Clothing",
  "wears":            "Clothing",
  "wear":             "Clothing",
  "clothing sales":   "Clothing",

  // Services variants
  "service":          "Services",
  "labour":           "Services",
  "labor":            "Services",

  // Products variants
  "product":          "Products",
  "goods":            "Products",
  "merchandise":      "Products",
  "item":             "Products",
  "items":            "Products",

  // Stock variants
  "stocks":           "Stock",
  "inventory":        "Stock",
  "raw materials":    "Stock",
  "supplies":         "Stock",
  "supply":           "Stock",
  "restocking":       "Stock",

  // Fuel variants
  "petrol":           "Fuel",
  "diesel":           "Fuel",
  "gas":              "Fuel",
  "fuel cost":        "Fuel",
  "fuel costs":       "Fuel",

  // Transport variants
  "transportation":   "Transport",
  "logistics":        "Transport",
  "delivery":         "Transport",
  "shipping":         "Transport",
  "fare":             "Transport",

  // Rent variants
  "shop rent":        "Rent",
  "store rent":       "Rent",
  "space":            "Rent",

  // Salary variants
  "salaries":         "Salary",
  "wages":            "Salary",
  "wage":             "Salary",
  "staff":            "Salary",
  "worker":           "Salary",
  "pay":              "Salary",

  // Utilities variants
  "electricity":      "Utilities",
  "water":            "Utilities",
  "internet":         "Utilities",
  "phone":            "Utilities",
  "data":             "Utilities",
  "light":            "Utilities",
  "nepa":             "Utilities",
  "phcn":             "Utilities",

  // Catch-all for generic/default values
  "sales":            "Other",
  "expenses":         "Other",
  "expense":          "Other",
  "sale":             "Other",
  "general":          "Other",
  "general sales":    "Other",
  "miscellaneous":    "Other",
  "misc":             "Other",
  "uncategorised":    "Other",
  "uncategorized":    "Other",
  "n/a":              "Other",
  "none":             "Other",
};

const ALL_CANONICAL = new Set([
  ...SALE_CATEGORIES,
  ...EXPENSE_CATEGORIES,
]);

/**
 * Returns the canonical category name.
 * - If the input already matches a canonical name (case-insensitive), title-case it.
 * - If it matches a synonym, return the canonical name.
 * - Otherwise return "Other".
 */
export function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "Other";
  const trimmed = raw.trim();
  if (!trimmed) return "Other";

  // Exact canonical match (case-insensitive)
  for (const c of ALL_CANONICAL) {
    if (c.toLowerCase() === trimmed.toLowerCase()) return c;
  }

  // Synonym map lookup
  const key = trimmed.toLowerCase();
  if (SYNONYM_MAP[key]) return SYNONYM_MAP[key];

  // Partial match: if the input starts with a canonical name
  for (const c of ALL_CANONICAL) {
    if (key.startsWith(c.toLowerCase())) return c;
  }

  return "Other";
}
