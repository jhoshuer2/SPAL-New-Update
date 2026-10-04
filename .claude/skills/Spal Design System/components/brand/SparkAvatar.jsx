import React, { useState, useEffect } from "react";

/** Floating "Ask SPAL" orb, the mascot's only appearance in-product; a gentle continuous bob, no spring bounce. */
export function SparkAvatar({ onClick, src = "../../assets/brand/spal-ai-orb.webp" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);
  return (
    <button
      onClick={onClick}
      aria-label="Ask SPAL"
      className="spal-spark"
      style={{
        position: "fixed", zIndex: 40, right: 16, bottom: "calc(72px + env(safe-area-inset-bottom,0px) + 12px)",
        width: 72, height: 72, background: "transparent", border: "none", padding: 0, cursor: "pointer",
        filter: "drop-shadow(0 6px 18px rgba(34,197,94,0.45)) drop-shadow(0 3px 8px rgba(0,0,0,0.22))",
        opacity: mounted ? 1 : 0, transform: mounted ? "scale(1)" : "scale(0.5)",
        transition: `opacity var(--duration-slow) var(--ease-delight), transform var(--duration-slow) var(--ease-delight)`,
      }}
    >
      <img src={src} alt="Ask SPAL" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
      <style>{`
        .spal-spark{animation:spal-spark-bob 3s ease-in-out 1s infinite}
        .spal-spark:active{transform:scale(0.88) !important}
        @keyframes spal-spark-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>
    </button>
  );
}
