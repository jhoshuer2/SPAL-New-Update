"use client";
// B01–B10 Meet Spal: conversational onboarding, placement, level reveal and "where to begin".
// One route, one card per question. Screen IDs live in each step's testID (screen-B0x).
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, Tick01Icon } from "hugeicons-react";
import { SpalSymbol } from "@/components/brand/SpalSymbol";
import { Chip, Choice, Field, FF, GhostButton, PrimaryButton, Rise, Title } from "@/components/onboarding/meet/ui";
import {
  BUSINESS_TYPES, CHALLENGES, REVENUE_BANDS, needsConflictFollowUp, placeFromAnswers, suggestGoals,
  templateReflection, type OnboardingAnswers,
} from "@/lib/engine/onboarding";
import { LEVELS, levelDef } from "@/lib/engine/levels";
import type { Level } from "@/lib/engine/placement";

type StepId =
  | "B01" | "B02" | "B03" | "B04-sold" | "B04-conflict" | "B04-registered" | "B04-staff" | "B04-channels"
  | "B04-managers" | "B04-company" | "B04-months" | "B04-revenue" | "B05" | "B06" | "B07" | "B08" | "B09" | "B10";

const EMPTY: OnboardingAnswers = { name: "", state: "", city: "", language: "en", challenges: [], goals: [] };

/** The ordered steps for the answers given so far. Conditional steps appear only when they matter. */
function flow(a: OnboardingAnswers): StepId[] {
  const s: StepId[] = ["B01", "B02", "B03", "B04-sold"];
  if (needsConflictFollowUp(a)) s.push("B04-conflict");
  if (a.hasSold) s.push("B04-registered");
  if (a.hasSold && a.isRegistered) s.push("B04-staff");
  if (a.hasSold && a.isRegistered && (a.paidStaffCount ?? 0) > 0) s.push("B04-channels");
  if ((a.locationsOrChannels ?? 1) > 1) s.push("B04-managers");
  if (a.hasManagers) s.push("B04-company");
  if (a.hasSold) s.push("B04-months");
  s.push("B04-revenue", "B05", "B06", "B07", "B08", "B09", "B10");
  return s;
}

