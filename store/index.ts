/**
 * SPAL Global State — Zustand
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Badge } from "@/lib/gamification/badges";
import type { Business, CoachGoal } from "@/lib/types";

function computeProgress(g: CoachGoal): CoachGoal {
  const total = g.breakdowns.length;
  const done = g.breakdowns.filter((b) => b.completed).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  return { ...g, progress, status: progress === 100 ? "completed" : "active" };
}

export type BusinessType =
  | "food_seller"
  | "bar_owner"
  | "fashion_vendor"
  | "salon"
  | "kiosk"
  | "market_trader"
  | "other";

export type BusinessGoal =
  | "track_sales"
  | "know_profit"
  | "reduce_expenses"
  | "grow_business"
  | "understand_spending";

export type TrackingMethod =
  | "notebook"
  | "whatsapp"
  | "excel"
  | "google_sheets"
  | "notes_app"
  | "receipts"
  | "nothing";

export interface User {
  id: string;
  phone_number?: string | null;
  email?: string | null;
  full_name?: string;
  business_name?: string;
  business_type?: BusinessType;
  business_goals?: BusinessGoal[];
  currency: string;
  tax_rate?: number | null;
  table_count?: number | null;
  whatsapp_number?: string;
  avatar_url?: string | null;
  streak_days: number;
  onboarding_completed: boolean;
  subscription_plan?: string; // 'free' | 'pro'
  inventory_setup_done?: boolean;
  inventory_track_sales?: boolean;
  tracking_methods?: TrackingMethod[];
  active_business_id?: string;
}

export interface DailySummary {
  date: string;
  total_sales: number;
  total_expenses: number;
  profit: number;
  owed?: number;
  ai_insight?: string;
  ai_message?: string;
}

interface SPALStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Onboarding
  onboardingData: {
    businessType?: BusinessType;
    businessName?: string;
    businessSize?: string;   // solo | micro | small | medium | large
    locations?: number;
    trackingMethods?: TrackingMethod[];
    goals?: BusinessGoal[];
    phoneNumber?: string;
    email?: string;
    mode?: "signup" | "reset"; // "reset" = forgot-password flow
  };
  setOnboardingData: (data: Partial<SPALStore["onboardingData"]>) => void;

  // Today's summary (cached)
  todaySummary: DailySummary | null;
  setTodaySummary: (summary: DailySummary) => void;

  // UI state
  addSheetOpen: "sale" | "expense" | null;
  setAddSheet: (type: "sale" | "expense" | null) => void;

  voiceRecorderOpen: boolean;
  setVoiceRecorderOpen: (open: boolean) => void;

  // Bump this after any voice/quick save so home page re-fetches
  recordSavedAt: number;
  bumpRecordSaved: () => void;

  // Gamification — badge celebration overlay
  newBadge: Badge | null;
  setNewBadge: (badge: Badge | null) => void;

  // Multi-business
  activeBusiness: Business | null;
  businesses: Business[];
  setActiveBusiness: (b: Business) => void;
  setBusinesses: (bs: Business[]) => void;

  // Paywall — computed from user.subscription_plan
  isPro: boolean;

  // SPAL Goals (voice-first coaching) — persisted locally
  coachGoals: CoachGoal[];
  addCoachGoals: (goals: CoachGoal[]) => void;
  toggleBreakdown: (goalId: string, breakdownId: string) => void;
  markGoalAchieved: (goalId: string) => void;
  setGoalDueDate: (goalId: string, dueDate: string | null) => void;
  deleteCoachGoal: (goalId: string) => void;

  // Logout
  logout: () => void;
}

export const useSPALStore = create<SPALStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isPro: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isPro: user?.subscription_plan === "pro" }),

      // Onboarding
      onboardingData: {},
      setOnboardingData: (data) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        })),

      // Summary
      todaySummary: null,
      setTodaySummary: (summary) => set({ todaySummary: summary }),

      // UI
      addSheetOpen: null,
      setAddSheet: (type) => set({ addSheetOpen: type }),

      voiceRecorderOpen: false,
      setVoiceRecorderOpen: (open) => set({ voiceRecorderOpen: open }),

      recordSavedAt: 0,
      bumpRecordSaved: () => set({ recordSavedAt: Date.now() }),

      // Multi-business
      activeBusiness: null,
      businesses: [],
      setActiveBusiness: (b) => set({ activeBusiness: b }),
      setBusinesses: (bs) => set({ businesses: bs }),

      // Gamification
      newBadge: null,
      setNewBadge: (badge) => set({ newBadge: badge }),

      // SPAL Goals
      coachGoals: [],
      addCoachGoals: (goals) =>
        set((state) => ({ coachGoals: [...goals.map(computeProgress), ...state.coachGoals] })),
      toggleBreakdown: (goalId, breakdownId) =>
        set((state) => ({
          coachGoals: state.coachGoals.map((g) =>
            g.id !== goalId
              ? g
              : computeProgress({
                  ...g,
                  breakdowns: g.breakdowns.map((b) =>
                    b.id === breakdownId ? { ...b, completed: !b.completed } : b
                  ),
                })
          ),
        })),
      markGoalAchieved: (goalId) =>
        set((state) => ({
          coachGoals: state.coachGoals.map((g) =>
            g.id !== goalId
              ? g
              : computeProgress({ ...g, breakdowns: g.breakdowns.map((b) => ({ ...b, completed: true })) })
          ),
        })),
      setGoalDueDate: (goalId, dueDate) =>
        set((state) => ({
          coachGoals: state.coachGoals.map((g) => (g.id === goalId ? { ...g, dueDate } : g)),
        })),
      deleteCoachGoal: (goalId) =>
        set((state) => ({ coachGoals: state.coachGoals.filter((g) => g.id !== goalId) })),

      // Logout
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isPro: false,
          todaySummary: null,
          onboardingData: {},
          newBadge: null,
          activeBusiness: null,
          businesses: [],
          coachGoals: [],
        }),
    }),
    {
      name: "spal-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingData: state.onboardingData,
        activeBusiness: state.activeBusiness,
        coachGoals: state.coachGoals,
      }),
    }
  )
);
