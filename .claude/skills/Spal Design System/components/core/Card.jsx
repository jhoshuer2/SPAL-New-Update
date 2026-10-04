import React from "react";

/** Standard SPAL card, sparing use per DESIGN.md; prefer borderless sections when possible. */
export function Card({ accent = "none", padding = "md", elevated = false, children, style, className = "", ...props }) {
  const accents = {
    green: "var(--spal-green)", blue: "var(--spal-blue)", orange: "var(--spal-orange)", purple: "var(--spal-purple)", none: "transparent",
  };
  const paddings = { none: 0, sm: 12, md: 16, lg: 20 };
  return (
    <div
      className={className}
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--neutral-200)",
        borderTop: accent !== "none" ? `2px solid ${accents[accent]}` : "1px solid var(--neutral-200)",
        boxShadow: elevated ? "var(--shadow-card-elevated)" : "var(--shadow-card)",
        padding: paddings[padding],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
