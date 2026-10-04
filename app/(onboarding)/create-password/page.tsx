"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSPALStore } from "@/store";
import { ArrowLeft01Icon, EyeIcon, ViewIcon, Tick01Icon } from "hugeicons-react";

export default function CreatePasswordPage() {
  const router = useRouter();
  const { onboardingData } = useSPALStore();
  const isReset = onboardingData.mode === "reset";
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const hasLength = password.length >= 8;
  const isValid   = hasLength;

  async function handleCreate() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/set-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Could not set password. Please try again.");
        return;
      }

      // Go to business name screen for new users; reset flow goes home
      if (isReset) {
        window.location.href = "/home";
      } else {
        router.push("/business-name");
      }
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#EEF3E9" }}>

      {/* Header: back + progress (step 4 of 4) */}
      <div className="px-6 pt-12">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "#EAE9E7" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} color="#0F172A" />
          </button>
          <OnboardProgress step={4} total={4} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] font-bold text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}>
            {isReset ? "Set a new password" : "Create a password"}
          </h1>
          <p className="mt-2 text-neutral-500 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
            You&apos;ll use this with your email or phone to sign in next time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-9"
        >
          {/* Password field with show/hide */}
          <div
            className="flex items-center h-[52px] px-4 rounded-xl"
            style={{ background: "#FAFAFA", border: "1px solid #F4F4F5" }}
          >
            <input
              type={show ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && isValid && handleCreate()}
              className="flex-1 bg-transparent text-spal-navy text-[15px] outline-none placeholder:text-neutral-300"
              style={{ fontFamily: "var(--font-satoshi)" }}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              onClick={() => setShow((s) => !s)}
              className="ml-2 text-neutral-400 active:scale-90 transition-transform"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <ViewIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          {/* Requirement hint */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ background: hasLength ? "#22C55E" : "#E4E4E7" }}
            >
              {hasLength && <Tick01Icon size={11} color="#fff" />}
            </div>
            <span
              className="text-[13px]"
              style={{ fontFamily: "var(--font-satoshi)", color: hasLength ? "#22C55E" : "#A1A1AA" }}
            >
              At least 8 characters
            </span>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-red-500 font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-10" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}>
        <button
          onClick={handleCreate}
          disabled={!isValid || loading}
          className="w-full h-[52px] rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: isValid && !loading ? "#22C55E" : "#E4E4E7",
            color: isValid && !loading ? "#fff" : "#A1A1AA",
          }}
        >
          {loading ? "Saving…" : isReset ? "Save new password" : "Create account"}
        </button>
      </div>
    </div>
  );
}

function OnboardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2 flex-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: i < step ? "#22C55E" : "#EAE9E7" }}
        />
      ))}
    </div>
  );
}
