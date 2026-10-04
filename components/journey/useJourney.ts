"use client";
// Client hook over GET /api/journey. Loading, error and "migration pending" are explicit states.
import { useCallback, useEffect, useState } from "react";
import type { JourneyData, JourneyNotReady } from "@/lib/journey/server";

export type JourneyState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "pending" } // new tables not created yet: show the legacy experience
  | { status: "ready"; data: JourneyData };

export function useJourney() {
  const [state, setState] = useState<JourneyState>({ status: "loading" });
  const load = useCallback(() => {
    fetch("/api/journey")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: JourneyData | JourneyNotReady }) => {
        if (!j.success || !j.data) return setState({ status: "error" });
        setState(j.data.ready ? { status: "ready", data: j.data } : { status: "pending" });
      })
      .catch(() => setState({ status: "error" }));
  }, []);
  useEffect(() => { load(); }, [load]);
  return { state, reload: load };
}
