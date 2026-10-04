// The SPAL geometric symbol system: abstract marks used instead of icons or mascots.
const paths = {
  profit: (c: string) => (
    <>
      <defs><radialGradient id="spal-sym-g"><stop offset="0%" stopColor={c} stopOpacity="0.9" /><stop offset="100%" stopColor={c} stopOpacity="0" /></radialGradient></defs>
      <circle cx="28" cy="28" r="26" fill="url(#spal-sym-g)" /><circle cx="28" cy="28" r="17" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" /><circle cx="28" cy="28" r="8" fill={c} />
    </>
  ),
  flow: (c: string) => (<><circle cx="28" cy="28" r="24" fill="none" stroke={c} strokeWidth="1.5" opacity="0.3" /><circle cx="28" cy="28" r="16" fill="none" stroke={c} strokeWidth="1.5" opacity="0.55" /><circle cx="28" cy="6" r="4" fill={c} /></>),
  growth: (c: string) => (<><rect x="8" y="34" width="10" height="14" rx="2" fill={c} opacity="0.45" /><rect x="23" y="24" width="10" height="24" rx="2" fill={c} opacity="0.7" /><rect x="38" y="10" width="10" height="38" rx="2" fill={c} /></>),
  focus: (c: string) => (<><circle cx="28" cy="28" r="6" fill={c} /><circle cx="28" cy="28" r="14" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" /><circle cx="28" cy="28" r="22" fill="none" stroke={c} strokeWidth="1.5" opacity="0.25" /></>),
  insight: (c: string) => (<><g stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">{[[28, 6], [46, 14], [50, 28], [46, 42], [28, 50], [10, 42], [6, 28], [10, 14]].map(([x, y]) => <line key={`${x}-${y}`} x1="28" y1="28" x2={x} y2={y} />)}</g><circle cx="28" cy="28" r="5" fill={c} /></>),
} as const;

export type Symbol = keyof typeof paths;

export function SpalSymbol({ symbol = "profit", color = "#22C55E", size = 56, spin = false }: { symbol?: Symbol; color?: string; size?: number; spin?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" style={spin ? { animation: "spal-sym-spin 10s linear infinite" } : undefined}>
      {paths[symbol](color)}
      {spin && <style>{"@keyframes spal-sym-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){svg{animation:none!important}}"}</style>}
    </svg>
  );
}
