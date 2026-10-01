import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { garmentLabel } from '../domain/garments';
import type { Order } from '../domain/types';
import { colors, spacing } from '../theme';
import { daysUntil, describeDue } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { StatusBadge } from './StatusBadge';
import { Card, textStyles } from './ui';

export function OrderCard({
  order,
  clientName,
  currencySymbol,
}: {
  order: Order;
  clientName?: string;
  currencySymbol: string;
}) {
  const balance = order.priceMinor - order.depositMinor;
  const overdue = order.status !== 'delivered' && daysUntil(order.dueDate) < 0;
  return (
    <Card onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}>
      <View style={styles.row}>
        <Text style={textStyles.title}>{garmentLabel(order.garment)}</Text>
        <StatusBadge status={order.status} />
      </View>
      {clientName ? <Text style={textStyles.body}>{clientName}</Text> : null}
      <Text style={[textStyles.muted, overdue && { color: colors.danger, fontWeight: '700' }]}>
        {order.status === 'delivered' ? `Due ${order.dueDate}` : describeDue(order.dueDate)}
      </Text>
      {balance > 0 && order.status !== 'delivered' ? (
        <Text style={textStyles.muted}>Balance: {formatMoney(balance, currencySymbol)}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
