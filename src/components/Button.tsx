import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, MIN_TOUCH, radius, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghostDanger';

const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary: colors.primaryText,
  danger: colors.primaryText,
  secondary: colors.primary,
  ghost: colors.primary,
  ghostDanger: colors.danger,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  const inactive = disabled || loading;
  const color = TEXT_COLOR[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && {
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        },
        variant === 'danger' && { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 },
        variant === 'secondary' && [
          styles.secondary,
          pressed && { backgroundColor: colors.primarySoft },
        ],
        (variant === 'ghost' || variant === 'ghostDanger') && [
          styles.ghost,
          pressed && {
            backgroundColor: variant === 'ghost' ? colors.primarySoft : colors.dangerSoft,
          },
        ],
        inactive && { opacity: 0.45 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={color} /> : null}
          <Text style={[styles.text, { color }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Round icon-only button (header actions, inline add). Always has an accessible label. */
export function IconButton({
  icon,
  label,
  onPress,
  tone = 'primary',
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'plain';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'primary' && { backgroundColor: colors.primary },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon
        name={icon}
        size={22}
        color={tone === 'primary' ? colors.primaryText : colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH + 4,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent', minHeight: MIN_TOUCH },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { fontSize: font.body, fontWeight: '600' },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Round icon with a caption underneath: a compact row of shortcuts (Call, WhatsApp…). */
export function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [quick.item, pressed && { opacity: 0.6 }]}
    >
      <View style={quick.circle}>
        <Icon name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={quick.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const quick = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 6, minHeight: MIN_TOUCH + 16 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
});
