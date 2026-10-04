import React from "react";

const variants = {
  default: { bg: "#fff", border: "1px solid var(--neutral-200)", titleColor: "var(--spal-navy)", bodyColor: "var(--neutral-500)" },
  celebration: { bg: "linear-gradient(135deg, var(--spal-green), var(--green-600))", border: "none", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.85)" },
  warning: { bg: "linear-gradient(135deg, var(--orange-50), #FFF3E8)", border: "1px solid var(--orange-100)", titleColor: "var(--orange-600)", bodyColor: "var(--neutral-600)" },
  tip: { bg: "linear-gradient(135deg, var(--blue-50), var(--purple-50))", border: "1px solid var(--blue-100)", titleColor: "var(--blue-600)", bodyColor: "var(--neutral-600)" },
};

/** Inline insight banner, daily nudges, tips, celebrations. Optional trailing metric. */
export function InsightCard({ title, message, variant = "default", icon, metric, metricLabel, positive }) {
  const v = variants[variant];
  const metricColor = variant === "celebration" ? "#fff" : positive === true ? "var(--spal-green)" : positive === false ? "var(--spal-orange)" : "var(--spal-navy)";
  return (
    <div style={{ borderRadius: "var(--radius-md)", padding: 16, background: v.bg, border: v.border }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {icon && <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: v.titleColor }}>{title}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.5, color: v.bodyColor }}>{message}</p>
        </div>
        {metric && (
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: metricColor }}>{metric}</p>
            {metricLabel && <p style={{ margin: 0, fontSize: 11, color: v.bodyColor }}>{metricLabel}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
