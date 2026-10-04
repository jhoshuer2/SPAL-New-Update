"use client";

/**
 * RegisterSW — registers the SPAL service worker on mount.
 *
 * Mounted in the root layout so it runs on every page, including
 * unauthenticated ones (login, signup) — the SW must be registered
 * before any navigation so the offline fallback is cached.
 *
 * Does nothing in development (NODE_ENV check happens at runtime
 * because this is a client component).
 */

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[SW] Registered, scope:", registration.scope);
        // Check for an updated SW on every load
        registration.update();
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });

    // When a new SW takes control, reload once so the page uses fresh assets.
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
