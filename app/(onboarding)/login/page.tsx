"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useSPALStore } from "@/store";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useSPALStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 6;

  async function handleLogin() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Incorrect email or password. Please try again.");
        return;
      }

      setUser(data.data.user);
      // Hard navigation so the proxy middleware re-reads the new session cookies
      window.location.href = "/home";
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* SPAL wordmark */}
        <div className="mb-8">
          <Image src="/spal-wordmark.webp" alt="SPAL" width={140} height={48} className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Welcome back
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">Sign in with your email and password</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-8 flex flex-col gap-4"
      >
        {/* Email */}
        <div>
          <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
            Email address
          </label>
          <input
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="spal-input spal-input-email"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)] block mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="spal-input"
          />
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 font-medium -mt-1">
            {error}
          </motion.p>
        )}

        {/* Forgot password */}
        <button
          onClick={() => router.push("/reset-password")}
          className="text-sm text-spal-blue font-semibold text-right -mt-1 font-[family-name:var(--font-satoshi)]"
        >
          Forgot password? →
        </button>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <Button fullWidth size="lg" loading={loading} disabled={!isValid} onClick={handleLogin}>
          Sign in
        </Button>
        <p className="text-center text-neutral-400 text-xs mt-4">
          New here?{" "}
          <button
            onClick={() => router.push("/welcome")}
            className="text-spal-blue font-semibold underline"
          >
            Create an account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
