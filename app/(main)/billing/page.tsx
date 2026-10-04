"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft01Icon, CheckmarkCircle02Icon } from "hugeicons-react";
import { formatCurrency } from "@/lib/utils/currency";

const FF = "var(--font-satoshi)";
const PURPLE = "#3F0B8C";

interface Feature { label: string; soon?: boolean }
interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthly: number;      // ₦ per month
  yearlyOff: number;    // ₦ off each month when billed yearly
  cardBg: string;
  features: Feature[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter Plan",
    tagline: "For individuals and small businesses getting started",
    monthly: 1500, yearlyOff: 200,
    cardBg: "#ECF7EF",
    features: [
      { label: "Record sales" },
      { label: "Record expenses" },
      { label: "Basic business dashboard" },
      { label: "Daily and weekly summaries" },
      { label: "Basic business insights" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For businesses ready to understand and improve",
    monthly: 3500, yearlyOff: 300,
    cardBg: "#FCEEE8",
    features: [
      { label: "Everything in Starter" },
      { label: "Unlimited sales and expense records" },
      { label: "Inventory management" },
      { label: "Advanced business insights" },
      { label: "Profit and loss overview" },
      { label: "Ask SPAL" },
      { label: "Export business reports" },
      { label: "Customer debt tracking" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For established businesses managing more",
    monthly: 7500, yearlyOff: 500,
    cardBg: "#EEEBFB",
    features: [
      { label: "Everything in Growth" },
      { label: "Multiple staff accounts" },
      { label: "Advanced inventory management" },
      { label: "Multiple business locations" },
      { label: "POS integration" },
      { label: "Advanced financial reports" },
      { label: "AI-powered business recommendations" },
      { label: "Staff activity tracking", soon: true },
      { label: "Priority support" },
      { label: "Advanced business analytics" },
    ],
  },
];

const CURRENT: string | null = null; // no active plan yet

export default function BillingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [toast, setToast] = useState(false);

  const canSubscribe = selected !== null && selected !== CURRENT;
  const maxYearlySave = Math.max(...PLANS.map((p) => p.yearlyOff * 12));
  function subscribe() {
    if (!canSubscribe) return;
    setToast(true);
    setTimeout(() => setToast(false), 2400);
  }

  return (
    <div className="min-h-full pb-32" style={{ background: "#EDF3E8", fontFamily: FF }}>
      {/* Purple hero */}
      <div className="relative overflow-hidden px-5 pt-12 pb-14" style={{ background: PURPLE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/plan-ladder.webp" alt="" aria-hidden
          className="absolute right-2 top-4 pointer-events-none select-none" style={{ height: "auto", maxHeight: "82%", width: "auto" }} />
        <button onClick={() => router.back()}
          className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center active:scale-95" style={{ background: "rgba(255,255,255,0.2)" }} aria-label="Back">
          <ArrowLeft01Icon size={20} color="#fff" />
        </button>
        <h1 className="relative z-10 text-[34px] font-black text-white leading-tight mt-4 max-w-[62%]" style={{ fontFamily: FF }}>Choose your payment plan</h1>
        <p className="relative z-10 text-[16px] text-white/85 mt-4" style={{ fontFamily: FF }}>Unlimited usage</p>
        <p className="relative z-10 text-[16px] text-white/85" style={{ fontFamily: FF }}>7-days free trial</p>
      </div>

      {/* Billing period toggle */}
      <div className="px-4 mt-5">
        <div className="flex items-center bg-white rounded-full p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {(["month", "year"] as const).map((p) => {
            const active = period === p;
            return (
              <button key={p} onClick={() => setPeriod(p)}
                className="flex-1 h-10 rounded-full text-[14px] font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: active ? "#22C55E" : "transparent", color: active ? "#fff" : "#6B7280" }}>
                {p === "month" ? "Monthly" : "Yearly"}
                {p === "year" && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: active ? "#fff" : "#22C55E", color: active ? "#16A34A" : "#fff" }}>
                    Save {formatCurrency(maxYearlySave)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan cards */}
      <div className="px-4 mt-4 space-y-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === CURRENT;
          const on = selected === plan.id;
          const perMonth = period === "year" ? plan.monthly - plan.yearlyOff : plan.monthly;
          const yearlyTotal = (plan.monthly - plan.yearlyOff) * 12;
          return (
            <button key={plan.id} onClick={() => setSelected(plan.id)}
              className="w-full text-left rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
              style={{ border: on ? "2px solid #22C55E" : "2px solid transparent", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {isCurrent && (
                <div className="text-center py-2" style={{ background: "#22C55E" }}>
                  <span className="text-[14px] font-black text-white" style={{ fontFamily: FF }}>Current Plan</span>
                </div>
              )}
              <div className="px-5 py-5" style={{ background: plan.cardBg }}>
                <div className="flex items-start justify-between">
                  <p className="text-[20px] font-black text-spal-navy" style={{ fontFamily: FF }}>{plan.name}</p>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ border: on ? "none" : "2px solid #C4CBD4", background: on ? "#22C55E" : "transparent" }}>
                    {on && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-[14.5px] text-neutral-500 mt-1.5" style={{ fontFamily: FF }}>{plan.tagline}</p>
                <div className="mt-3" style={{ fontFamily: FF }}>
                  <p>
                    <span className="text-[26px] font-black text-spal-navy">{formatCurrency(perMonth)}</span>
                    <span className="text-[16px] text-neutral-500"> / month</span>
                  </p>
                  {period === "year" && (
                    <p className="text-[13px] text-neutral-500 mt-0.5">{formatCurrency(yearlyTotal)} billed yearly</p>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <CheckmarkCircle02Icon size={20} color="#9CA3AF" />
                      <span className="text-[15px] text-neutral-700" style={{ fontFamily: FF }}>{f.label}</span>
                      {f.soon && (
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ fontFamily: FF, color: "#F97316", background: "#FDECDD" }}>Coming Soon</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Subscribe */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 pb-safe"
        style={{ bottom: 0, background: "linear-gradient(to top, #EDF3E8 78%, transparent)" }}>
        <button onClick={subscribe} disabled={!canSubscribe}
          className="w-full h-14 rounded-full font-black text-[17px] active:scale-[0.98] transition-transform"
          style={{ fontFamily: FF, background: canSubscribe ? "#22C55E" : "#D6DDD2", color: canSubscribe ? "#fff" : "#8A9585" }}>
          Subscribe to Plan
        </button>
      </div>

      {/* Coming-soon toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22 }} className="fixed left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-full"
            style={{ background: "#0F172A", bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)", boxShadow: "0 10px 30px rgba(0,0,0,0.28)" }}>
            <span className="text-[14px] font-bold text-white" style={{ fontFamily: FF }}>Paid plans are coming soon</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
