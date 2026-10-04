import React from "react";

const tabs = [
  { key: "home", label: "Home" },
  { key: "records", label: "Records" },
  { key: "insights", label: "Insights" },
];

/** Top segmented pill row, the primary navigation on Home/Records/Insights (intentional addition: factored from a pattern repeated inline on 3 screens). */
export function TopNavPills({ active = "home", onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange?.(t.key)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              height: 40, borderRadius: "var(--radius-full)", border: "none", cursor: "pointer",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13,
              background: isActive ? "var(--spal-green)" : "#fff",
              color: isActive ? "#fff" : "var(--neutral-500)",
              boxShadow: isActive ? "var(--shadow-btn-primary)" : "var(--shadow-card)",
              transition: `transform var(--duration-fast) var(--ease-flow)`,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
