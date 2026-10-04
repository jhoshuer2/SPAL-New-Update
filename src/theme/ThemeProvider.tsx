import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorTokens, Scheme } from './tokens';

type Theme = { scheme: Scheme; c: ColorTokens };
const ThemeContext = createContext<Theme>({ scheme: 'light', c: colors.light });

export function ThemeProvider({ children, force }: { children: React.ReactNode; force?: Scheme }) {
  const system = useColorScheme();
  const scheme: Scheme = force ?? (system === 'dark' ? 'dark' : 'light');
  return <ThemeContext.Provider value={{ scheme, c: colors[scheme] }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
