import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, MIN_TOUCH, radius, spacing } from '../theme';
import { formatDate, parseISODate, toISODate } from '../utils/dates';
import { Icon } from './Icon';

/** Date picker backed by a YYYY-MM-DD string (a local calendar date, no timezone). */
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = parseISODate(value) ?? new Date();

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (event.type === 'set' && selected) onChange(toISODate(selected));
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}. Tap to change`}
        style={({ pressed }) => [styles.input, pressed && { backgroundColor: colors.surfaceMuted }]}
        onPress={() => setOpen(true)}
      >
        <Icon name="calendar-outline" size={20} color={colors.primary} />
        <Text style={styles.value}>{formatDate(value)}</Text>
      </Pressable>
      {open ? <DateTimePicker value={date} mode="date" onChange={handleChange} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
  input: {
    minHeight: MIN_TOUCH + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  value: { fontSize: font.body, color: colors.text },
});
