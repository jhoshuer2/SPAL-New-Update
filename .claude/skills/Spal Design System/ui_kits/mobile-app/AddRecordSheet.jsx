const { useState, useEffect } = React;

const SALE_CATS = ["Food", "Drinks", "Breakfast", "Lunch", "Dinner"];
const EXPENSE_CATS = ["Transport", "Groceries", "Utilities", "Rent", "Marketing"];

/** Add Sale / Add Expense bottom sheet, the app's core data-entry surface. Drag handle, big amount field, category pills, paid/owing toggle. */
function AddRecordSheet({ type, open, onClose }) {
  const { Button, PillChip } = window.SpalDesignSystem_6a1cb4;
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("paid");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (open) { setAmount(""); setDesc(""); setCat(""); setStatus("paid"); setSaved(false); } }, [open, type]);
  if (!open) return null;
  const cats = type === "sale" ? SALE_CATS : EXPENSE_CATS;
  const accent = type === "sale" ? "var(--spal-green)" : "var(--spal-orange)";

  function save() { setSaved(true); setTimeout(onClose, 900); }

  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "var(--backdrop-sheet)", zIndex: 55, animation: "spal-fade 0.2s ease" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 60, background: "#fff", borderRadius: "var(--radius-2xl) var(--radius-2xl) 0 0", boxShadow: "var(--shadow-sheet)", maxHeight: "88%", display: "flex", flexDirection: "column", animation: "spal-sheet-up 0.32s var(--ease-out-soft)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}><div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--neutral-200)" }} /></div>
        {saved ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--spal-green)", color: "#fff", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>✓</div>
            <p style={{ fontWeight: 700, fontSize: 18, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>Nice one!</p>
          </div>
        ) : (
          <div style={{ padding: "8px 20px 32px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 700, color: "var(--spal-navy)", fontFamily: "var(--font-display)", margin: 0 }}>
                <span style={{ width: 26, height: 26, borderRadius: 999, background: type === "sale" ? "var(--green-50)" : "var(--orange-50)", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 13 }}>{type === "sale" ? "↑" : "↓"}</span>
                Add {type === "sale" ? "Sale" : "Expense"}
              </h2>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 999, background: "var(--neutral-100)", border: "none", color: "var(--neutral-500)", cursor: "pointer" }}>✕</button>
            </div>

            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>How much?</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 64, padding: "0 16px", background: "var(--neutral-50)", borderRadius: "var(--radius-md)", border: "2px solid var(--neutral-100)", marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-300)" }}>₦</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="decimal" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 28, fontWeight: 700, color: "var(--spal-navy)" }} />
            </div>

            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>What was this for? <span style={{ color: "var(--neutral-300)" }}>(optional)</span></label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={type === "sale" ? "e.g. Suya, Drinks, Rice…" : "e.g. Fuel, Stock, Salary…"} style={{ width: "100%", height: 48, padding: "0 16px", background: "var(--neutral-50)", borderRadius: "var(--radius-md)", border: "2px solid var(--neutral-100)", fontSize: 14, color: "var(--spal-navy)", marginBottom: 18, boxSizing: "border-box" }} />

            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {cats.map((c) => <PillChip key={c} label={c} size="sm" color={type === "sale" ? "green" : "orange"} selected={cat === c} onClick={() => setCat(cat === c ? "" : c)} />)}
            </div>

            {type === "sale" && (
              <>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Did they pay?</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {["paid", "owing"].map((s) => (
                    <button key={s} onClick={() => setStatus(s)} style={{ flex: 1, height: 40, borderRadius: 999, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: status === s ? (s === "paid" ? "var(--spal-green)" : "var(--spal-orange)") : "var(--neutral-100)", color: status === s ? "#fff" : "var(--neutral-500)" }}>
                      {s === "paid" ? "Paid now" : "Owes me"}
                    </button>
                  ))}
                </div>
              </>
            )}

            <Button variant="primary" size="lg" fullWidth disabled={!amount} onClick={save}>Save {type === "sale" ? "Sale" : "Expense"}</Button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spal-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spal-fade{from{opacity:0}to{opacity:1}}
      `}</style>
    </>
  );
}
window.AddRecordSheet = AddRecordSheet;
