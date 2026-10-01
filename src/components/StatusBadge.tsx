import { StyleSheet, Text, View } from 'react-native';
import { STATUS_LABELS, type OrderStatus } from '../domain/types';
import { colors, font, radius, spacing } from '../theme';

const TONES: Record<OrderStatus, { bg: string; fg: string }> = {
  new: { bg: colors.neutralSoft, fg: colors.textMuted },
  cutting: { bg: colors.warningSoft, fg: colors.warning },
  sewing: { bg: colors.warningSoft, fg: colors.warning },
  fitting: { bg: colors.primarySoft, fg: colors.primary },
  ready: { bg: colors.successSoft, fg: colors.success },
  delivered: { bg: colors.neutralSoft, fg: colors.textMuted },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { bg, fg } = TONES[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.text, { color: fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: font.small, fontWeight: '700' },
});
