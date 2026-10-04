const { useState } = React;

/** Composes the full click-through app: onboarding → home → records, with the Add Sale/Expense sheet and quick menu wired up. */
function AppShell() {
  const { QuickMenuFab } = window.SpalDesignSystem_6a1cb4;
  const [screen, setScreen] = useState("welcome");
  const [sheet, setSheet] = useState(null);

  const Welcome = window.WelcomeScreen, Home = window.HomeScreen, Records = window.RecordsScreen, Sheet = window.AddRecordSheet;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-canvas-dark)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "relative", width: 390, height: 780, maxHeight: "94vh", borderRadius: 36, overflow: "hidden", boxShadow: "var(--shadow-shell)", background: "var(--spal-bg)" }}>
        {screen === "welcome" && <Welcome onGetStarted={() => setScreen("home")} onLogin={() => setScreen("home")} />}
        {screen === "home" && <Home onNavigate={setScreen} onOpenSheet={setSheet} />}
        {screen === "records" && <Records onNavigate={setScreen} onOpenSheet={setSheet} />}
        {screen !== "welcome" && <QuickMenuFab onSelect={(k) => { if (k === "sale" || k === "expense") setSheet(k); }} />}
        <Sheet type={sheet} open={!!sheet} onClose={() => setSheet(null)} />
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
