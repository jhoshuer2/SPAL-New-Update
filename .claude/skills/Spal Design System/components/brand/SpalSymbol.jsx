import React from "react";

/**
 * The SPAL geometric symbol system, a proprietary set of abstract marks (never icons, mascots
 * or stock illustration) used across empty states, loading states, onboarding and section dividers.
 * This is the core of SPAL's recognizable visual signature.
 */
const paths = {
  profit: (c) => (
    <>
      <defs><radialGradient id="spal-sym-g"><stop offset="0%" stopColor={c} stopOpacity="0.9" /><stop offset="100%" stopColor={c} stopOpacity="0" /></radialGradient></defs>
      <circle cx="28" cy="28" r="26" fill="url(#spal-sym-g)" /><circle cx="28" cy="28" r="17" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" /><circle cx="28" cy="28" r="8" fill={c} />
    </>
  ),
  flow: (c) => (<><circle cx="28" cy="28" r="24" fill="none" stroke={c} strokeWidth="1.5" opacity="0.3" /><circle cx="28" cy="28" r="16" fill="none" stroke={c} strokeWidth="1.5" opacity="0.55" /><circle cx="28" cy="6" r="4" fill={c} /></>),
  growth: (c) => (<><rect x="8" y="34" width="10" height="14" rx="2" fill={c} opacity="0.45" /><rect x="23" y="24" width="10" height="24" rx="2" fill={c} opacity="0.7" /><rect x="38" y="10" width="10" height="38" rx="2" fill={c} /></>),
  focus: (c) => (<><circle cx="28" cy="28" r="6" fill={c} /><circle cx="28" cy="28" r="14" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" /><circle cx="28" cy="28" r="22" fill="none" stroke={c} strokeWidth="1.5" opacity="0.25" /></>),
  consistency: (c) => (<g fill={c} opacity="0.7">{[10, 28, 46].map((x) => [10, 28, 46].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />))}</g>),
  momentum: (c) => (<path d="M6 40 L20 40 L28 16 L36 40 L50 40" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />),
  insight: (c) => (<><g stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">{[[28, 6], [46, 14], [50, 28], [46, 42], [28, 50], [10, 42], [6, 28], [10, 14]].map(([x, y]) => <line key={`${x}-${y}`} x1="28" y1="28" x2={x} y2={y} />)}</g><circle cx="28" cy="28" r="5" fill={c} /></>),
  cashflow: (c) => (<path d="M4 30 Q 12 14 20 30 T 36 30 T 52 30" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />),
};

export function SpalSymbol({ symbol = "profit", color = "var(--spal-green)", size = 56, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={spin ? { animation: "spal-sym-spin 8s linear infinite" } : undefined}>
      {paths[symbol]?.(color)}
      {spin && <style>{`@keyframes spal-sym-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>}
    </svg>
  );
}
