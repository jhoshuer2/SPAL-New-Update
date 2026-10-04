// Core design-system components (spec §5.4) — Phase 0 subset; more are added per slice.
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, type } from '../theme/tokens';
import { formatNaira, Kobo, parseMoneyShorthand } from '../lib/money';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export function Button({ label, onPress, variant = 'primary', loading, disabled, testID }: {
  label: string; onPress?: () => void; variant?: Variant; loading?: boolean; disabled?: boolean; testID?: string;
}) {
  const { c } = useTheme();
  const bg = { primary: c.accent, secondary: c.surfaceSunk, ghost: 'transparent', destructive: c.danger }[variant];
  const fg = variant === 'primary' ? c.onAccent : variant === 'destructive' ? '#FFFFFF' : c.ink;
  return (
    <Pressable
      testID={testID} accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading} onPress={onPress}
      style={[s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[type.h2, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }, style]}>{children}</View>;
}

export function TextField({ label, value, onChangeText, placeholder, error, keyboardType }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[type.label, { color: c.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={c.muted} keyboardType={keyboardType}
        style={[s.input, { backgroundColor: c.surfaceSunk, color: c.ink, borderColor: error ? c.danger : c.line }]}
      />
      {error ? <Text style={[type.small, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

/** Naira input. Accepts shorthand ("45k"); emits integer kobo (null when empty/invalid). */
export function MoneyInput({ label, onChangeKobo }: { label: string; onChangeKobo: (k: Kobo | null) => void }) {
  const [text, setText] = React.useState('');
  const kobo = parseMoneyShorthand(text);
  return (
    <View>
      <TextField
        label={label} value={text} placeholder="₦0 — try 45k" keyboardType="numeric"
        error={text && kobo === null ? 'Enter an amount like 2500 or 45k' : undefined}
        onChangeText={(t) => { setText(t); onChangeKobo(parseMoneyShorthand(t)); }}
      />
      {kobo !== null && text ? <Text style={[type.small, { marginTop: spacing.xs }]}>{formatNaira(kobo)}</Text> : null}
    </View>
  );
}

export function MoneyText({ kobo, direction }: { kobo: Kobo; direction?: 'in' | 'out' }) {
  const { c } = useTheme();
  const sign = direction === 'in' ? '+' : direction === 'out' ? '−' : '';
  const color = direction === 'in' ? c.success : c.ink; // money out is ink, never red (spec §5.1)
  return <Text style={[type.h2, { color, fontVariant: ['tabular-nums'] }]}>{sign}{formatNaira(Math.abs(kobo))}</Text>;
}

export function ChipGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; multi?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={s.row}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={o.label}
            onPress={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            style={[s.chip, { backgroundColor: on ? c.accent : c.surfaceSunk, borderColor: c.line }]}>
            <Text style={[type.small, { color: on ? c.onAccent : c.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LevelBadge({ level, name }: { level: number; name: string }) {
  const { c } = useTheme();
  return (
    <View style={[s.chip, { backgroundColor: c.accent, borderColor: c.accent }]} accessibilityLabel={`Level ${level}, ${name}`}>
      <Text style={[type.label, { color: c.onAccent }]}>L{level} · {name}</Text>
    </View>
  );
}

export function SpalBubble({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
      <View style={[s.avatar, { backgroundColor: c.accent }]}><Text style={{ color: c.onAccent, fontWeight: '800' }}>S</Text></View>
      <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line, flex: 1 }]}>
        <Text style={[type.body, { color: c.ink }]}>{children}</Text>
      </View>
    </View>
  );
}

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | `${number}%` }) {
  const { c } = useTheme();
  return <View accessibilityLabel="Loading" style={{ height, width, borderRadius: radius.input, backgroundColor: c.surfaceSunk }} />;
}

export function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.xxl }}>
      <Text style={[type.h1, { color: c.ink, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.body, { color: c.muted, textAlign: 'center' }]}>{body}</Text>
      {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.xxl }}>
      <Text style={[type.body, { color: c.danger, textAlign: 'center' }]}>{message}</Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 48, minWidth: 44, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  card: { borderWidth: 1, borderRadius: radius.card, padding: spacing.lg },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: spacing.md, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 36, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, justifyContent: 'center' },
  avatar: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
