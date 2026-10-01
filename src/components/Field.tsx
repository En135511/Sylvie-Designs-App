import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, font, MIN_TOUCH, radius, spacing } from '../theme';
import { Icon } from './Icon';

type FieldProps = {
  label: string;
  error?: string | undefined;
  hint?: string;
  /** Unit or symbol shown inside the field on the right, e.g. "cm". */
  suffix?: string;
} & TextInputProps;

/** Labelled text input with focus ring, optional unit suffix, hint and error text. */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, suffix, style, onFocus, onBlur, ...input },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          input.multiline && styles.boxMultiline,
          focused && styles.boxFocused,
          error ? styles.boxError : null,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={PLACEHOLDER}
          selectionColor={colors.primary}
          {...input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, input.multiline && styles.inputMultiline, style]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

/** Compact search box with a magnifier and a clear button. */
export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.boxFocused]}>
      <Icon name="search" size={20} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        selectionColor={colors.primary}
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.searchInput}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={() => onChangeText('')}
        >
          <Icon name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** 4.6:1 on white, so placeholder text stays readable. */
const PLACEHOLDER = '#7A6D68';

// Removes the browser's default focus outline on web; the focus ring above replaces it.
const noOutline = { outlineStyle: 'none' } as unknown as object;

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
  box: {
    minHeight: MIN_TOUCH + 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  boxMultiline: { alignItems: 'flex-start', minHeight: 104 },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: MIN_TOUCH + 2 - 3,
    fontSize: font.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    ...noOutline,
  },
  inputMultiline: { textAlignVertical: 'top', minHeight: 96, paddingVertical: spacing.md },
  suffix: { color: colors.textMuted, fontSize: font.small, marginLeft: spacing.sm },
  error: { color: colors.danger, fontSize: font.small, lineHeight: 18 },
  hint: { color: colors.textMuted, fontSize: font.small, lineHeight: 18 },
  search: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: MIN_TOUCH - 3,
    fontSize: font.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    ...noOutline,
  },
});
