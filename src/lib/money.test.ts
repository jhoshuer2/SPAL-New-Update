import { formatNaira, parseMoneyShorthand } from './money';

describe('money', () => {
  it('formats kobo as naira', () => {
    expect(formatNaira(4_500_000)).toBe('₦45,000');
    expect(formatNaira(12_550)).toBe('₦125.50');
    expect(formatNaira(-100)).toBe('-₦1');
  });
  it('parses shorthand', () => {
    expect(parseMoneyShorthand('45k')).toBe(4_500_000);
    expect(parseMoneyShorthand('1.5m')).toBe(150_000_000);
    expect(parseMoneyShorthand('₦2,500')).toBe(250_000);
    expect(parseMoneyShorthand('abc')).toBeNull();
  });
});
