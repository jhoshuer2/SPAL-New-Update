// DEV Component preview (spec §5.4) — shows every core component in light and dark.
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, ChipGroup, EmptyState, ErrorState, LevelBadge, MoneyInput, MoneyText, Skeleton, SpalBubble, TextField } from '../../src/components';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeProvider';
import { Scheme, spacing, type } from '../../src/theme/tokens';

function Sheet({ scheme }: { scheme: Scheme }) {
  const { c } = useTheme();
  const [chips, setChips] = useState<string[]>(['trading']);
  const [name, setName] = useState('');
  return (
    <View style={{ backgroundColor: c.bg, padding: spacing.lg, gap: spacing.lg, flex: 1 }}>
      <Text style={[type.label, { color: c.muted }]}>{scheme} theme</Text>
      <LevelBadge level={2} name="Builder" />
      <SpalBubble>Nice. You sold ₦45,000 this week — want to log your costs too?</SpalBubble>
      <Card>
        <MoneyText kobo={4_500_000} direction="in" />
        <MoneyText kobo={1_250_000} direction="out" />
      </Card>
      <View style={{ gap: spacing.sm }}>
        <Button label="Primary" /><Button label="Secondary" variant="secondary" />
        <Button label="Ghost" variant="ghost" /><Button label="Destructive" variant="destructive" />
        <Button label="Loading" loading /><Button label="Disabled" disabled />
      </View>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="What should Spal call you?" />
      <MoneyInput label="Amount" onChangeKobo={() => {}} />
      <ChipGroup value={chips} onChange={setChips} options={[{ value: 'trading', label: 'Trading' }, { value: 'food', label: 'Food & drinks' }, { value: 'tech', label: 'Tech' }]} />
      <Skeleton height={20} width="60%" />
      <EmptyState title="No sales yet" body="Record your first sale in three taps." actionLabel="Add a sale" />
      <ErrorState message="Couldn't load. Check your network." onRetry={() => {}} />
    </View>
  );
}

export default function ComponentPreview() {
  return (
    <ScrollView testID="screen-dev-components">
      <ThemeProvider force="light"><Sheet scheme="light" /></ThemeProvider>
      <ThemeProvider force="dark"><Sheet scheme="dark" /></ThemeProvider>
    </ScrollView>
  );
}
