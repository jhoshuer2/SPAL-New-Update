"use client";
// Shared Journey UI: top bar, progress ring, milestone row, and the loading / empty / error states.
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, Tick01Icon, LockIcon } from "hugeicons-react";
import type { MilestoneState } from "@/lib/engine/milestones";

export const FF = "var(--font-satoshi)";

export function TopBar({ title, back = true, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <div className="px-4 pt-[calc(var(--sat)+12px)] h-[calc(var(--sat)+60px)] flex items-center gap-2">
      {back ? (
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:bg-white/70">
          <ArrowLeft01Icon size={22} color="#0F172A" />
        </button>
      ) : <span className="w-2" />}
      {title ? <h1 style={{ fontFamily: FF }} className="flex-1 text-[18px] font-bold text-spal-navy truncate">{title}</h1> : <span className="flex-1" />}
      {right}
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-7 px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontFamily: FF }} className="text-[17px] font-bold text-spal-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export const cardCls = "rounded-[20px] bg-white border border-neutral-200/70 shadow-[var(--shadow-card)]";

/** Progress ring. Text alternative included for screen readers. */
export function Ring({ pct, size = 64, label }: { pct: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${pct} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E4E7" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22C55E" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <span style={{ fontFamily: FF }} className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-spal-navy tabular-nums">{pct}%</span>
    </div>
  );
}

export function MilestoneRow({ m, href }: { m: MilestoneState; href?: string }) {
  const done = m.status === "done";
  const locked = m.status === "locked";
  const body = (
    <div className="flex items-center gap-3 min-h-[56px] py-2">
      <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${done ? "bg-[#22C55E]" : locked ? "bg-neutral-100" : "border-2 border-neutral-300 bg-white"}`}>
        {done ? <Tick01Icon size={14} color="#fff" /> : locked ? <LockIcon size={13} color="#A1A1AA" /> : null}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-[15px] leading-snug ${done ? "text-neutral-500 line-through decoration-neutral-300" : "text-spal-navy font-medium"}`}>{m.title}</span>
        {m.is_gateway && !done ? <span className="block text-[12px] text-spal-green-700 font-medium">Gateway to the next level</span> : null}
      </span>
      <ArrowRight01Icon size={18} color="#A1A1AA" />
    </div>
  );
  return <Link href={href ?? `/journey/milestone/${m.key}`} className="block active:opacity-70">{body}</Link>;
}

export function SkeletonBlock({ h = 96, className = "" }: { h?: number; className?: string }) {
  return <div aria-hidden className={`rounded-[20px] bg-white/70 animate-pulse ${className}`} style={{ height: h }} />;
}

export function ScreenSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="px-5 pt-4 space-y-4">
      <SkeletonBlock h={120} /><SkeletonBlock h={72} /><SkeletonBlock h={200} />
    </div>
  );
}

export function ErrorBlock({ message = "We couldn't load this. Check your connection and try again.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className={`${cardCls} mx-5 mt-6 p-6 text-center`}>
      <p className="text-[15px] text-spal-navy">{message}</p>
      {onRetry ? <button type="button" onClick={onRetry} className="mt-4 h-11 px-6 rounded-full bg-spal-navy text-white text-[14px] font-bold active:scale-95 transition-transform">Try again</button> : null}
    </div>
  );
}

export function EmptyBlock({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className={`${cardCls} p-6 text-center`}>
      <p style={{ fontFamily: FF }} className="text-[17px] font-bold text-spal-navy">{title}</p>
      <p className="mt-1 text-[14px] text-neutral-600 leading-snug">{body}</p>
      {href && cta ? <Link href={href} className="mt-4 inline-flex h-11 px-6 items-center rounded-full bg-[#22C55E] text-white text-[14px] font-bold">{cta}</Link> : null}
    </div>
  );
}

/** Shown when migration 026 has not run yet. Legacy features keep working. */
export function PendingBlock() {
  return <EmptyBlock title="Your journey is being set up" body="This part of Spal is arriving shortly. Everything else works as usual." href="/home" cta="Back to Home" />;
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
