"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSPALStore } from "@/store";
import { ArrowLeft01Icon, ArrowReloadHorizontalIcon } from "hugeicons-react";

export default function VerifyPage() {
  const router = useRouter();
  const { onboardingData, setUser } = useSPALStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmail  = !!onboardingData.email;
  const isReset  = onboardingData.mode === "reset";
  const isSignup = onboardingData.mode === "signup";
  const contact  = onboardingData.email ?? onboardingData.phoneNumber ?? "your contact";

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "") && value) handleVerify(newOtp.join(""));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      setOtp(text.split(""));
      handleVerify(text);
    }
  }

  async function handleVerify(code: string = otp.join("")) {
    if (code.length < 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEmail
            ? { email: onboardingData.email }
            : { phone: onboardingData.phoneNumber }),
          token: code,
          mode: onboardingData.mode ?? "signup",
          onboardingData: {
            businessType: onboardingData.businessType,
            goals: onboardingData.goals,
          },
        }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.error === "account_exists") {
          setError(data.message + " Redirecting to sign in…");
          setTimeout(() => router.push("/login"), 1800);
          return;
        }
        setError(data.error ?? "Wrong code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setUser(data.data.user);
      // Signup and reset flows always set a password; brand-new users too.
      // Only a plain returning-user OTP login goes straight to home.
      const needsPassword = isSignup || isReset || data.data.isNewUser;
      if (needsPassword) {
        router.push("/create-password");
      } else {
        // Hard navigation so the proxy middleware sees the session cookies
        window.location.href = "/home";
      }
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendTimer(30);
    setError("");
    const body = isEmail
      ? { email: onboardingData.email }
      : { phone: onboardingData.phoneNumber };
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const filled = otp.every((d) => d !== "");

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#EEF3E9" }}>

      {/* Header: back + progress (step 3 of 4) */}
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
          <OnboardProgress step={3} total={4} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] font-bold text-spal-navy leading-tight" style={{ fontFamily: "var(--font-satoshi)", letterSpacing: "-0.02em" }}>
            Enter the code
          </h1>
          <p className="mt-2 text-neutral-500 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
            We sent a 6-digit code to{" "}
            <strong className="text-spal-navy">{contact}</strong>
          </p>
        </motion.div>

        {/* OTP inputs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-9 flex justify-between gap-2"
        >
          {otp.map((digit, i) => {
            const isFocused = focusedIdx === i;
            return (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={() => setFocusedIdx(i)}
                onPaste={handlePaste}
                className="text-center text-2xl font-bold outline-none transition-all duration-150"
                style={{
                  width: "52px",
                  height: "56px",
                  borderRadius: "14px",
                  WebkitAppearance: "none",
                  appearance: "none",
                  fontFamily: "var(--font-satoshi)",
                  color: "#0F172A",
                  background: isFocused ? "#E8F0FE" : "#FAFAFA",
                  border: `1.5px solid ${isFocused ? "#3871ED" : digit ? "#D4D4D8" : "#F4F4F5"}`,
                }}
              />
            );
          })}
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-500 font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
            {error}
          </motion.p>
        )}

        {/* Resend pill */}
        <div className="mt-7 flex justify-center">
          {resendTimer > 0 ? (
            <div
              className="inline-flex items-center gap-2 px-4 h-[38px] rounded-full"
              style={{ background: "#F5F2E8" }}
            >
              <ArrowReloadHorizontalIcon size={13} className="text-neutral-400" />
              <span className="text-[13px] text-neutral-500 font-medium" style={{ fontFamily: "var(--font-satoshi)" }}>
                Resend in {resendTimer}s
              </span>
            </div>
          ) : (
            <button
              onClick={handleResend}
              className="inline-flex items-center gap-2 px-4 h-[38px] rounded-full active:scale-95 transition-transform"
              style={{ background: "#F5F2E8" }}
            >
              <ArrowReloadHorizontalIcon size={13} className="text-spal-green" />
              <span className="text-[13px] text-spal-navy font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>
                Resend code
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-10" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))" }}>
        <button
          onClick={() => handleVerify()}
          disabled={!filled || loading}
          className="w-full h-[52px] rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: filled && !loading ? "#22C55E" : "#E4E4E7",
            color: filled && !loading ? "#fff" : "#A1A1AA",
          }}
        >
          {loading ? "Verifying…" : "Verify"}
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
