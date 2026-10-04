"use client";

/**
 * PWAInstallPrompt
 *
 * Shows a bottom-sheet install prompt on Android Chrome when the browser
 * fires `beforeinstallprompt`. iOS never fires this event (users use
 * Safari Share → "Add to Home Screen" manually), so this component
 * is effectively a no-op on iOS.
 *
 * Logic:
 * - Only shows after the browser signals the app is installable
 * - 7-day cooldown between prompts (localStorage)
 * - Dismissing sets the cooldown; accepting sets it and hides the sheet
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY  = "spal_pwa_prompted_at";
const COOLDOWN_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // `beforeinstallprompt` only fires on Android Chrome when the PWA
    // installability criteria are met (HTTPS, manifest, service worker).
    const handler = (e: Event) => {
      e.preventDefault(); // suppress the default mini-infobar

      // Respect cooldown
      const last = localStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) return;

      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    void deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
    setDeferredPrompt(null);
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Subtle backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-spal-navy/20 z-[70]"
            onClick={handleDismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[71]
                       bg-white rounded-t-3xl px-5 pt-4 pb-safe shadow-2xl"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />

            {/* Content */}
            <div className="flex items-center gap-4 mb-6">
              {/* App icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-96.png"
                alt="SPAL"
                className="w-14 h-14 rounded-2xl shadow-sm flex-shrink-0"
              />
              <div>
                <p className="font-bold text-spal-navy font-[family-name:var(--font-satoshi)] leading-tight">
                  Add SPAL to your phone
                </p>
                <p className="text-sm text-neutral-400 mt-1 leading-snug">
                  Open it like an app — no browser, no typing a link.
                </p>
              </div>
            </div>

            {/* Perks row */}
            <div className="flex gap-3 mb-6">
              {[
                { emoji: "⚡", text: "Instant access" },
                { emoji: "🔔", text: "Notifications" },
                { emoji: "📵", text: "Works offline" },
              ].map(({ emoji, text }) => (
                <div
                  key={text}
                  className="flex-1 flex flex-col items-center gap-1 bg-neutral-50 rounded-2xl py-2.5 px-1"
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[10px] font-semibold text-neutral-500 text-center">{text}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pb-2">
              <button
                onClick={handleDismiss}
                className="flex-1 h-12 rounded-2xl border border-neutral-200 text-sm text-neutral-500 font-medium"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 h-12 rounded-2xl bg-spal-green text-white text-sm font-bold
                           shadow-[0_4px_14px_rgba(29,185,84,0.35)] active:scale-[0.97] transition-transform"
              >
                Add to home screen
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

