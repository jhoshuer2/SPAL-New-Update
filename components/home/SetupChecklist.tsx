"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tick01Icon, ArrowUp01Icon, ArrowDown01Icon, ArrowRight01Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";
const DONE_KEY = "spal_setup_done";

type Step = { key: string; label: string; href: string; done: boolean; visitFlag?: string };

/**
 * First-run onboarding checklist shown on the home dashboard. Guides a new user
 * through the core flow (add an item -> first sale -> browse a category ->
 * chat with SPAL -> view profile), checking each step off as it's completed.
 * The whole card disappears for good once every step is done.
 *
 * - Item / sale steps complete from real data (passed in by the home).
 * - Navigation steps complete once the user has been sent to that screen
 *   (a per-step localStorage flag), so tapping a step both guides and ticks it.
 */
export function SetupChecklist({ hasItem, hasSale, perishable }: { hasItem: boolean; hasSale: boolean; perishable: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(DONE_KEY)) { setDismissed(true); return; }
      setVisited({
        category: !!localStorage.getItem("spal_seen_category"),
        ask:      !!localStorage.getItem("spal_seen_ask"),
        profile:  !!localStorage.getItem("spal_seen_profile"),
      });
    } catch { /* ignore */ }
  }, []);

  const steps: Step[] = useMemo(() => [
    { key: "item",     label: perishable ? "Create your first menu item" : "Add your first item", href: perishable ? "/menu/add" : "/inventory/add", done: hasItem },
    { key: "sale",     label: "Make your first sale",  href: perishable ? "/orders/new" : "/sell", done: hasSale },
    { key: "category", label: "Browse your categories", href: perishable ? "/menu" : "/inventory", done: !!visited.category, visitFlag: "category" },
    { key: "ask",      label: "Chat with SPAL AI",      href: "/ask",     done: !!visited.ask,     visitFlag: "ask" },
    { key: "profile",  label: "Set up your profile",    href: "/profile", done: !!visited.profile, visitFlag: "profile" },
  ], [hasItem, hasSale, perishable, visited]);

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  // Once everything is done, remember it and remove the card permanently.
  useEffect(() => {
    if (mounted && !dismissed && doneCount === steps.length) {
      try { localStorage.setItem(DONE_KEY, "1"); } catch { /* ignore */ }
      const t = setTimeout(() => setDismissed(true), 900);
      return () => clearTimeout(t);
    }
  }, [mounted, dismissed, doneCount, steps.length]);

  function go(step: Step) {
    if (step.visitFlag) {
      try { localStorage.setItem(`spal_seen_${step.visitFlag}`, "1"); } catch { /* ignore */ }
    }
    window.location.href = step.href;
  }

  if (!mounted || dismissed) return null;

  const nextIdx = steps.findIndex((s) => !s.done);

  return (
    <div className="px-5 mt-5">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {/* Progress bar (top) */}
          <div className="h-1.5 w-full" style={{ background: "#E7EDE2" }}>
            <motion.div layout className="h-full rounded-r-full" style={{ width: `${pct}%`, background: "#22C55E" }} />
          </div>

          {/* Header */}
          <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-between px-4 pt-3.5 pb-3">
            <div className="text-left">
              <p className="text-[15px] font-black text-spal-navy" style={{ fontFamily: FF }}>Finish setting up</p>
              <p className="text-[12.5px] text-neutral-500 mt-0.5" style={{ fontFamily: FF }}>{doneCount} of {steps.length} done · {pct}%</p>
            </div>
            {collapsed ? <ArrowDown01Icon size={20} color="#9CA3AF" /> : <ArrowUp01Icon size={20} color="#9CA3AF" />}
          </button>

          {/* Steps */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-2 pb-2">
                  {steps.map((s, i) => {
                    const current = i === nextIdx;
                    return (
                      <button key={s.key} onClick={() => go(s)} disabled={s.done}
                        className="w-full flex items-center gap-3 px-2 py-3 rounded-xl text-left active:bg-black/[0.02] transition-colors disabled:opacity-100">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={s.done ? { background: "#22C55E" } : { border: `2px solid ${current ? "#22C55E" : "#D4D4D8"}` }}>
                          {s.done && <Tick01Icon size={13} color="#fff" />}
                        </span>
                        <span className="flex-1 min-w-0 text-[14.5px] truncate"
                          style={{ fontFamily: FF, color: s.done ? "#9CA3AF" : "#0F172A", fontWeight: s.done ? 500 : current ? 800 : 600, textDecoration: s.done ? "line-through" : "none" }}>
                          {s.label}
                        </span>
                        {!s.done && <ArrowRight01Icon size={16} color={current ? "#22C55E" : "#C4CBD4"} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
