/**
 * Offline fallback page — shown by the service worker when the user
 * navigates to a page that isn't in cache and has no internet connection.
 * Auto-recovers: as soon as the connection returns it reloads the app.
 */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const BG = "#EEF3E9";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // When the browser regains connectivity, go straight back into the app.
    function handleOnline() {
      setRetrying(true);
      window.location.replace("/home");
    }
    window.addEventListener("online", handleOnline);

    // Safety net: quietly poll in case the `online` event is missed.
    const poll = setInterval(() => {
      if (navigator.onLine) handleOnline();
    }, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(poll);
    };
  }, []);

  function tryAgain() {
    setRetrying(true);
    if (navigator.onLine) window.location.replace("/home");
    else window.location.reload();
  }

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-8 text-center"
      style={{ background: BG }}
    >
      <Image
        src="/spal-internet-outage.webp"
        alt="SPAL lost connection"
        width={260}
        height={260}
        priority
        className="w-[230px] h-auto object-contain"
      />

      <h1
        className="font-black text-spal-navy leading-tight mt-8"
        style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(26px, 8vw, 34px)", letterSpacing: "-0.02em" }}
      >
        Ouch! You disconnected your Internet
      </h1>

      <p className="text-[15px] text-neutral-500 mt-4 leading-relaxed" style={{ fontFamily: "var(--font-satoshi)" }}>
        Turn on your internet and try again.
      </p>

      <p className="text-[14px] text-neutral-400 mt-4 leading-relaxed max-w-[300px]" style={{ fontFamily: "var(--font-satoshi)" }}>
        if it doesn&apos;t work try the <span className="font-bold text-neutral-600">&lsquo;airplane mode trick&rsquo;</span>
      </p>

      <button
        onClick={tryAgain}
        disabled={retrying}
        className="mt-8 h-12 px-8 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-60"
        style={{ background: "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.35)", fontFamily: "var(--font-satoshi)" }}
      >
        {retrying ? "Reconnecting…" : "Try again"}
      </button>
    </div>
  );
}
