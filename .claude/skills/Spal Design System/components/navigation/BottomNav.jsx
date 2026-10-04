import React from "react";

const tabs = [
  { key: "home", label: "Home" },
  { key: "records", label: "Records" },
  { key: "insights", label: "Insights" },
  { key: "profile", label: "Profile" },
];

/** Frosted-glass bottom tab bar, used on inner/detail screens (Home/Records/Insights use TopNavPills instead). */
export function BottomNav({ active = "home", onChange }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "var(--shell-max-w)", background: "rgba(255,255,255,0.88)", borderTop: "1px solid rgba(228,228,231,0.5)", backdropFilter: "saturate(180%) blur(20px)", zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "8px 8px calc(env(safe-area-inset-bottom,0px) + 8px)" }}>
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button key={t.key} onClick={() => onChange?.(t.key)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 52, minHeight: 48, justifyContent: "center", position: "relative", cursor: "pointer" }}>
              {isActive && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, borderRadius: 999, background: "var(--spal-green)" }} />}
              <span style={{ width: 21, height: 21, borderRadius: 6, background: isActive ? "var(--spal-navy)" : "var(--neutral-300)" }} />
              <span style={{ fontSize: 9.5, fontWeight: 600, fontFamily: "var(--font-display)", color: isActive ? "var(--spal-navy)" : "var(--neutral-400)" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
