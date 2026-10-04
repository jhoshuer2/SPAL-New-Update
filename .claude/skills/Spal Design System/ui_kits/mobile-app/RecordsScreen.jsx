const { useState } = React;

const TODAY = [
  { id: 1, type: "sale", desc: "Suya, Drinks", cat: "Food", time: "2:45 PM", amount: 4500, owing: false },
  { id: 2, type: "expense", desc: "Fuel", cat: "Transport", time: "1:10 PM", amount: 3000, owing: false },
  { id: 3, type: "sale", desc: "Rice & Stew", cat: "Lunch", time: "12:30 PM", amount: 8200, owing: true, customer: "Mama Ngozi" },
];
const YESTERDAY = [
  { id: 4, type: "sale", desc: "Drinks", cat: "Drinks", time: "6:20 PM", amount: 2200, owing: false },
  { id: 5, type: "expense", desc: "Stock", cat: "Groceries", time: "9:00 AM", amount: 12000, owing: false },
];

function Row({ r }) {
  const { Badge } = window.SpalDesignSystem_6a1cb4;
  const isSale = r.type === "sale";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: "var(--radius-md)", padding: "14px", boxShadow: "var(--shadow-card)", border: r.owing ? "1px solid #FED7AA" : "1px solid transparent" }}>
      <div style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, background: isSale ? "var(--green-50)" : "var(--orange-50)", display: "flex", alignItems: "center", justifyContent: "center", color: isSale ? "var(--green-600)" : "var(--orange-600)", fontWeight: 700 }}>
        {isSale ? "↑" : "↓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>{r.desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {r.owing && <Badge label="Owing" color="orange" />}
          <Badge label={r.cat} color={isSale ? "green" : "orange"} />
          <span style={{ fontSize: 11, color: "var(--neutral-400)" }}>{r.time}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: isSale ? "var(--green-600)" : "var(--orange-600)", fontFamily: "var(--font-display)" }}>{isSale ? "+" : "–"}₦{r.amount.toLocaleString()}</p>
        {r.customer && <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--neutral-400)" }}>{r.customer}</p>}
      </div>
    </div>
  );
}

/** Records, filterable, date-grouped ledger with an owing banner and per-line payment status. */
function RecordsScreen({ onNavigate, onOpenSheet }) {
  const { TopNavPills } = window.SpalDesignSystem_6a1cb4;
  const [filter, setFilter] = useState("all");
  const filterFn = (r) => filter === "all" || (filter === "owing" ? r.owing : r.type === filter);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--spal-bg)" }}>
      <div style={{ padding: "48px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--neutral-400)", fontFamily: "var(--font-display)" }}>Good afternoon</p>
          <h1 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700, color: "var(--spal-navy)", letterSpacing: "-0.02em" }}>Ada's Kitchen</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ width: 44, height: 44, borderRadius: 999, background: "#fff", border: "none", boxShadow: "var(--shadow-avatar)", cursor: "pointer" }}>🔔</button>
          <button style={{ width: 44, height: 44, borderRadius: 999, background: "var(--spal-green)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>A</button>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}><TopNavPills active="records" onChange={onNavigate} /></div>

      <div style={{ padding: "18px 20px 0", display: "flex", gap: 8 }}>
        {["all", "sale", "expense", "owing"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            height: 36, padding: "0 14px", borderRadius: 999, border: "none", cursor: "pointer",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12.5,
            background: filter === f ? "var(--spal-navy)" : "#fff", color: filter === f ? "#fff" : "var(--neutral-600)",
            boxShadow: "var(--shadow-card)", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      <button onClick={() => setFilter("owing")} style={{ margin: "16px 20px 0", display: "block", width: "calc(100% - 40px)", textAlign: "left", border: "1px solid var(--surface-owed-border)", borderRadius: "var(--radius-md)", background: "var(--surface-owed-bg)", padding: "12px 16px", cursor: "pointer" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--surface-owed-text)" }}>₦8,200 owed to you</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--surface-owed-text-2)" }}>Mama Ngozi hasn't paid yet</p>
      </button>

      <div style={{ padding: "20px 20px 120px", display: "flex", flexDirection: "column", gap: 24 }}>
        {[["Today", TODAY], ["Yesterday", YESTERDAY]].map(([label, list]) => {
          const rows = list.filter(filterFn);
          if (!rows.length) return null;
          return (
            <div key={label}>
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>{label}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{rows.map((r) => <Row key={r.id} r={r} />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.RecordsScreen = RecordsScreen;
