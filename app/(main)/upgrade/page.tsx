"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useSPALStore } from "@/store";
import { ZapIcon, Tick01Icon, Cancel01Icon } from "hugeicons-react";

const FEATURES = [
  { label: "Record sales & expenses",   free: true,  pro: true  },
  { label: "Daily summary (numbers)",   free: true,  pro: true  },
  { label: "AI daily insight message",  free: false, pro: true  },
  { label: "Ask SPAL (AI chat)",        free: "5/mo", pro: "Unlimited" },
  { label: "AI Financial Advisors",     free: "Ade only", pro: "All 4 advisors" },
  { label: "Unlimited conversations",   free: false, pro: true  },
  { label: "Weekly WhatsApp report",    free: false, pro: true  },
  { label: "Advanced insights",         free: false, pro: true  },
];

function SuccessBanner() {
  const { setUser, user } = useSPALStore();

  useEffect(() => {
    // Re-fetch user to get updated subscription_plan
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setUser(d.data); })
      .catch(() => {});
  }, [setUser]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 mb-4 bg-spal-green-50 border border-spal-green-100 rounded-2xl p-4 text-center"
    >
      <p className="text-2xl mb-1">🎉</p>
      <p className="text-sm font-bold text-spal-green-700">
        Welcome to SPAL Pro{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
      </p>
      <p className="text-xs text-spal-green-600 mt-0.5">
        All advisors and features are now unlocked.
      </p>
    </motion.div>
  );
}

function UpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isPro } = useSPALStore();
  const [selected, setSelected] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const success = searchParams.get("success") === "true";

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Could not start payment. Please try again.");
        return;
      }
      window.location.href = data.data.authorization_url;
    } catch {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-5 animate-fade-in">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-neutral-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Success banner */}
      {success && <SuccessBanner />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-spal-purple to-spal-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <ZapIcon size={28} color="#fff" />
        </div>
        <h1 className="text-2xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
          Unlock SPAL Pro
        </h1>
        <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
          Full AI advisors, unlimited insights, and more.
        </p>
      </motion.div>

      {/* Plan selector */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {(["monthly", "yearly"] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelected(plan)}
              className={`rounded-2xl p-4 border-2 text-left transition-all ${
                selected === plan
                  ? "border-spal-purple bg-spal-purple-50"
                  : "border-neutral-100 bg-white"
              }`}
            >
              {plan === "yearly" && (
                <span className="inline-block text-[10px] font-bold text-spal-green bg-spal-green-50 border border-spal-green-100 rounded-full px-2 py-0.5 mb-1.5">
                  BEST VALUE
                </span>
              )}
              <p className="text-sm font-bold text-spal-navy capitalize">{plan}</p>
              <p className={`text-xl font-bold mt-0.5 ${selected === plan ? "text-spal-purple" : "text-spal-navy"}`}>
                {plan === "monthly" ? "₦2,000" : "₦18,000"}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {plan === "monthly" ? "per month" : "per year · saves ₦6,000"}
              </p>
            </button>
          ))}
        </motion.div>
      )}

      {/* Features list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-neutral-100 overflow-hidden"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <div className="grid grid-cols-3 px-4 py-2 bg-neutral-50 border-b border-neutral-100">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide col-span-1">Feature</span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide text-center">Free</span>
          <span className="text-[10px] font-bold text-spal-purple uppercase tracking-wide text-center">Pro</span>
        </div>
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className={`grid grid-cols-3 px-4 py-3 items-center ${i < FEATURES.length - 1 ? "border-b border-neutral-50" : ""}`}
          >
            <p className="text-xs text-spal-navy col-span-1 leading-snug">{f.label}</p>
            <div className="flex justify-center">
              {typeof f.free === "boolean" ? (
                f.free
                  ? <Tick01Icon size={16} className="text-spal-green" />
                  : <Cancel01Icon size={16} className="text-neutral-300" />
              ) : (
                <span className="text-[10px] text-neutral-500 font-medium text-center leading-tight">{f.free}</span>
              )}
            </div>
            <div className="flex justify-center">
              {typeof f.pro === "boolean" ? (
                f.pro
                  ? <Tick01Icon size={16} className="text-spal-green" />
                  : <Cancel01Icon size={16} className="text-neutral-300" />
              ) : (
                <span className="text-[10px] text-spal-purple font-semibold text-center leading-tight">{f.pro}</span>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      {!isPro ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-14 bg-spal-purple rounded-2xl text-white font-bold text-base font-[family-name:var(--font-satoshi)] active:scale-95 transition-all disabled:opacity-60 shadow-md"
          >
            {loading ? "Redirecting to Paystack..." : `Upgrade Now — ${selected === "monthly" ? "₦2,000/mo" : "₦18,000/yr"}`}
          </button>
          <p className="text-center text-xs text-neutral-400">
            Secure payment via Paystack · Cancel anytime
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-spal-green-50 border border-spal-green-100 rounded-2xl p-4 text-center"
        >
          <p className="text-sm font-bold text-spal-green-700">You are on SPAL Pro ✓</p>
          <p className="text-xs text-spal-green-600 mt-0.5">All features are unlocked.</p>
        </motion.div>
      )}
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-spal-purple border-t-transparent rounded-full animate-spin" /></div>}>
      <UpgradeContent />
    </Suspense>
  );
}

