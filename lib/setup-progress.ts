/**
 * Marks a setup-checklist "visit" step (see components/home/SetupChecklist.tsx)
 * as done from wherever the user actually does it — not only when they tap the
 * checklist row itself. Same localStorage keys the checklist reads, so tapping
 * "Ask SPAL" from Quick Access, a menu category chip, or the profile avatar all
 * check the step off, not just the guided route through the checklist card.
 */
export function markSetupSeen(step: "category" | "ask" | "profile") {
  try { localStorage.setItem(`spal_seen_${step}`, "1"); } catch { /* ignore */ }
}
