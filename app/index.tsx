// A01 Splash — Phase 0 placeholder. Auth redirect lands in slice 1a.
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/theme/ThemeProvider';
import { type } from '../src/theme/tokens';

export default function Splash() {
  const { c } = useTheme();
  const { t } = useTranslation();
  return (
    <View testID="screen-A01" style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={[type.display, { color: c.ink }]}>Spal</Text>
      <Text style={[type.body, { color: c.muted }]}>{t('splash.tagline')}</Text>
      <Link href="/dev/components" style={[type.small, { color: c.accentInk }]}>Component preview</Link>
    </View>
  );
}
