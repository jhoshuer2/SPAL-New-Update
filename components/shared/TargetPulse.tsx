"use client";

import { useEffect, useState } from "react";

/**
 * A small pulsing green dot that points at another element on screen — the
 * same "click here next" indicator used to nudge a new user toward the Menu
 * tab from the Orders empty state. Pass the `data-setup-target` value of the
 * element to point at (a bottom-nav tab, a Quick Access tile, ...); it measures
 * that element live so the dot always lands exactly on it, at any screen size.
 */
export function TargetPulse({ targetAttr }: { targetAttr: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const measure = () => {
      const el = document.querySelector(`[data-setup-target="${targetAttr}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) { setPos({ x: r.right - 6, y: r.top + 6 }); return; }
      }
      if (++tries < 20) timer = setTimeout(measure, 100);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); clearTimeout(timer); };
  }, [targetAttr]);

  if (!pos) return null;
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
      aria-hidden
    >
      <span className="absolute inset-0 w-6 h-6 rounded-full animate-ping" style={{ background: "rgba(34,197,94,0.35)" }} />
      <span className="absolute inset-0 w-6 h-6 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 0 6px rgba(34,197,94,0.2)" }} />
    </div>
  );
}
