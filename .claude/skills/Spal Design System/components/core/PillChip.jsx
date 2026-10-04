import React from "react";

const colors = {
  green: { base: ["var(--green-50)", "var(--green-700)", "var(--green-200)"], selected: "var(--spal-green)" },
  blue: { base: ["var(--blue-50)", "var(--blue-600)", "var(--blue-100)"], selected: "var(--spal-blue)" },
  orange: { base: ["var(--orange-50)", "var(--orange-600)", "var(--orange-100)"], selected: "var(--spal-orange)" },
  purple: { base: ["var(--purple-50)", "var(--purple-600)", "var(--purple-100)"], selected: "var(--spal-purple)" },
  gray: { base: ["var(--neutral-100)", "var(--neutral-600)", "var(--neutral-200)"], selected: "var(--neutral-700)" },
};

/** Pill toggle, category filters, segmented choices. */
export function PillChip({ label, icon, color = "gray", selected = false, size = "md", onClick }) {
  const c = colors[color];
  const [bg, fg, border] = c.base;
  return (
    <button
      className="spal-pillchip"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: size === "sm" ? 6 : 8,
        borderRadius: "var(--radius-full)", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer",
        border: `1px solid ${selected ? c.selected : border}`,
        background: selected ? c.selected : bg, color: selected ? "#fff" : fg,
        height: size === "sm" ? 36 : 48, padding: size === "sm" ? "0 12px" : "0 16px",
        fontSize: size === "sm" ? 12 : 14,
        transition: `transform var(--duration-fast) var(--ease-flow), background var(--duration-base) var(--ease-flow)`,
      }}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {label}
      <style>{`.spal-pillchip:active{transform:scale(var(--press-scale-btn))}`}</style>
    </button>
  );
}
