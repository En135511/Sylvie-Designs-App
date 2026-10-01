import { StyleSheet, Text, View } from 'react-native';
import { OrderCard } from '../../src/components/OrderCard';
import {
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  LoadingView,
  Screen,
  SectionHeader,
  textStyles,
  type IconName,
} from '../../src/components/ui';
import { listActiveOrders } from '../../src/db/repositories/orders';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors, font, spacing } from '../../src/theme';
import { daysUntil } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/money';

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={textStyles.muted}>{label}</Text>
    </Card>
  );
}

export default function TodayScreen() {
  const { data: orders, loading, error } = useFocusQuery(listActiveOrders, []);
  const { currencySymbol } = useSettings();
  const showPayments = useFlag('payments');

  const active = orders ?? [];
  const overdue = active.filter((o) => daysUntil(o.dueDate) < 0);
  const dueSoon = active.filter((o) => {
    const d = daysUntil(o.dueDate);
    return d >= 0 && d <= 7;
  });
  const outstanding = active.reduce(
    (sum, o) => sum + Math.max(0, o.priceMinor - o.depositMinor),
    0,
  );

  return (
    <Screen>
      {error ? <ErrorNote message={`Could not load orders: ${error.message}`} /> : null}
      {loading && !orders ? <LoadingView /> : null}

      <View style={styles.stats}>
        <Stat icon="shirt-outline" label="Active orders" value={String(active.length)} />
        {showPayments ? (
          <Stat
            icon="cash-outline"
            label="Still to collect"
            value={formatMoney(outstanding, currencySymbol)}
          />
        ) : (
          <Stat icon="alert-circle-outline" label="Overdue" value={String(overdue.length)} />
        )}
      </View>

      {overdue.length > 0 ? (
        <>
          <SectionHeader title={`Overdue · ${overdue.length}`} />
          {overdue.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              clientName={o.clientName}
              currencySymbol={currencySymbol}
            />
          ))}
        </>
      ) : null}

      <SectionHeader title="Due in the next 7 days" />
      {dueSoon.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="All clear"
          message="Nothing is due this week."
        />
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
  stat: { flex: 1, gap: spacing.xs },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { fontSize: font.display - 4, fontWeight: '800', color: colors.text },
});
