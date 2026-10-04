"use client";
import { useCallback, useEffect, useState } from "react";

export type Checkin = { id: string; question: string; why: string; answered: boolean; answer: string | null; choices: string[]; mood: boolean; daysThisWeek: number | null };
export type CheckinState = { status: "loading" } | { status: "error" } | { status: "pending" } | { status: "ready"; data: Checkin };

/** Today's check-in. `pending` means the new tables are not live yet, so nothing is shown. */
export function useCheckin() {
  const [state, setState] = useState<CheckinState>({ status: "loading" });
  const load = useCallback(() => {
    fetch("/api/checkins/today").then((r) => r.json())
      .then((j) => { if (!j.success) setState({ status: "error" }); else if (j.data?.pending) setState({ status: "pending" }); else setState({ status: "ready", data: j.data }); })
      .catch(() => setState({ status: "error" }));
  }, []);
  useEffect(() => { load(); }, [load]);
  return { state, reload: load };
}
