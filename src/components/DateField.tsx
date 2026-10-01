import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, MIN_TOUCH, radius, spacing } from '../theme';
import { formatDate, parseISODate, toISODate } from '../utils/dates';

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
      <Pressable accessibilityRole="button" style={styles.input} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{formatDate(value)}</Text>
      </Pressable>
      {open ? <DateTimePicker value={date} mode="date" onChange={handleChange} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  value: { fontSize: font.body, color: colors.text },
});
