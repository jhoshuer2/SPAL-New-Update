import '../src/i18n';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
