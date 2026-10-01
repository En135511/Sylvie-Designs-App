import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { garmentLabel } from '../domain/garments';
import type { Order } from '../domain/types';
import { useFlag } from '../features/flags/FeatureFlagsProvider';
import { colors, font, spacing } from '../theme';
import { daysUntil, describeDue, formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusBadge } from './StatusBadge';

export function OrderCard({
  order,
  clientName,
  currencySymbol,
}: {
  order: Order;
  clientName?: string;
  currencySymbol: string;
}) {
  const showPayments = useFlag('payments');
  const balance = order.priceMinor - order.depositMinor;
  const delivered = order.status === 'delivered';
  const overdue = !delivered && daysUntil(order.dueDate) < 0;
  const dueText = delivered ? `Due ${formatDate(order.dueDate)}` : describeDue(order.dueDate);

  return (
    <Card
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      accessibilityLabel={`${garmentLabel(order.garment)}${clientName ? ` for ${clientName}` : ''}, ${dueText}`}
    >
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={1}>
          {garmentLabel(order.garment)}
        </Text>
        <StatusBadge status={order.status} />
      </View>
      {clientName ? <Text style={styles.client}>{clientName}</Text> : null}
      <View style={styles.meta}>
        <Icon
          name={overdue ? 'alert-circle' : 'calendar-outline'}
          size={16}
          color={overdue ? colors.danger : colors.textMuted}
        />
        <Text style={[styles.metaText, overdue && { color: colors.danger, fontWeight: '700' }]}>
          {dueText}
        </Text>
        {showPayments && balance > 0 && !delivered ? (
          <Text style={styles.balance}>· Balance {formatMoney(balance, currencySymbol)}</Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: font.title, fontWeight: '700', color: colors.text },
  client: { fontSize: font.body, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  metaText: { fontSize: font.small, color: colors.textMuted },
  balance: { fontSize: font.small, color: colors.warning, fontWeight: '600' },
});
