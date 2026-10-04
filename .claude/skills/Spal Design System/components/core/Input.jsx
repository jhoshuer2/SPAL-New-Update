import React, { useState } from "react";

/** Text field, label, hint/error, prefix (currency symbol), suffix slot, `large` mode for hero numeric entry. */
export function Input({ label, hint, error, prefix, suffix, large = false, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-body)" }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>{label}</label>}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, background: "#fff",
          borderRadius: "var(--radius-sm)", border: `1.5px solid ${error ? "#F87171" : focused ? "var(--spal-blue)" : "var(--neutral-200)"}`,
          height: large ? 64 : 48, padding: "0 16px",
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
          transition: `border-color var(--duration-base) var(--ease-flow), box-shadow var(--duration-base) var(--ease-flow)`,
          ...style,
        }}
      >
        {prefix && <span style={{ fontWeight: 700, color: "var(--spal-navy)", fontSize: large ? 24 : 16, flexShrink: 0 }}>{prefix}</span>}
        <input
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--spal-navy)", fontSize: large ? 24 : 14, fontWeight: large ? 700 : 400 }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {suffix && <span style={{ flexShrink: 0, color: "var(--neutral-400)" }}>{suffix}</span>}
      </div>
      {error && <p style={{ fontSize: 12, color: "#EF4444", fontWeight: 500, margin: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: "var(--neutral-400)", margin: 0 }}>{hint}</p>}
    </div>
  );
}
