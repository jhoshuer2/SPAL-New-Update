import type { MenuType } from "@/lib/types";

/** Choices for the menu form. Categories are suggestions; owners can type their own. */
export const MENU_TYPES: { key: MenuType; label: string }[] = [
  { key: "food",   label: "Food" },
  { key: "drinks", label: "Drinks" },
];

export const MENU_CATEGORIES: Record<MenuType, string[]> = {
  food:   ["Mains", "Starters", "Soups", "Sides", "Snacks", "Desserts", "Breakfast", "Grills"],
  drinks: ["Soft Drinks", "Cocktails", "Beers", "Wine", "Spirits", "Water", "Juice", "Hot Drinks"],
};

export const MENU_UNITS: Record<MenuType, string[]> = {
  food:   ["Plates", "Bowls", "Packs", "Portions", "Wraps", "Pieces"],
  drinks: ["Packs", "Bottles", "Cups", "Glasses", "Cans", "Crates"],
};

export const typeNoun = (t: MenuType) => (t === "drinks" ? "Drinks" : "Food");
