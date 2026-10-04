// Pure onboarding logic (spec §8.1, B04-B07): answers -> placement, conflict check, fallback reflection.
import { placeLevel, hasConflict, describeDuration, type Placement, type PlacementAnswers } from "./placement";

export const BUSINESS_TYPES = [
  { value: "trading", label: "Trading & retail" },
  { value: "food", label: "Food & drinks" },
  { value: "fashion_beauty", label: "Fashion & beauty" },
  { value: "services", label: "Services" },
  { value: "tech", label: "Tech & digital" },
  { value: "agriculture", label: "Agriculture" },
  { value: "creative", label: "Creative" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Something else" },
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

export const CHALLENGES = [
  "I don't know where to start", "Not enough customers", "My money is unclear", "Pricing",
  "Staff", "Registration", "Funding", "Feeling overwhelmed",
] as const;

export const REVENUE_BANDS = ["Nothing yet", "Under ₦100k", "₦100k – ₦500k", "₦500k – ₦2m", "Over ₦2m"] as const;

export type OnboardingAnswers = {
  name: string;
  state: string;
  city: string;
  language: "en" | "pcm";
  businessType?: BusinessType;
  workMode?: "solo" | "partner" | "team";
  sellChannel?: "online" | "physical" | "both";
  noBusinessYet?: boolean;
  hasSold?: boolean;
  isRegistered?: boolean;
  paidStaffCount?: number;
  locationsOrChannels?: number;
  hasManagers?: boolean;
  isIncorporatedWithMgmt?: boolean;
  businessCount?: number;
  /** index into REVENUE_BANDS, 0 = nothing */
  revenueBand?: number;
  monthsRunning?: number;
  challenges: string[];
  challengeNote?: string;
  goals: string[];
};

export function toPlacementAnswers(a: OnboardingAnswers): PlacementAnswers {
  return {
    hasSold: a.hasSold ?? false,
    isRegistered: a.isRegistered ?? false,
    paidStaffCount: a.paidStaffCount ?? 0,
    locationsOrChannels: a.locationsOrChannels ?? 1,
    hasManagers: a.hasManagers ?? false,
    isIncorporatedWithMgmt: a.isIncorporatedWithMgmt ?? false,
    businessCount: a.businessCount ?? 1,
    revenueBand: a.revenueBand,
    monthsRunning: a.monthsRunning,
  };
}

export const placeFromAnswers = (a: OnboardingAnswers): Placement => placeLevel(toPlacementAnswers(a));
export const needsConflictFollowUp = (a: OnboardingAnswers) => hasConflict(toPlacementAnswers(a));

const TYPE_LABEL: Record<string, string> = Object.fromEntries(BUSINESS_TYPES.map((t) => [t.value, t.label.toLowerCase()]));

/** Templated "here's what I heard" (B07). Used whenever the AI call fails or is slow (spec §9.2). */
export function templateReflection(a: OnboardingAnswers): string[] {
  const out: string[] = [];
  const what = a.noBusinessYet || !a.businessType ? "You're planning something of your own" : `You work in ${TYPE_LABEL[a.businessType] ?? "business"}`;
  const duration = describeDuration(a.monthsRunning);
  const how = a.hasSold === false ? "and you haven't made your first sale yet" : duration ? `and ${duration.charAt(0).toLowerCase()}${duration.slice(1)}` : "and you're already selling";
  out.push(`${what} ${how}.`);
  if (a.challenges.length) out.push(`On your mind: ${a.challenges.slice(0, 2).map((c) => `“${c}”`).join(" and ")}.`);
  if (a.goals.length) out.push(`The goal you picked: “${a.goals[0]}”.`);
  return out.slice(0, 3);
}

/** Business type mapping onto the legacy `businesses.business_type` check constraint. */
export function legacyBusinessType(t?: BusinessType): string {
  switch (t) {
    case "trading": return "market_trader";
    case "food": return "food_seller";
    case "fashion_beauty": return "fashion_vendor";
    default: return "other";
  }
}

export function suggestGoals(level: number): string[] {
  const byLevel: string[][] = [
    ["Make my first sale", "Know what I need to start", "Talk to 5 possible customers"],
    ["Record my sales every day", "Know my profit on each product", "Get more repeat customers"],
    ["Keep clean records for 3 months", "Register and get my TIN", "Hit a monthly profit target"],
    ["Pay my team on time", "Write down every role", "Open a second channel"],
    ["Expand to a new location", "Get funding-ready", "Document how the business runs"],
    ["Mentor someone", "Plan the long term", "Start another venture"],
  ];
  return byLevel[Math.max(0, Math.min(5, level))];
}
