import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MIN_TOUCH, shadow, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

const FAB_SIZE = 58;

export function Screen({
  children,
  scroll = true,
  footer,
  fab,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Fixed bar pinned above the keyboard / bottom edge, e.g. the Save button of a form. */
  footer?: ReactNode;
  /** Floating primary action in the bottom-right corner. */
  fab?: { icon: IconName; label: string; onPress: () => void };
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = fab ? FAB_SIZE + spacing.xl * 2 : spacing.xl + (footer ? 0 : insets.bottom);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { paddingBottom: bottomPad }]}>{children}</View>
      )}

      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {footer}
        </View>
      ) : null}

      {fab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fab.label}
          onPress={fab.onPress}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
          ]}
        >
          <Icon name={fab.icon} size={28} color={colors.primaryText} />
        </Pressable>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    minHeight: MIN_TOUCH,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.raised,
  },
});
