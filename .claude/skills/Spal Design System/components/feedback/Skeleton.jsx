import React from "react";

/** Shimmering placeholder, SPAL's loading state is always skeleton screens matching the real content shape, never spinners. */
export function Skeleton({ width = "100%", height = 14, radius = 6, style }) {
  return <div style={{ width, height, borderRadius: radius, background: "linear-gradient(90deg,var(--neutral-100) 25%,#ECECED 50%,var(--neutral-100) 75%)", backgroundSize: "200% auto", animation: "spal-shimmer 1.4s linear infinite", ...style }}>
    <style>{`@keyframes spal-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`}</style>
  </div>;
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: "var(--radius-md)", padding: "14px", boxShadow: "var(--shadow-card)" }}>
      <Skeleton width={44} height={44} radius={999} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="30%" height={10} />
      </div>
      <Skeleton width={48} height={12} />
    </div>
  );
}
