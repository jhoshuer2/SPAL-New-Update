"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore } from "@/store";
import {
  ADVISORS, FREE_ADVISORS, PREMIUM_ADVISORS, type Advisor,
} from "@/lib/advisors/config";
import { formatTime } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/currency";
import { LockIcon, Mic01Icon, ChatIcon, Tick01Icon, Cancel01Icon, Delete01Icon, SparklesIcon } from "hugeicons-react";

interface Conversation {
  id: string;
  advisor_id: string;
  title: string | null;
  updated_at: string;
}

interface CoachSub {
  coach_id: string;
  active: boolean;
  renews_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription state — real-time from /api/payments/coach/list
// ─────────────────────────────────────────────────────────────────────────────

function isSubscribed(subs: CoachSub[], coachId: string): boolean {
  return subs.some(
    (s) => s.coach_id === coachId && s.active && (!s.renews_at || new Date(s.renews_at) > new Date()),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const router = useRouter();
  const _ = useSPALStore(); void _;

  const [conversations,   setConversations]   = useState<Conversation[]>([]);
  const [loadingConvs,    setLoadingConvs]    = useState(true);
  const [deleteTarget,    setDeleteTarget]    = useState<string | null>(null);
  const [subs,            setSubs]            = useState<CoachSub[]>([]);
  const [previewCoach,    setPreviewCoach]    = useState<Advisor | null>(null);
  const [subscribing,     setSubscribing]     = useState(false);
  const [subscribeError,  setSubscribeError]  = useState<string | null>(null);

  useEffect(() => {
    // Real subscriptions from the server
    fetch("/api/payments/coach/list")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const list = (d.data.subscriptions ?? []).map((s: { coach_id: string; status: string; current_period_end: string | null }) => ({
          coach_id:  s.coach_id,
          active:    s.status === "active" && (!s.current_period_end || new Date(s.current_period_end) > new Date()),
          renews_at: s.current_period_end,
        }));
        setSubs(list);
      })
      .catch(() => {});

    fetch("/api/advisors/conversations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setConversations(d.data); })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  function openCoach(coach: Advisor) {
    if (!coach.isFree && !isSubscribed(subs, coach.id)) {
      setPreviewCoach(coach);
      return;
    }
    router.push(`/learn/${coach.id}`);
  }

  async function handleSubscribe(coachId: string) {
    setSubscribing(true);
    setSubscribeError(null);
    try {
      const res = await fetch("/api/payments/coach/initialize", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ coach_id: coachId }),
      });
      const data = await res.json();
      if (!data.success || !data.data?.authorization_url) {
        setSubscribeError(data.error ?? "Couldn't start payment. Please try again.");
        setSubscribing(false);
        return;
      }
      // Hand off to Paystack — webhook activates the subscription server-side
      window.location.href = data.data.authorization_url;
    } catch {
      setSubscribeError("Network problem. Please try again.");
      setSubscribing(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteTarget(null);
    try {
      await fetch(`/api/advisors/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
  }

  const activeCount = subs.filter((s) => s.active).length;

  return (
    <div className="px-5 pt-6 pb-6 space-y-5" style={{ background: "#EEF3E9", minHeight: "100%" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
          Coach
        </h1>
        <p className="text-[13px] text-neutral-500 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
          Get expert advice, anytime — in plain English.
        </p>
      </motion.div>

      {/* Free coaches */}
      <Section title="Free coaches" subtitle="Text chat — unlimited">
        <div className="space-y-2.5">
          {FREE_ADVISORS.map((id, i) => (
            <CoachRow
              key={id}
              coach={ADVISORS[id]}
              status="free"
              delay={i * 0.04}
              onOpen={() => openCoach(ADVISORS[id])}
              onLearnMore={() => setPreviewCoach(ADVISORS[id])}
            />
          ))}
        </div>
      </Section>

      {/* Premium voice coaches */}
      <Section
        title="Voice masterclasses"
        subtitle={`Premium · per-coach subscription${activeCount ? ` · ${activeCount} active` : ""}`}
      >
        <div className="space-y-2.5">
          {PREMIUM_ADVISORS.map((id, i) => {
            const coach = ADVISORS[id];
            const sub   = subs.find((s) => s.coach_id === id);
            const active = !!sub?.active;
            return (
              <CoachRow
                key={id}
                coach={coach}
                status={active ? "active" : "locked"}
                renewsAt={active ? sub!.renews_at : undefined}
                delay={0.2 + i * 0.04}
                onOpen={() => openCoach(coach)}
                onLearnMore={() => setPreviewCoach(coach)}
              />
            );
          })}
        </div>
      </Section>

      {/* Recent conversations */}
      <Section title="Recent conversations">
        {loadingConvs ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-white rounded-2xl" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-6 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p className="text-[13px] text-neutral-400" style={{ fontFamily: "var(--font-satoshi)" }}>
              No conversations yet.
            </p>
            <p className="text-[11.5px] text-neutral-300 mt-1">Tap a coach above to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const coach = ADVISORS[conv.advisor_id];
              if (!coach) return null;
              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <button
                    onClick={() => router.push(`/learn/${conv.advisor_id}?convId=${conv.id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${coach.avatarColor} ${coach.avatarTextColor}`}>
                      {coach.avatarLetter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                        {conv.title ?? `Chat with ${coach.name}`}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {coach.name} · {formatTime(conv.updated_at)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(conv.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-neutral-300 active:text-red-400 transition-colors"
                    aria-label="Delete conversation"
                  >
                    <Delete01Icon size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <div className="h-2" />

      {/* ── Coach preview sheet ─────────────────────────────────────── */}
      <AnimatePresence>
        {previewCoach && (
          <CoachPreviewSheet
            coach={previewCoach}
            subscribed={isSubscribed(subs, previewCoach.id)}
            subscribing={subscribing}
            error={subscribeError}
            onClose={() => { setPreviewCoach(null); setSubscribeError(null); }}
            onStart={() => {
              setPreviewCoach(null);
              router.push(`/learn/${previewCoach.id}`);
            }}
            onSubscribe={() => handleSubscribe(previewCoach.id)}
          />
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ──────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center"
            onClick={() => setDeleteTarget(null)}
          >
            <div className="absolute inset-0 bg-spal-navy/40" />
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              className="relative z-10 bg-white rounded-t-3xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-7" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
                <h3 className="text-base font-bold text-spal-navy text-center mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Delete conversation?
                </h3>
                <p className="text-sm text-neutral-400 text-center mb-5">This cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 h-12 rounded-full bg-neutral-100 text-spal-navy text-sm font-semibold"
                    style={{ fontFamily: "var(--font-satoshi)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget)}
                    className="flex-1 h-12 rounded-full bg-red-500 text-white text-sm font-bold"
                    style={{ fontFamily: "var(--font-satoshi)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections & rows
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-2">
        <p className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>{title}</p>
        {subtitle && <p className="text-[11.5px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>{subtitle}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function CoachRow({
  coach, status, renewsAt, delay, onOpen, onLearnMore,
}: {
  coach: Advisor;
  status: "free" | "active" | "locked";
  renewsAt?: string | null;
  delay: number;
  onOpen: () => void;
  onLearnMore: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-4 flex items-center gap-3.5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Avatar */}
      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${coach.avatarColor} ${coach.avatarTextColor}`}>
        {coach.avatarLetter}
        {/* Mode pill */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
          {coach.mode === "voice"
            ? <Mic01Icon size={9} className="text-spal-navy" />
            : <ChatIcon size={9} className="text-spal-navy" />}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-bold text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
            {coach.name}
          </p>
          {status === "free" && <Tag label="Free" color="#16A34A" bg="#F0FDF4" />}
          {status === "active" && <Tag label="Active" color="#16A34A" bg="#F0FDF4" />}
          {status === "locked" && <Tag label={`₦${coach.priceMonthly?.toLocaleString()}/mo`} color="#8B5CF6" bg="#F5F3FF" />}
        </div>
        <p className="text-[11.5px] text-neutral-500 truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
          {coach.title}
        </p>
        {status === "active" && renewsAt && (
          <p className="text-[10.5px] text-spal-green mt-0.5 font-semibold" style={{ fontFamily: "var(--font-satoshi)" }}>
            Renews {new Date(renewsAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>

      {/* Right CTA */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <button
          onClick={onOpen}
          className="px-3.5 h-9 rounded-full text-[12px] font-bold text-white"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: status === "locked" ? "#0F172A" : "#22C55E",
          }}
        >
          {status === "locked" ? (
            <span className="inline-flex items-center gap-1"><LockIcon size={11} /> Unlock</span>
          ) : "Chat"}
        </button>
        <button
          onClick={onLearnMore}
          className="text-[10.5px] text-neutral-400 font-medium"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Profile
        </button>
      </div>
    </motion.div>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{ color, background: bg, fontFamily: "var(--font-satoshi)" }}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Coach Preview Sheet
// ─────────────────────────────────────────────────────────────────────────────

function CoachPreviewSheet({
  coach, subscribed, subscribing, error, onClose, onStart, onSubscribe,
}: {
  coach: Advisor;
  subscribed: boolean;
  subscribing: boolean;
  error: string | null;
  onClose: () => void;
  onStart: () => void;
  onSubscribe: () => void;
}) {
  const canChat = coach.isFree || subscribed;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-spal-navy/40 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-neutral-200 rounded-full" />
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-3"
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
          }}
        >
          {/* Top: avatar + close */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${coach.avatarColor} ${coach.avatarTextColor}`}>
                {coach.avatarLetter}
              </div>
              <div>
                <p className="text-[18px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {coach.name}
                </p>
                <p className="text-[12.5px] text-neutral-500" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {coach.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {coach.mode === "voice"
                    ? <Mic01Icon size={11} className="text-spal-navy" />
                    : <ChatIcon size={11} className="text-spal-navy" />}
                  <span className="text-[11px] font-semibold text-neutral-500" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {coach.mode === "voice" ? "Voice masterclass" : "Text chat"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100" aria-label="Close">
              <Cancel01Icon size={15} className="text-neutral-500" />
            </button>
          </div>

          {/* Tagline */}
          <p className="text-[14px] text-spal-navy font-medium leading-snug mb-4" style={{ fontFamily: "var(--font-satoshi)" }}>
            &ldquo;{coach.tagline}&rdquo;
          </p>

          {/* Bio */}
          <div className="bg-neutral-50 rounded-2xl p-4 mb-4">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-neutral-500 mb-1.5" style={{ fontFamily: "var(--font-satoshi)" }}>
              About {coach.name}
            </p>
            <p className="text-[13.5px] text-spal-navy leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
              {coach.briefBio}
            </p>
          </div>

          {/* What you'll get */}
          <div className="space-y-2 mb-5">
            <BioRow icon={<SparklesIcon size={14} className="text-spal-green" />} text={`Expertise: ${coach.expertise}`} />
            {coach.mode === "voice"
              ? <BioRow icon={<Mic01Icon size={14} className="text-spal-blue" />} text="Real-time voice conversations" />
              : <BioRow icon={<ChatIcon size={14} className="text-spal-blue" />} text="Unlimited text chat" />}
            <BioRow icon={<Tick01Icon size={14} className="text-spal-green" />} text="Speaks plain English — no jargon" />
          </div>

          {/* CTA */}
          {canChat ? (
            <button
              onClick={onStart}
              className="w-full h-14 rounded-full bg-spal-green text-white font-bold text-[15px]"
              style={{ fontFamily: "var(--font-satoshi)" }}
            >
              {coach.mode === "voice" ? "Start voice session" : `Chat with ${coach.name}`}
            </button>
          ) : (
            <>
              <div className="rounded-2xl p-4 mb-3" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                <p className="text-[11.5px] font-bold uppercase tracking-wide text-spal-purple mb-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Premium voice coach
                </p>
                <p className="text-[20px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)", letterSpacing: "-0.01em" }}>
                  {formatCurrency(coach.priceMonthly ?? 0)} <span className="text-[12px] font-medium text-neutral-500">/ month</span>
                </p>
                <p className="text-[12px] text-neutral-500 mt-1" style={{ fontFamily: "var(--font-satoshi)" }}>
                  Cancel anytime. You stay subscribed only to the coach(es) you choose.
                </p>
              </div>
              {error && (
                <p className="text-[12px] text-red-500 mb-2 text-center" style={{ fontFamily: "var(--font-satoshi)" }}>
                  {error}
                </p>
              )}
              <button
                onClick={onSubscribe}
                disabled={subscribing}
                className="w-full h-14 rounded-full bg-spal-navy text-white font-bold text-[15px] disabled:opacity-60"
                style={{ fontFamily: "var(--font-satoshi)" }}
              >
                {subscribing ? "Opening Paystack…" : `Subscribe to ${coach.name}`}
              </button>
              <p className="text-[11px] text-neutral-400 text-center mt-2" style={{ fontFamily: "var(--font-satoshi)" }}>
                Secure payment via Paystack
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BioRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-[13px] text-spal-navy leading-snug" style={{ fontFamily: "var(--font-satoshi)" }}>{text}</p>
    </div>
  );
}
