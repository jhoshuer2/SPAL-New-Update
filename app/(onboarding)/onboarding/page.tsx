"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Clock01Icon, ViewIcon, ViewOffIcon } from "hugeicons-react";
import { useSPALStore, type BusinessType } from "@/store";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OptionCard } from "@/components/onboarding/OptionCard";

const FF = "var(--font-satoshi)";
const BG = "#EEF3E9";
const TOTAL = 5;

interface BizOption { value: BusinessType; label: string; sub: string; icon: string; noun: string; }
const BUSINESS: BizOption[] = [
  { value: "food_seller",    label: "Restaurant",         sub: "Shop, Street Bukka, Food Stall, etc", icon: "/onboard-icon-restaurant.webp", noun: "restaurant" },
  { value: "bar_owner",      label: "Bar/Drinks",         sub: "Bar, Beer Parlour, Cold Store",       icon: "/onboard-icon-bar.webp",        noun: "bar" },
  { value: "fashion_vendor", label: "Fashion & Clothing", sub: "Boutique, Tailoring, Shoes",          icon: "/onboard-icon-fashion.webp",    noun: "store" },
  { value: "salon",          label: "Salon and Barbing",  sub: "Hair Salon, Barbing and Beauty",      icon: "/onboard-icon-salon.webp",      noun: "salon" },
  { value: "kiosk",          label: "Kiosk / Shop",       sub: "General Store, Provision, Pharmacy",   icon: "/onboard-icon-kiosk.webp",      noun: "shop" },
  { value: "market_trader",  label: "Market Trader",      sub: "Open Market, Stall, Agro",            icon: "/onboard-icon-market.webp",     noun: "business" },
  { value: "other",          label: "Something Else",     sub: "Any other type of business",          icon: "/onboard-icon-other.webp",      noun: "business" },
];

