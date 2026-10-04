import React, { useEffect, useState } from "react";

/** Weekly challenge progress card, gamification nudge shown on Home. */
export function WeeklyChallengeCard({ label, current, target, completed = false }) {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div style={{ borderRadius: "var(--radius-md)", padding: 16, background: completed ? "var(--green-50)" : "#fff", border: `1px solid ${completed ? "var(--green-100)" : "var(--neutral-100)"}`, boxShadow: "var(--shadow-card)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--spal-purple)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Weekly Challenge</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--spal-navy)", lineHeight: 1.35 }}>{label}</p>
        </div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: completed ? "var(--spal-green)" : "var(--spal-navy)", flexShrink: 0 }}>
          {current}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--neutral-400)" }}>/{target}</span>
        </p>
      </div>
      <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: "var(--neutral-100)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: completed ? "var(--spal-green)" : "var(--spal-purple)", transition: `width var(--duration-slow) var(--ease-flow)` }} />
      </div>
      {completed && <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: "var(--green-700)" }}>You completed this week's challenge!</p>}
    </div>
  );
}
