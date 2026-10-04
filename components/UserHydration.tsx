"use client";

/**
 * UserHydration — runs once when the main app layout mounts.
 *
 * If the Zustand store has no user (e.g. after a hard refresh, or if the
 * profile fetch failed during sign-in), this fetches /api/auth/me and
 * repopulates the store.  It's a silent background operation — no UI.
 */

import { useEffect } from "react";
import { useSPALStore } from "@/store";

export function UserHydration() {
  const { setUser } = useSPALStore();

  // Always re-fetch from the server on mount so the store reflects the
  // currently authenticated user — not a previously cached (stale) user.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.success && data.data) {
            setUser(data.data);
          } else {
            // 401 / profile not found — clear any stale cached user
            setUser(null);
          }
        }
      })
      .catch(() => { /* silent — middleware handles redirect if unauthenticated */ });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  return null;
}