export default function MeetSpal() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [a, setA] = useState<OnboardingAnswers>(EMPTY);
  const [step, setStep] = useState<StepId>("B01");
  const [trail, setTrail] = useState<StepId[]>([]);
  const [chosen, setChosen] = useState<Level | null>(null);
  const [reflection, setReflection] = useState<{ sentences: string[]; levelNote: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const placement = useMemo(() => placeFromAnswers(a), [a]);
  const level = chosen ?? placement.level;
  const def = levelDef(level);

  // B09 (adjust) is only reached from B08 "Not quite", so it is not part of the linear flow.
  const visible = flow(a);
  const progress = Math.min(1, visible.indexOf(step === "B09" ? "B08" : step) / (visible.length - 1));

  function go(next: StepId) { setTrail((t) => [...t, step]); setStep(next); }
  function advance(updated: OnboardingAnswers = a) {
    const f = flow(updated);
    const i = f.indexOf(step);
    go(f[Math.min(i + 1, f.length - 1)]);
  }
  function set(patch: Partial<OnboardingAnswers>, auto = true) {
    const updated = { ...a, ...patch };
    setA(updated);
    if (auto) setTimeout(() => advance(updated), 180);
  }
  function back() {
    setTrail((t) => { const p = t[t.length - 1]; if (p) setStep(p); return t.slice(0, -1); });
  }

  // B07: fetch Spal's reflection (falls back locally if the call fails or is slow)
  const asked = useRef(false);
  useEffect(() => {
    if (step !== "B07" || asked.current) return;
    asked.current = true;
    const fallback = { sentences: templateReflection(a), levelNote: levelDef(placement.level).blurb };
    const started = Date.now();
    const done = (r: typeof fallback) => {
      // Never flash: hold the "thinking" moment for at least 2.2s so it feels considered.
      setTimeout(() => { setReflection(r); }, Math.max(0, 2200 - (Date.now() - started)));
    };
    fetch("/api/onboarding/reflect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) })
      .then((r) => r.json()).then((j) => done(j.success ? j.data : fallback)).catch(() => done(fallback));
  }, [step, a, placement.level]);

  async function finish(beginChoice: string) {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: a, chosenLevel: level, beginChoice }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      router.replace("/home");
    } catch {
      setError("We couldn't save that. Check your connection and try again.");
      setSaving(false);
    }
  }

  const canBack = trail.length > 0 && step !== "B07";

  return (
    <div className="flex-1 flex flex-col px-5 pt-[calc(var(--sat)+16px)] pb-[calc(var(--sab)+20px)] max-w-[480px] w-full mx-auto">
      {/* Progress + back */}
      <div className="h-10 flex items-center gap-3">
        {canBack ? (
          <button type="button" aria-label="Go back" onClick={back} className="w-11 h-11 -ml-3 flex items-center justify-center active:opacity-60">
            <ArrowLeft01Icon size={22} color="#0F172A" />
          </button>
        ) : <div className="w-8" />}
        <div className="flex-1 h-1 rounded-full bg-neutral-200/80 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full bg-spal-navy rounded-full" animate={{ width: `${Math.max(4, progress * 100)}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          data-testid={`screen-${step}`}
          className="flex-1 flex flex-col pt-6"
          initial={{ opacity: 0, y: reduce ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          {step === "B01" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="pt-10">
                <Rise><SpalSymbol symbol="profit" size={84} spin /></Rise>
                <Rise delay={0.08}>
                  <h1 style={{ fontFamily: FF }} className="mt-8 text-[36px] leading-[1.05] font-bold text-spal-navy tracking-tight">Hi, I&apos;m Spal.</h1>
                </Rise>
                <Rise delay={0.16}>
                  <p className="mt-3 text-[17px] text-neutral-600 leading-snug">A few quick questions so I can understand your business and meet you where you are. About 2 minutes.</p>
                </Rise>
              </div>
              <div className="space-y-1">
                <PrimaryButton onClick={() => advance()}>Let&apos;s start</PrimaryButton>
                <GhostButton onClick={() => finishSkip()}>Skip for now</GhostButton>
              </div>
            </div>
          )}

          {step === "B02" && (
            <>
              <Title sub="Just the basics. You can change these later.">What should I call you?</Title>
              <div className="space-y-4">
                <Field label="Your name" value={a.name} onChange={(v) => setA({ ...a, name: v })} placeholder="e.g. Ada" autoComplete="given-name" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="State" value={a.state} onChange={(v) => setA({ ...a, state: v })} placeholder="Lagos" autoComplete="address-level1" />
                  <Field label="City" value={a.city} onChange={(v) => setA({ ...a, city: v })} placeholder="Ikeja" autoComplete="address-level2" />
                </div>
                <div>
                  <span className="block mb-2 text-[13px] font-medium text-neutral-600">Language</span>
                  <div className="flex gap-2">
                    <Chip label="English" selected={a.language === "en"} onClick={() => setA({ ...a, language: "en" })} />
                    <Chip label="Pidgin" selected={a.language === "pcm"} onClick={() => setA({ ...a, language: "pcm" })} />
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-8"><PrimaryButton disabled={!a.name.trim()} onClick={() => advance()}>Continue</PrimaryButton></div>
            </>
          )}

          {step === "B03" && (
            <>
              <Title sub="Pick the one closest to you.">What kind of business is it?</Title>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((t) => <Chip key={t.value} label={t.label} selected={a.businessType === t.value} onClick={() => setA({ ...a, businessType: t.value, noBusinessYet: false })} />)}
              </div>
              <div className="mt-6 space-y-5">
                <div>
                  <span className="block mb-2 text-[13px] font-medium text-neutral-600">How do you work?</span>
                  <div className="flex flex-wrap gap-2">
                    {([["solo", "On my own"], ["partner", "With a partner"], ["team", "With a team"]] as const).map(([v, l]) => <Chip key={v} label={l} selected={a.workMode === v} onClick={() => setA({ ...a, workMode: v })} />)}
                  </div>
                </div>
                <div>
                  <span className="block mb-2 text-[13px] font-medium text-neutral-600">Where do you sell?</span>
                  <div className="flex flex-wrap gap-2">
                    {([["online", "Online"], ["physical", "In person"], ["both", "Both"]] as const).map(([v, l]) => <Chip key={v} label={l} selected={a.sellChannel === v} onClick={() => setA({ ...a, sellChannel: v })} />)}
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-8 space-y-1">
                <PrimaryButton disabled={!a.businessType || !a.workMode || !a.sellChannel} onClick={() => advance()}>Continue</PrimaryButton>
                <GhostButton onClick={() => { const u = { ...a, noBusinessYet: true, businessType: a.businessType ?? ("other" as const), workMode: a.workMode ?? ("solo" as const), sellChannel: a.sellChannel ?? ("both" as const), hasSold: false }; setA(u); advance(u); }}>
                  I don&apos;t have a business yet
                </GhostButton>
              </div>
            </>
          )}

          {step === "B04-sold" && (
            <><Title>Have you sold anything yet?</Title>
              <div className="space-y-3">
                <Choice label="Yes, I've made sales" selected={a.hasSold === true} onClick={() => set({ hasSold: true })} />
                <Choice label="Not yet" selected={a.hasSold === false} onClick={() => set({ hasSold: false, isRegistered: false, paidStaffCount: 0 })} />
              </div></>
          )}

          {step === "B04-conflict" && (
            <><Title sub="You said nothing sold yet, but also that money comes in each month. Which is closer?">Quick check</Title>
              <div className="space-y-3">
                <Choice label="I've made sales" onClick={() => advanceWith({ hasSold: true })} />
                <Choice label="Nothing sold yet" onClick={() => advanceWith({ hasSold: false, revenueBand: 0 })} />
              </div></>
          )}

          {step === "B04-registered" && (
            <><Title sub="With the Corporate Affairs Commission.">Is your business registered with CAC?</Title>
              <div className="space-y-3">
                <Choice label="Yes, it's registered" selected={a.isRegistered === true} onClick={() => set({ isRegistered: true })} />
                <Choice label="Not yet" selected={a.isRegistered === false} onClick={() => set({ isRegistered: false, paidStaffCount: 0 })} />
              </div></>
          )}

          {step === "B04-staff" && (
            <><Title>Do you pay anyone to work with you?</Title>
              <div className="space-y-3">
                {([[0, "No, it's just me"], [1, "1 person"], [2, "2 people"], [4, "3 to 5 people"], [8, "More than 5"]] as const).map(([n, l]) => (
                  <Choice key={n} label={l} selected={a.paidStaffCount === n} onClick={() => set({ paidStaffCount: n })} />
                ))}
              </div></>
          )}

          {step === "B04-channels" && (
            <><Title sub="Shops, branches, or ways of selling like online and walk-in.">How many locations or sales channels do you have?</Title>
              <div className="space-y-3">
                {([[1, "Just one"], [2, "Two"], [3, "Three or more"]] as const).map(([n, l]) => (
                  <Choice key={n} label={l} selected={a.locationsOrChannels === n} onClick={() => set({ locationsOrChannels: n, hasManagers: n > 1 ? a.hasManagers : false })} />
                ))}
              </div></>
          )}

          {step === "B04-managers" && (
            <><Title>Do managers run parts of the business?</Title>
              <div className="space-y-3">
                <Choice label="Yes" selected={a.hasManagers === true} onClick={() => set({ hasManagers: true })} />
                <Choice label="No, I still run it" selected={a.hasManagers === false} onClick={() => set({ hasManagers: false, isIncorporatedWithMgmt: false })} />
              </div></>
          )}

          {step === "B04-company" && (
            <><Title sub="A registered company with a management team, or more than one business.">Does that describe you?</Title>
              <div className="space-y-3">
                <Choice label="Yes" selected={a.isIncorporatedWithMgmt === true} onClick={() => set({ isIncorporatedWithMgmt: true })} />
                <Choice label="Not quite" selected={a.isIncorporatedWithMgmt === false} onClick={() => set({ isIncorporatedWithMgmt: false })} />
              </div></>
          )}

          {step === "B04-months" && (
            <><Title>How long have you been running?</Title>
              <div className="space-y-3">
                {([[1, "Less than 3 months"], [6, "3 to 12 months"], [24, "1 to 3 years"], [48, "More than 3 years"]] as const).map(([n, l]) => (
                  <Choice key={n} label={l} selected={a.monthsRunning === n} onClick={() => set({ monthsRunning: n })} />
                ))}
              </div></>
          )}

          {step === "B04-revenue" && (
            <><Title sub="Optional, and private. It only helps me understand you better.">Roughly how much comes in each month?</Title>
              <div className="space-y-3">
                {REVENUE_BANDS.map((l, i) => <Choice key={l} label={l} selected={a.revenueBand === i} onClick={() => set({ revenueBand: i })} />)}
              </div>
              <div className="mt-auto pt-6"><GhostButton onClick={() => advance()}>Skip this</GhostButton></div></>
          )}

          {step === "B05" && (
            <><Title sub="Pick as many as you like.">What&apos;s on your mind right now?</Title>
              <div className="flex flex-wrap gap-2">
                {CHALLENGES.map((c) => (
                  <Chip key={c} label={c} selected={a.challenges.includes(c)}
                    onClick={() => setA({ ...a, challenges: a.challenges.includes(c) ? a.challenges.filter((x) => x !== c) : [...a.challenges, c] })} />
                ))}
              </div>
              <textarea
                value={a.challengeNote ?? ""} onChange={(e) => setA({ ...a, challengeNote: e.target.value })} rows={3} placeholder="Anything else?"
                className="mt-5 w-full rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy"
              />
              <div className="mt-auto pt-6"><PrimaryButton onClick={() => advance()}>Continue</PrimaryButton></div></>
          )}

          {step === "B06" && (
            <><Title sub="Choose what fits, or write your own.">What does success look like in the next 12 months?</Title>
              <div className="space-y-3">
                {suggestGoals(placement.level).map((g) => (
                  <Choice key={g} label={g} selected={a.goals.includes(g)} onClick={() => setA({ ...a, goals: a.goals.includes(g) ? a.goals.filter((x) => x !== g) : [...a.goals, g] })} />
                ))}
              </div>
              <div className="mt-4"><Field label="Something else" value={a.goals.find((g) => !suggestGoals(placement.level).includes(g)) ?? ""} placeholder="My own goal"
                onChange={(v) => setA({ ...a, goals: [...a.goals.filter((g) => suggestGoals(placement.level).includes(g)), ...(v ? [v] : [])] })} /></div>
              <div className="mt-auto pt-6"><PrimaryButton onClick={() => advance()}>Continue</PrimaryButton></div></>
          )}

          {step === "B07" && (
            <div className="flex-1 flex flex-col justify-center">
              {!reflection ? (
                <div role="status" aria-live="polite" className="text-center">
                  <div className="flex justify-center"><SpalSymbol symbol="focus" size={72} spin /></div>
                  <p style={{ fontFamily: FF }} className="mt-6 text-[20px] font-bold text-spal-navy">Spal is getting to know you…</p>
                </div>
              ) : (
                <>
                  <Title>Here&apos;s what I heard, {a.name.split(" ")[0]}.</Title>
                  <div className="space-y-3">
                    {reflection.sentences.map((s, i) => (
                      <Rise key={i} delay={i * 0.4}>
                        <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-[var(--shadow-card)] px-4 py-3.5 text-[16px] leading-snug text-spal-navy">{s}</div>
                      </Rise>
                    ))}
                  </div>
                  <div className="mt-auto pt-8"><PrimaryButton onClick={() => go("B08")}>That&apos;s right</PrimaryButton></div>
                </>
              )}
            </div>
          )}

          {step === "B08" && <Reveal level={level} signals={placement.signals} note={reflection?.levelNote} onYes={() => go("B10")} onNo={() => go("B09")} />}

          {step === "B09" && (
            <><Title sub="You know your business best. Pick the level that fits.">Adjust my level</Title>
              <div className="space-y-3">
                {LEVELS.map((l) => <Choice key={l.level} label={`Level ${l.level} · ${l.name}`} hint={l.quote} selected={level === l.level}
                  onClick={() => { setChosen(l.level); setTimeout(() => go("B10"), 180); }} />)}
              </div></>
          )}

          {step === "B10" && (
            <><Title sub={`Level ${level} · ${def.name}. You can always change this later.`}>Where would you like to begin?</Title>
              <div className="space-y-3">
                {def.begin.map((o) => <Choice key={o.key} label={o.title} hint={o.outcome} onClick={() => finish(o.key)} />)}
              </div>
              {saving && <p role="status" className="mt-4 text-center text-[14px] text-neutral-500">Setting up your space…</p>}
              {error && <p role="alert" className="mt-4 text-center text-[14px] text-red-600">{error}</p>}</>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  function advanceWith(patch: Partial<OnboardingAnswers>) {
    const u = { ...a, ...patch };
    setA(u);
    setTimeout(() => advance(u), 120);
  }

  async function finishSkip() {
    // Skip: start at Level 0 with a prompt to finish later (spec B01).
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: { ...EMPTY, name: a.name, hasSold: false }, chosenLevel: 0 }) });
    } finally { router.replace("/home"); }
  }
}

function Reveal({ level, signals, note, onYes, onNo }: { level: Level; signals: string[]; note?: string; onYes: () => void; onNo: () => void }) {
  const def = levelDef(level);
  return (
    <div className="flex-1 flex flex-col">
      <Rise>
        <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-[0.08em]">Your level</p>
        <h1 style={{ fontFamily: FF }} className="mt-1 text-[40px] leading-[1.02] font-bold text-spal-navy tracking-tight">Level {level}: {def.name}</h1>
        <p className="mt-2 text-[17px] text-neutral-600 leading-snug">&ldquo;{def.quote}&rdquo;</p>
      </Rise>

      {/* The ladder, with you marked */}
      <Rise delay={0.15}>
        <div className="mt-6 flex items-end gap-1.5" aria-label={`You are at level ${level} of 5`}>
          {LEVELS.map((l) => (
            <div key={l.level} className="flex-1">
              <motion.div
                initial={{ scaleY: 0.3 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: 0.2 + l.level * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: 20 + l.level * 12, transformOrigin: "bottom" }}
                className={`rounded-lg ${l.level === level ? "bg-[#22C55E]" : l.level < level ? "bg-spal-navy/70" : "bg-neutral-200"}`}
              />
              <p className={`mt-1.5 text-center text-[11px] ${l.level === level ? "font-bold text-spal-navy" : "text-neutral-500"}`}>{l.name}</p>
            </div>
          ))}
        </div>
      </Rise>

      <Rise delay={0.3}>
        <div className="mt-6 rounded-2xl bg-white border border-neutral-200/80 shadow-[var(--shadow-card)] p-4">
          <p style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">Why I think so</p>
          <ul className="mt-2 space-y-2">
            {signals.map((s) => (
              <li key={s} className="flex gap-2.5 text-[15px] leading-snug text-spal-navy">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-spal-green-100 flex items-center justify-center"><Tick01Icon size={12} color="#15803D" /></span>
                {s}
              </li>
            ))}
          </ul>
          {note ? <p className="mt-3 text-[14px] text-neutral-600 leading-snug">{note}</p> : null}
        </div>
      </Rise>

      <div className="mt-auto pt-8 space-y-1">
        <PrimaryButton onClick={onYes}>Sounds right</PrimaryButton>
        <GhostButton onClick={onNo}>Not quite</GhostButton>
      </div>
    </div>
  );
}
