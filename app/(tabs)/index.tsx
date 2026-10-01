import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { OrderCard } from '../../src/components/OrderCard';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import { listActiveOrders } from '../../src/db/repositories/orders';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors, spacing } from '../../src/theme';
import { daysUntil } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/money';

export default function TodayScreen() {
  const { data: orders = [], error } = useFocusQuery(listActiveOrders, []);
  const { currencySymbol } = useSettings();

  const overdue = orders.filter((o) => daysUntil(o.dueDate) < 0);
  const dueSoon = orders.filter((o) => {
    const d = daysUntil(o.dueDate);
    return d >= 0 && d <= 7;
  });
  const outstanding = orders.reduce(
    (sum, o) => sum + Math.max(0, o.priceMinor - o.depositMinor),
    0,
  );

  return (
    <Screen>
      {error ? (
        <Text style={{ color: colors.danger }}>Could not load orders: {error.message}</Text>
      ) : null}

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={textStyles.muted}>Active orders</Text>
          <Text style={styles.statValue}>{orders.length}</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={textStyles.muted}>Still to collect</Text>
          <Text style={styles.statValue}>{formatMoney(outstanding, currencySymbol)}</Text>
        </Card>
      </View>

      <Button title="＋ New client" onPress={() => router.push('/client/form')} />

      {overdue.length > 0 && (
        <>
          <SectionHeader title={`Overdue (${overdue.length})`} />
          {overdue.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              clientName={o.clientName}
              currencySymbol={currencySymbol}
            />
          ))}
        </>
      )}

      <SectionHeader title="Due in the next 7 days" />
      {dueSoon.length === 0 ? (
        <EmptyState message="Nothing due this week." />
      ) : (
        dueSoon.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            clientName={o.clientName}
            currencySymbol={currencySymbol}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
});
