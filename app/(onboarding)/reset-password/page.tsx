"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useSPALStore } from "@/store";
import { ArrowLeft01Icon } from "hugeicons-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSendCode() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to send code. Please try again.");
        return;
      }

      setOnboardingData({
        email: email.trim().toLowerCase(),
        phoneNumber: undefined,
        mode: "reset",
      });

      router.push("/verify");
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
      {/* Back to login */}
      <div className="flex items-center">
        <button
          onClick={() => router.push("/login")}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          style={{ background: "#EAE9E7" }}
          aria-label="Go back"
        >
          <ArrowLeft01Icon size={18} color="#0F172A" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <h1 className="text-2xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Reset your password
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          Enter the email linked to your account. We&apos;ll send a code to verify it&apos;s you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8"
      >
        <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
          Email address
        </label>
        <input
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && isValid && handleSendCode()}
          className="spal-input spal-input-email"
          autoCapitalize="none"
          autoCorrect="off"
          autoFocus
        />
        <p className="text-xs text-neutral-400 mt-2">
          We&apos;ll email a 6-digit code — check your inbox (and spam folder).
        </p>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 font-medium mt-3">
            {error}
          </motion.p>
        )}
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <Button fullWidth size="lg" loading={loading} disabled={!isValid} onClick={handleSendCode}>
          Send code
        </Button>
      </motion.div>
    </div>
  );
}
