"use client";
// D04 Level-up celebration. Confirming here is what actually moves the user up; Spal never does it alone.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { SpalSymbol } from "@/components/brand/SpalSymbol";
import { useJourney } from "@/components/journey/useJourney";
import { ErrorBlock, FF, PendingBlock } from "@/components/journey/ui";
import { LEVELS } from "@/lib/engine/levels";
import { selectModules } from "@/lib/engine/modules";
import type { Level } from "@/lib/engine/placement";

export default function LevelUp() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { state, reload } = useJourney();
  const [confirmedLevel, setNewLevel] = useState<Level | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");


  async function confirm() {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch("/api/journey/level-up", { method: "POST" })).json();
      if (!j.success) throw new Error(j.error);
      setNewLevel(j.data.to as Level);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not level up. Please try again."); }
    setBusy(false);
  }

  // Reloaded after confirming? The new level has no progress yet, so show the celebration for it.
  const justArrived = state.status === "ready" && !state.data.levelUp && state.data.level > 0 && state.data.progress.done === 0;
  const newLevel: Level | null = confirmedLevel ?? (justArrived && state.status === "ready" ? state.data.level : null);

  const shell = "fixed inset-0 z-[60] flex flex-col px-6 pt-[calc(var(--sat)+24px)] pb-[calc(var(--sab)+24px)] text-white overflow-y-auto";
  const bg = { background: "radial-gradient(120% 80% at 50% 0%, #1E8F4E 0%, #0F172A 70%)" };

  if (state.status === "loading") return <div data-testid="screen-D04" className={shell} style={bg} role="status" aria-label="Loading" />;
  if (state.status === "error") return <div className="min-h-full bg-spal-bg pt-10"><ErrorBlock onRetry={reload} /></div>;
  if (state.status === "pending") return <div className="min-h-full bg-spal-bg pt-10 px-5"><PendingBlock /></div>;

  // Step 1: ready to move up, ask for confirmation
  if (newLevel === null) {
    const cur = state.data.level;
    if (!state.data.levelUp) {
      return <div className="min-h-full bg-spal-bg pt-10 px-5"><ErrorBlock message="Finish your gateway milestone to unlock the next level." /></div>;
    }
    const next = LEVELS[Math.min(5, cur + 1)];
    return (
      <div data-testid="screen-D04" className={shell} style={bg}>
        <div className="flex-1 flex flex-col justify-center text-center">
          <div className="flex justify-center"><SpalSymbol symbol="growth" color="#C5EA25" size={88} /></div>
          <p className="mt-6 text-[13px] uppercase tracking-[0.1em] text-white/70">You finished Level {cur}</p>
          <h1 style={{ fontFamily: FF }} className="mt-2 text-[36px] leading-[1.05] font-bold tracking-tight">Ready for Level {cur + 1}: {next.name}?</h1>
          <p className="mt-3 text-[16px] text-white/80 leading-snug">&ldquo;{next.quote}&rdquo;</p>
        </div>
        {err && <p role="alert" className="mb-3 text-center text-[14px] text-red-200">{err}</p>}
        <button type="button" onClick={confirm} disabled={busy} style={{ fontFamily: FF }} className="h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:opacity-60 active:scale-[0.98] transition-transform">{busy ? "One moment…" : "Yes, take me up"}</button>
        <button type="button" onClick={() => router.back()} className="h-12 mt-1 text-[15px] text-white/80 active:opacity-60">Not yet</button>
      </div>
    );
  }

  // Step 2: celebration
  const def = LEVELS[newLevel];
  const fresh = selectModules(newLevel, { onlyAvailable: true }).slice(0, 3);
  return (
    <div data-testid="screen-D04" className={shell} style={bg}>
      <div className="flex-1 flex flex-col justify-center text-center">
        <motion.div initial={{ opacity: 0, scale: reduce ? 1 : 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.34, 1.2, 0.64, 1] }} className="flex justify-center">
          <SpalSymbol symbol="profit" color="#C5EA25" size={120} spin={!reduce} />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 text-[13px] uppercase tracking-[0.1em] text-white/70">New level</motion.p>
        <motion.h1 initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ fontFamily: FF }} className="mt-1 text-[44px] leading-[1.02] font-bold tracking-tight">Level {newLevel}: {def.name}</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 text-[17px] text-white/85 leading-snug">Look how far you&apos;ve come. You didn&apos;t just start, you kept going.</motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-6 mx-auto max-w-xs rounded-2xl bg-white/10 px-4 py-3 text-left text-[14px] leading-snug">
          <p className="font-bold">What&apos;s new on your home</p>
          <p className="mt-1 text-white/80">{fresh.length ? fresh.map((m) => m.title).join(", ") : def.blurb}</p>
        </motion.div>
      </div>
      <button type="button" onClick={() => router.replace("/home")} style={{ fontFamily: FF }} className="h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] active:scale-[0.98] transition-transform">Go to my home</button>
    </div>
  );
}