interface SizeOption { value: string; title: string; sub: string; img: string; }
const SIZES: SizeOption[] = [
  { value: "solo",   title: "Only Me",        sub: "I don't pay Staffs", img: "/onboard-size-1.webp" },
  { value: "micro",  title: "1 - 9 Staffs",   sub: "Micro Scale",        img: "/onboard-size-2.webp" },
  { value: "small",  title: "10 - 49 Staffs", sub: "Small Scale",        img: "/onboard-size-3.webp" },
  { value: "medium", title: "50 - 249 Staffs",sub: "Medium Scale",       img: "/onboard-size-4.webp" },
  { value: "large",  title: "Over 250 Staffs",sub: "Large Scale",        img: "/onboard-size-5.webp" },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function OnboardingWizard() {
  const router = useRouter();
  const { setOnboardingData, setUser, user } = useSPALStore();

  const [step, setStep]             = useState(1);
  const [businessType, setBizType]  = useState<BusinessType | null>(null);
  const [size, setSize]             = useState<string | null>(null);
  const [name, setName]             = useState("");
  const [locations, setLocations]   = useState("1");
  const [email, setEmail]           = useState("");
  const [otpSent, setOtpSent]       = useState(false);
  const [otp, setOtp]               = useState("");
  const [resend, setResend]         = useState(0);
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const biz  = BUSINESS.find((b) => b.value === businessType);
  const noun = biz?.noun ?? "business";

  // Resend countdown
  useEffect(() => {
    if (resend <= 0) return;
    const t = setInterval(() => setResend((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resend]);

  function back() {
    setError(null);
    if (step === 4 && otpSent) { setOtpSent(false); setOtp(""); return; }
    if (step > 1) setStep(step - 1);
    else window.location.href = "/welcome";
  }

  const canContinue = (() => {
    switch (step) {
      case 1: return !!businessType;
      case 2: return !!size;
      case 3: return name.trim().length > 0;
      case 4: return otpSent ? otp.length === 6 : emailValid(email);
      case 5: return password.length >= 8;
      default: return false;
    }
  })();

  async function sendOtp() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Could not send the code.");
      setOtpSent(true); setResend(30);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the code."); }
    finally { setBusy(false); }
  }

  async function verifyOtp() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: otp,
          mode: "signup",
          onboardingData: { businessType, goals: [] },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "That code didn't work. Try again.");
      if (data.data?.user) setUser(data.data.user);
      setStep(5);
    } catch (e) { setError(e instanceof Error ? e.message : "That code didn't work."); }
    finally { setBusy(false); }
  }

  async function complete() {
    setBusy(true); setError(null);
    try {
      const pw = await fetch("/api/auth/set-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const pwData = await pw.json();
      if (!pwData.success) throw new Error(pwData.error ?? "Could not set your password.");

      // Save the business name (session is active after OTP verify)
      await fetch("/api/auth/update-profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: name.trim(), business_type: businessType, onboarding_completed: true }),
      });
      if (user) setUser({ ...user, business_name: name.trim(), business_type: businessType ?? undefined, onboarding_completed: true });
      window.location.href = "/home";
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); setBusy(false); }
  }

  function onContinue() {
    setError(null);
    if (step === 1) { setStep(2); return; }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      setOnboardingData({ businessType: businessType ?? undefined, businessName: name.trim(), businessSize: size ?? undefined, locations: Number(locations) || 1 });
      setStep(4); return;
    }
    if (step === 4) { if (!otpSent) sendOtp(); else verifyOtp(); return; }
    if (step === 5) complete();
  }

  const titles: Record<number, string> = {
    1: "What kind of business do you run?",
    2: `What is the size of your ${noun}?`,
    3: `What is the name of your ${noun}?`,
    4: "Add your Email Address",
    5: "Create your Password",
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: BG }}>
      <OnboardingProgress step={step} total={TOTAL} onBack={back} />

      <div className="px-5 pt-4">
        <p className="text-[14px] text-neutral-500" style={{ fontFamily: FF }}>Step {step} of {TOTAL}</p>
        <h1 className="text-spal-navy font-black leading-[1.12] mt-1" style={{ fontFamily: FF, fontSize: "clamp(26px, 7.5vw, 32px)", letterSpacing: "-0.02em" }}>
          {titles[step]}
        </h1>
      </div>

      <div className="flex-1 px-5 pt-5 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 1 && (
              <div className="space-y-3">
                {BUSINESS.map((b) => (
                  <OptionCard
                    key={b.value}
                    selected={businessType === b.value}
                    onSelect={() => setBizType(b.value)}
                    title={b.label}
                    subtitle={b.sub}
                    leading={
                      <span className="w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center bg-white">
                        <Image src={b.icon} alt="" width={52} height={52} className="w-full h-full object-contain" />
                      </span>
                    }
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {SIZES.map((s) => (
                  <OptionCard
                    key={s.value}
                    selected={size === s.value}
                    onSelect={() => setSize(s.value)}
                    title={s.title}
                    subtitle={s.sub}
                    flushLeading
                    leading={
                      <span className="w-[92px] h-[64px] flex items-center justify-center overflow-hidden">
                        <Image src={s.img} alt="" width={168} height={122} className="h-full w-auto object-contain" />
                      </span>
                    }
                  />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <Field label={`${cap(noun)} Name`}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Business Name"
                    autoFocus
                    className="w-full h-full bg-transparent outline-none text-[15px] text-spal-navy"
                    style={{ fontFamily: FF }}
                  />
                </Field>
                <AnimatePresence>
                  {name.trim().length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Field label="How many locations do you operate in?">
                        <input
                          type="number" min="1"
                          value={locations}
                          onChange={(e) => setLocations(e.target.value)}
                          placeholder="1"
                          className="w-full h-full bg-transparent outline-none text-[15px] text-spal-navy"
                          style={{ fontFamily: FF }}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Field label="Email Address" active={otpSent || emailValid(email)}>
                  <input
                    type="email" inputMode="email" autoCapitalize="none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    disabled={otpSent}
                    autoFocus
                    className="w-full h-full bg-transparent outline-none text-[15px] text-spal-navy disabled:opacity-100"
                    style={{ fontFamily: FF }}
                  />
                </Field>

                <AnimatePresence>
                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-white rounded-2xl px-5 py-5"
                      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
                    >
                      <p className="text-[19px] font-black text-spal-navy" style={{ fontFamily: FF }}>We sent you an Email</p>
                      <p className="text-[13.5px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Can&apos;t find the email, check your spam</p>
                      <p className="text-[14px] font-bold text-spal-navy mt-4 mb-2.5" style={{ fontFamily: FF }}>One Time Password</p>
                      <OtpInput value={otp} onChange={setOtp} />
                      <div className="flex justify-center mt-4">
                        <button
                          disabled={resend > 0 || busy}
                          onClick={sendOtp}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold"
                          style={{ fontFamily: FF, background: "#EAF3E4", color: resend > 0 ? "#6B8A5A" : "#16A34A" }}
                        >
                          <Clock01Icon size={13} />
                          {resend > 0 ? `Resend code in 00:${String(resend).padStart(2, "0")} sec` : "Resend code"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === 5 && (
              <Field label="New Password" active={password.length >= 8}
                trailing={
                  <button onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="flex-shrink-0 text-neutral-400">
                    {showPw ? <ViewIcon size={20} /> : <ViewOffIcon size={20} />}
                  </button>
                }
              >
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus
                  className="w-full h-full bg-transparent outline-none text-[15px] text-spal-navy"
                  style={{ fontFamily: FF }}
                />
              </Field>
            )}

            {error && (
              <p className="text-[13px] text-red-600 font-medium mt-4" style={{ fontFamily: FF }}>{error}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 z-20"
        style={{ bottom: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", background: "linear-gradient(to top, #EEF3E9 68%, transparent)" }}
      >
        <Button variant="primary" size="lg" fullWidth disabled={!canContinue || busy} loading={busy} onClick={onContinue}>
          {step === 5 ? "Complete Onboarding" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

// ── Field: labelled white input shell (green border when filled/active) ─────────
function Field({ label, children, active, trailing }: { label: string; children: React.ReactNode; active?: boolean; trailing?: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[14px] font-bold text-spal-navy mb-2" style={{ fontFamily: FF }}>{label}</label>
      <div
        className="w-full h-[58px] rounded-2xl bg-white/85 flex items-center gap-2 px-4 transition-colors"
        style={{ border: active ? "1.5px solid #22C55E" : "1.5px solid transparent", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        {children}
        {trailing}
      </div>
    </div>
  );
}

// ── 6-box OTP input ─────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setAt = useCallback((i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, 6));
  }, [digits, onChange]);

  return (
    <div className="flex items-center justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className="flex-1 min-w-0 aspect-square rounded-xl text-center text-[18px] font-bold text-spal-navy outline-none transition-colors"
          style={{
            fontFamily: FF,
            background: "#EFF4EA",
            border: d ? "1.5px solid #22C55E" : "1.5px solid transparent",
            maxWidth: 56,
          }}
        />
      ))}
    </div>
  );
}
