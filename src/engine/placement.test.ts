import { placeLevel, PlacementAnswers } from './placement';

const base: PlacementAnswers = {
  hasSold: true, isRegistered: true, paidStaffCount: 2, locationsOrChannels: 1,
  isIncorporatedWithMgmt: false, businessCount: 1,
};

describe('placeLevel', () => {
  it.each([
    [{ hasSold: false }, 0],
    [{ isRegistered: false }, 1],
    [{ paidStaffCount: 0 }, 2],
    [{}, 3],
    [{ locationsOrChannels: 2 }, 4],
    [{ locationsOrChannels: 2, businessCount: 2 }, 5],
  ] as [Partial<PlacementAnswers>, number][])('%j -> level %i', (o, lvl) => {
    expect(placeLevel({ ...base, ...o }).level).toBe(lvl);
  });
  it('returns exactly 3 signals', () => {
    expect(placeLevel(base).signals).toHaveLength(3);
    expect(placeLevel({ ...base, hasSold: false }).signals).toHaveLength(3);
  });
  it('revenue never changes level, only confidence', () => {
    const a = placeLevel({ ...base, hasSold: false });
    const b = placeLevel({ ...base, hasSold: false, revenueBand: 3 });
    expect(b.level).toBe(a.level);
    expect(b.confidence).toBeLessThan(a.confidence);
  });
});
