// Level engine: pure placement logic (spec §8.1). Shared with edge functions.
export type Level = 0 | 1 | 2 | 3 | 4 | 5;

export type PlacementAnswers = {
  hasSold: boolean;
  isRegistered: boolean;
  paidStaffCount: number;
  locationsOrChannels: number;
  hasManagers?: boolean;
  isIncorporatedWithMgmt: boolean;
  businessCount: number;
  revenueBand?: number; // 0 = none
  monthsRunning?: number;
};

export type Placement = { level: Level; confidence: number; signals: string[] };

export const hasConflict = (a: PlacementAnswers) => !a.hasSold && (a.revenueBand ?? 0) > 0;

export function placeLevel(a: PlacementAnswers): Placement {
  let level: Level;
  if (!a.hasSold) level = 0;
  else if (!a.isRegistered) level = 1;
  else if (a.paidStaffCount === 0) level = 2;
  else if (a.locationsOrChannels <= 1 && !a.hasManagers) level = 3;
  else if (!(a.isIncorporatedWithMgmt || a.businessCount > 1)) level = 4;
  else level = 5;
  return { level, confidence: scoreConfidence(a, level), signals: explainSignals(a, level) };
}

// Revenue and time running only adjust confidence, never the level.
export function scoreConfidence(a: PlacementAnswers, level: Level): number {
  let c = 0.8;
  if (hasConflict(a)) c -= 0.3;
  if (a.revenueBand === undefined) c -= 0.05;
  if (a.monthsRunning !== undefined && level >= 1 && a.monthsRunning < 1) c -= 0.15;
  if (a.monthsRunning !== undefined && level === 0 && a.monthsRunning > 0) c -= 0.15;
  return Math.max(0, Math.min(1, Number(c.toFixed(2))));
}

export function explainSignals(a: PlacementAnswers, level: Level): string[] {
  const s: string[] = [];
  s.push(a.hasSold ? "You've made sales already" : "You haven't made your first sale yet");
  if (level >= 1) s.push(a.isRegistered ? 'Your business is registered' : 'Your business is not registered yet');
  if (level >= 2) s.push(a.paidStaffCount > 0 ? `You pay ${a.paidStaffCount} ${a.paidStaffCount === 1 ? 'person' : 'people'}` : "You're running it on your own so far");
  if (level >= 3) s.push(a.locationsOrChannels > 1 ? `You sell across ${a.locationsOrChannels} locations or channels` : 'You operate from one place or channel');
  while (s.length < 3) s.push(a.monthsRunning ? `You've been running for ${a.monthsRunning} months` : 'You told us where you are today');
  return s.slice(0, 3);
}
