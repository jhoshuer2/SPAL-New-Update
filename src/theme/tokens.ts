// Design tokens (spec §5). Placeholder brand until Figma exists; re-skin here only.
export const colors = {
  light: {
    bg: '#F3F4EF', surface: '#FFFFFF', surfaceSunk: '#E9EBE3', ink: '#171A12', muted: '#5B6250',
    line: '#D8DCCD', accent: '#C5EA25', onAccent: '#192000', accentInk: '#425600',
    success: '#23804A', warning: '#A86A00', danger: '#B83A2E', info: '#2F5FC4',
  },
  dark: {
    bg: '#111310', surface: '#1A1D16', surfaceSunk: '#23271D', ink: '#ECEFE3', muted: '#A4AB96',
    line: '#31362B', accent: '#C5EA25', onAccent: '#192000', accentInk: '#CFEE4C',
    success: '#62C985', warning: '#E7B04B', danger: '#F08A7E', info: '#93B2F6',
  },
} as const;

export type ColorTokens = { [K in keyof typeof colors.light]: string };
export type Scheme = keyof typeof colors;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, x3: 32, x4: 40, x5: 56 } as const;
export const radius = { input: 8, card: 12, sheet: 16, pill: 999 } as const;

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  heading: 'BricolageGrotesque_700Bold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const type = {
  display: { fontSize: 28, fontWeight: '800' as const },
  h1: { fontSize: 20, fontWeight: '700' as const },
  h2: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.66, textTransform: 'uppercase' as const },
};
