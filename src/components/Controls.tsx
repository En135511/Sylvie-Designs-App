import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, font, MIN_TOUCH, radius, spacing } from '../theme';
import { Icon } from './Icon';

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && { opacity: 0.75 },
      ]}
    >
      {selected ? <Icon name="checkmark" size={16} color={colors.primaryText} /> : null}
      <Text style={[styles.chipText, selected && { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

/** Chips that wrap onto several lines. */
export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

/** Chips on a single horizontally scrolling line (filters). */
export function ChipScroller({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScroll}
      style={styles.chipScrollOuter}
    >
      {children}
    </ScrollView>
  );
}

/** Two- or three-way selector, e.g. centimetres / inches. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && { color: colors.primaryText }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: font.small + 1, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipScrollOuter: { flexGrow: 0, marginHorizontal: -spacing.lg },
  chipScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 6,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: colors.primary },
  segmentText: { fontSize: font.body, fontWeight: '600', color: colors.text },
});

/**
 * A settings row with a switch. The whole row is the tap target (the bare switch is only about
 * 40 px wide); screen readers see a single "switch" with the label and its state.
 */
export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [switchStyles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={switchStyles.text}>
        <Text style={switchStyles.label}>{label}</Text>
        {description ? <Text style={switchStyles.description}>{description}</Text> : null}
      </View>
      <View pointerEvents="none" aria-hidden>
        <Switch
          value={value}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
          {...WEB_SWITCH}
        />
      </View>
    </Pressable>
  );
}

/** react-native-web paints the "on" thumb teal unless told otherwise (ignored on Android). */
export const WEB_SWITCH = { activeThumbColor: colors.surface } as object;

const switchStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  text: { flex: 1, gap: 2 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.text },
  description: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
});
