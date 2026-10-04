const { useEffect, useState } = React;

/** Onboarding splash, cinematic, dark canvas, wordmark, floating preview cards, single CTA. */
function WelcomeScreen({ onGetStarted, onLogin }) {
  const [splash, setSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1400); return () => clearTimeout(t); }, []);
  const { SpalSymbol } = window.SpalDesignSystem_6a1cb4;

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", background: "var(--spal-navy)", backgroundImage: "url(../../assets/backgrounds/splash-background.webp)", backgroundSize: "cover", backgroundPosition: "center" }}>
      {splash ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--spal-navy)", transition: "opacity 0.5s ease" }}>
          <img src="../../assets/logo/spal-wordmark.webp" alt="SPAL" style={{ width: 170, height: "auto", opacity: 0.96 }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", opacity: splash ? 0 : 1, transition: "opacity 0.4s var(--ease-out-soft)" }}>
          <div style={{ paddingTop: 48, display: "flex", justifyContent: "center" }}>
            <img src="../../assets/logo/spal-wordmark.webp" alt="SPAL" style={{ width: 100, height: "auto" }} />
          </div>

          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 300, aspectRatio: "4/3.6" }}>
              <div style={{ position: "absolute", top: "4%", left: "2%", width: "66%", filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.32))" }}>
                <img src="../../assets/illustrations/addsales-getstarted.webp" alt="" style={{ width: "100%", display: "block", borderRadius: 18 }} />
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: "68%", filter: "drop-shadow(0 20px 44px rgba(0,0,0,0.36))" }}>
                <img src="../../assets/illustrations/addexpense-getstarted.webp" alt="" style={{ width: "100%", display: "block", borderRadius: 18 }} />
              </div>
            </div>
          </div>

          <div style={{ padding: "0 24px 40px" }}>
            <h1 style={{ color: "#fff", textAlign: "center", fontSize: "clamp(24px,6.5vw,30px)", letterSpacing: "-0.02em", marginBottom: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Your Business Finance<br />Made Easy
            </h1>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.55, marginBottom: 28 }}>
              Track your sales, know your profit and grow.<br />No accounting knowledge needed
            </p>
            <button onClick={onGetStarted} className="spal-cta"
              style={{ width: "100%", height: 58, borderRadius: 999, display: "flex", alignItems: "center", background: "var(--spal-green)", boxShadow: "var(--shadow-fab)", border: "none", cursor: "pointer", paddingLeft: 6, paddingRight: 20 }}>
              <span style={{ width: 46, height: 46, borderRadius: 999, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 18 }}>→</span>
              <span style={{ flex: 1, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }}>Get Started</span>
            </button>
            <button onClick={onLogin} style={{ width: "100%", marginTop: 16, background: "none", border: "none", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
              Already have an account? <span style={{ color: "#fff", fontWeight: 700 }}>Login</span>
            </button>
          </div>
          <style>{`.spal-cta:active{transform:scale(0.98)}`}</style>
        </div>
      )}
    </div>
  );
}
window.WelcomeScreen = WelcomeScreen;
