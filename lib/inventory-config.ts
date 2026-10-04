import type { BusinessType } from "@/store";

export interface InventoryConfig {
  title: string;
  itemLabel: string;
  isIngredientBased: boolean;
  units: string[];
  suggestions: string[];
  emptyHint: string;
  setupPrompt: string;
}

const CONFIGS: Record<BusinessType, InventoryConfig> = {
  food_seller: {
    title: "My Supplies",
    itemLabel: "supply",
    isIngredientBased: true,
    units: ["kg", "liters", "pieces", "bunches", "cups", "wraps", "packs", "bags", "mudu"],
    suggestions: ["Palm Oil", "Rice", "Tomatoes", "Onions", "Pepper", "Gas / Kerosene", "Seasoning", "Salt", "Flour"],
    emptyHint: "Track your ingredients and supplies so you never run out mid-day.",
    setupPrompt: "Pick the ingredients and supplies you use most. You can add your own too.",
  },
  bar_owner: {
    title: "My Stock",
    itemLabel: "product",
    isIngredientBased: false,
    units: ["bottles", "crates", "packs", "cartons", "pieces"],
    suggestions: ["Star Beer", "Heineken", "Guinness Stout", "Coke", "Pepsi", "Malta", "Water", "Alomo Bitters"],
    emptyHint: "Track your drinks and stock so you always know what's running low.",
    setupPrompt: "Pick the drinks and products you sell. Add anything not on the list.",
  },
  fashion_vendor: {
    title: "My Inventory",
    itemLabel: "item",
    isIngredientBased: false,
    units: ["pieces", "pairs", "yards", "sets", "rolls", "bundles"],
    suggestions: ["Tops / Shirts", "Trousers / Jeans", "Dresses", "Shoes", "Bags", "Fabric / Material", "Accessories"],
    emptyHint: "Track your items and sizes so you know what's selling fast.",
    setupPrompt: "Select the types of items you sell. Give them names that make sense to you.",
  },
  salon: {
    title: "My Supplies",
    itemLabel: "product",
    isIngredientBased: true,
    units: ["bottles", "sachets", "packs", "tubes", "pieces", "sets"],
    suggestions: ["Relaxer", "Shampoo", "Conditioner", "Hair Extensions", "Clippers Oil", "Styling Gel", "Hair Colour"],
    emptyHint: "Track your products so you never run short during a busy day.",
    setupPrompt: "Pick the products and supplies you use regularly. You can use your own names.",
  },
  kiosk: {
    title: "My Stock",
    itemLabel: "product",
    isIngredientBased: false,
    units: ["pieces", "packs", "crates", "sachets", "cartons", "bottles"],
    suggestions: ["Bottled Water", "Noodles", "Biscuits", "Soft Drinks", "Bread", "Eggs", "Sweets / Candy", "Milk Sachets"],
    emptyHint: "Track what you have in stock so you reorder before you run out.",
    setupPrompt: "Select the products you stock most. You can always add more later.",
  },
  market_trader: {
    title: "My Inventory",
    itemLabel: "item",
    isIngredientBased: false,
    units: ["pieces", "kg", "bundles", "bags", "packs", "baskets", "crates"],
    suggestions: [],
    emptyHint: "Add what you sell so you can easily track your stock.",
    setupPrompt: "Type in the names of what you sell. Use the names you're already used to.",
  },
  other: {
    title: "My Inventory",
    itemLabel: "item",
    isIngredientBased: false,
    units: ["pieces", "kg", "liters", "packs", "units", "sets"],
    suggestions: [],
    emptyHint: "Track your items so you always know what you have on hand.",
    setupPrompt: "Add the items you want to track. Use names that work for you.",
  },
};

export function getInventoryConfig(businessType?: BusinessType | null): InventoryConfig {
  return CONFIGS[businessType ?? "other"] ?? CONFIGS.other;
}
