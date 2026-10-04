import React, { useEffect, useRef } from "react";

/** Bottom-anchored undo toast with a live countdown bar, the only "destructive action" feedback pattern in SPAL. */
export function UndoToast({ message, onUndo, onExpire, duration = 10000 }) {
  const expiredRef = useRef(false);
  useEffect(() => {
    expiredRef.current = false;
    const t = setTimeout(() => { expiredRef.current = true; onExpire?.(); }, duration);
    return () => clearTimeout(t);
  }, [duration, onExpire]);

  return (
    <div style={{ position: "fixed", left: 16, right: 16, bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)", zIndex: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: "var(--radius-md)", background: "#1E293B", boxShadow: "var(--shadow-toast)" }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#F87171", fontSize: 14 }}>✕</div>
        <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "var(--font-display)" }}>{message}</p>
        <button
          onClick={() => { if (!expiredRef.current) onUndo?.(); }}
          style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: "var(--spal-green)", fontFamily: "var(--font-display)", cursor: "pointer" }}
        >Undo</button>
      </div>
      <div style={{ marginTop: 6, height: 3, borderRadius: 999, background: "var(--spal-green)", opacity: 0.6, transformOrigin: "left", animation: `spal-undo-shrink ${duration}ms linear forwards` }} />
      <style>{`@keyframes spal-undo-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}`}</style>
    </div>
  );
}
