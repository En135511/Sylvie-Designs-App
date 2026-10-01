import { useState } from 'react';
import { Text } from 'react-native';
import { OrderCard } from '../../src/components/OrderCard';
import { Chip, ChipRow, EmptyState, Screen } from '../../src/components/ui';
import { listAllOrders } from '../../src/db/repositories/orders';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '../../src/domain/types';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors } from '../../src/theme';

type Filter = 'active' | OrderStatus;

export default function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>('active');
  const { data: orders = [], error } = useFocusQuery(listAllOrders, []);
  const { currencySymbol } = useSettings();

  const shown = orders.filter((o) =>
    filter === 'active' ? o.status !== 'delivered' : o.status === filter,
  );

  return (
    <Screen>
      <ChipRow>
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={STATUS_LABELS[s]}
            selected={filter === s}
            onPress={() => setFilter(s)}
          />
        ))}
      </ChipRow>
      {error ? (
        <Text style={{ color: colors.danger }}>Could not load orders: {error.message}</Text>
      ) : null}
      {shown.length === 0 ? <EmptyState message="No orders here." /> : null}
      {shown.map((o) => (
        <OrderCard key={o.id} order={o} clientName={o.clientName} currencySymbol={currencySymbol} />
      ))}
    </Screen>
  );
}
