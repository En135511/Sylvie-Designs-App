import { StyleSheet, Text, View } from 'react-native';
import { STATUS_LABELS, type OrderStatus } from '../domain/types';
import { colors, font, radius, spacing } from '../theme';

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: colors.textMuted,
  cutting: colors.warning,
  sewing: colors.warning,
  fitting: colors.primary,
  ready: colors.success,
  delivered: colors.textMuted,
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.text}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  text: { color: colors.primaryText, fontSize: font.small, fontWeight: '600' },
});
