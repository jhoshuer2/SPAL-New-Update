

const RECORDS = [
  { id: 1, type: "sale", desc: "Suya, Drinks", cat: "Food", time: "2:45 PM", amount: 4500 },
  { id: 2, type: "expense", desc: "Fuel", cat: "Transport", time: "1:10 PM", amount: 3000 },
  { id: 3, type: "sale", desc: "Rice & Stew", cat: "Lunch", time: "12:30 PM", amount: 8200 },
];

function RecordRow({ r }) {
  const { Badge } = window.SpalDesignSystem_6a1cb4;
  const isSale = r.type === "sale";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: "var(--radius-md)", padding: "12px 14px", boxShadow: "var(--shadow-card)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 999, flexShrink: 0, background: isSale ? "var(--green-50)" : "var(--orange-50)", display: "flex", alignItems: "center", justifyContent: "center", color: isSale ? "var(--green-600)" : "var(--orange-600)", fontWeight: 700 }}>
        {isSale ? "↑" : "↓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--spal-navy)", fontFamily: "var(--font-display)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <Badge label={r.cat} color={isSale ? "green" : "orange"} />
          <span style={{ fontSize: 11, color: "var(--neutral-400)" }}>{r.time}</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: isSale ? "var(--green-600)" : "var(--orange-600)", flexShrink: 0, fontFamily: "var(--font-display)" }}>
        {isSale ? "+" : "–"}₦{r.amount.toLocaleString()}
      </p>
    </div>
  );
}

/** Home, the personalized daily dashboard: profit hero, sale/expense split, owed banner, recent activity. */
function HomeScreen({ onNavigate, onOpenSheet }) {
  const { TopNavPills } = window.SpalDesignSystem_6a1cb4;
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

      <div style={{ padding: "20px 20px 0" }}><TopNavPills active="home" onChange={onNavigate} /></div>

      <div style={{ padding: "28px 20px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>Your Sales Today</p>

        <div style={{ borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 10, background: "var(--vivid-profit)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "var(--font-display)" }}>Profit</span>
            <span style={{ background: "rgba(255,255,255,0.22)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 999 }}>↑ 18%</span>
          </div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "clamp(32px,9vw,42px)", letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>₦48,200</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => onOpenSheet("sale")} style={{ textAlign: "left", border: "none", cursor: "pointer", borderRadius: "var(--radius-lg)", padding: 16, background: "var(--vivid-sale)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "var(--font-display)" }}>Sale</span>
              <span style={{ background: "rgba(255,255,255,0.22)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999 }}>↑ 9%</span>
            </div>
            <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "clamp(16px,5.5vw,22px)", fontFamily: "var(--font-display)" }}>₦62,000</p>
          </button>
          <button onClick={() => onOpenSheet("expense")} style={{ textAlign: "left", border: "none", cursor: "pointer", borderRadius: "var(--radius-lg)", padding: 16, background: "var(--vivid-expense)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "var(--font-display)" }}>Expense</span>
              <span style={{ background: "rgba(255,80,80,0.28)", color: "#FFBBBB", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999 }}>↓ 4%</span>
            </div>
            <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "clamp(16px,5.5vw,22px)", fontFamily: "var(--font-display)" }}>₦13,800</p>
          </button>
        </div>

        <div style={{ marginTop: 10, borderRadius: "var(--radius-lg)", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-owed-bg)" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--surface-owed-text-2)" }}>Owed to you</p>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 20, color: "var(--surface-owed-text)", fontFamily: "var(--font-display)" }}>₦6,500</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 999, background: "rgba(46,61,34,0.12)", color: "var(--surface-owed-text)" }}>Not yet paid</span>
        </div>
      </div>

      <div style={{ padding: "28px 20px 120px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--spal-navy)", fontFamily: "var(--font-display)" }}>Recent Sales</p>
          <button onClick={() => onNavigate("records")} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "var(--neutral-400)", cursor: "pointer" }}>View all</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RECORDS.map((r) => <RecordRow key={r.id} r={r} />)}
        </div>
      </div>
    </div>
  );
}
window.HomeScreen = HomeScreen;
