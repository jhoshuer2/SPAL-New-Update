import React from "react";

/** SPAL primary button, solid fills only (no gradients), full pill radius, tactile 0.96 press. */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  disabled,
  children,
  style,
  className = "",
  ...props
}) {
  const variants = {
    primary: { background: "var(--spal-green)", color: "#fff", boxShadow: "var(--shadow-btn-primary)" },
    secondary: { background: "#fff", color: "var(--spal-navy)", border: "1px solid var(--neutral-200)", boxShadow: "var(--shadow-card)" },
    ghost: { background: "transparent", color: "var(--spal-navy)" },
    danger: { background: "#EF4444", color: "#fff", boxShadow: "0 2px 12px rgba(239,68,68,0.25)" },
  };
  const sizes = {
    sm: { height: 40, padding: "0 16px", fontSize: 13 },
    md: { height: 48, padding: "0 24px", fontSize: 14 },
    lg: { height: 56, padding: "0 32px", fontSize: 15 },
  };
  const isDisabled = disabled || loading;
  return (
    <button
      className={`spal-btn ${className}`}
      disabled={isDisabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.01em",
        borderRadius: "var(--radius-full)", border: "none", cursor: isDisabled ? "default" : "pointer",
        width: fullWidth ? "100%" : "auto",
        opacity: isDisabled ? 0.5 : 1,
        transition: `transform var(--duration-fast) var(--ease-flow)`,
        ...variants[variant], ...sizes[size], ...style,
      }}
      {...props}
    >
      {loading ? (
        <span style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="spal-btn-dot" style={{ animationDelay: `${i * 0.15}s`, background: "currentColor" }} />
          ))}
        </span>
      ) : (
        <>
          {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
          {children}
          {iconRight && <span style={{ display: "flex", flexShrink: 0 }}>{iconRight}</span>}
        </>
      )}
      <style>{`
        .spal-btn:active:not(:disabled){transform:scale(var(--press-scale-btn))}
        .spal-btn-dot{width:6px;height:6px;border-radius:999px;display:inline-block;animation:spal-btn-pulse 1.1s infinite}
        @keyframes spal-btn-pulse{0%,100%{opacity:0.3}50%{opacity:1}}
      `}</style>
    </button>
  );
}
