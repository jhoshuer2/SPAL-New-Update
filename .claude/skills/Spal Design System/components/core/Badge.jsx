import React from "react";

const colors = {
  green: ["var(--green-100)", "var(--green-700)", "var(--spal-green)"],
  orange: ["var(--orange-100)", "var(--orange-700)", "var(--spal-orange)"],
  blue: ["var(--blue-100)", "var(--blue-600)", "var(--spal-blue)"],
  purple: ["var(--purple-100)", "var(--purple-600)", "var(--spal-purple)"],
  gray: ["var(--neutral-100)", "var(--neutral-600)", "var(--neutral-400)"],
  red: ["#FEE2E2", "#B91C1C", "#EF4444"],
};

/** Small status pill, category tags, states ("Owing", "Paid"), counts. */
export function Badge({ label, color = "gray", dot = false, size = "sm" }) {
  const [bg, fg, dotColor] = colors[color];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, borderRadius: "var(--radius-full)",
        fontFamily: "var(--font-body)", fontWeight: 600,
        padding: size === "sm" ? "3px 10px" : "5px 12px",
        fontSize: size === "sm" ? 11 : 13,
        background: bg, color: fg,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: dotColor, flexShrink: 0 }} />}
      {label}
    </span>
  );
}
