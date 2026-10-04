import React, { useState, useRef, useEffect } from "react";

const items = [
  { key: "sale", label: "Record Sale", bg: "var(--green-50)", fg: "var(--green-600)" },
  { key: "expense", label: "Record Expense", bg: "var(--orange-50)", fg: "var(--orange-600)" },
  { key: "ask", label: "Chat with SPAL", bg: "var(--purple-50)", fg: "var(--spal-purple)" },
  { key: "goals", label: "Set your goals", bg: "var(--green-100)", fg: "var(--green-600)" },
  { key: "inventory", label: "Manage inventory", bg: "var(--blue-50)", fg: "var(--spal-blue)" },
];

/** Floating quick-action menu, the app's primary entry point (bottom nav was removed in favor of this). */
export function QuickMenuFab({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "fixed", zIndex: 50, right: 16, bottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}>
      {open && (
        <div style={{ position: "absolute", bottom: 60, right: 0, background: "#fff", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-menu)", minWidth: 190 }}>
          {items.map((it, i) => (
            <button key={it.key} onClick={() => { setOpen(false); onSelect?.(it.key); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", borderBottom: i < items.length - 1 ? "1px solid var(--neutral-50)" : "none", textAlign: "left", cursor: "pointer" }}>
              <span style={{ width: 32, height: 32, borderRadius: 999, background: it.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: it.fg }} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>{it.label}</span>
            </button>
          ))}
        </div>
      )}
      <button className="spal-fab" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 20px", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", background: "var(--spal-green)", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-display)", boxShadow: "var(--shadow-fab)" }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>☰</span> Quick Menu
      </button>
      <style>{`.spal-fab:active{transform:scale(0.95)}`}</style>
    </div>
  );
}
