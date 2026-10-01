import { useState } from 'react';
import { OrderCard } from '../../src/components/OrderCard';
import {
  Chip,
  ChipScroller,
  EmptyState,
  ErrorNote,
  LoadingView,
  Screen,
} from '../../src/components/ui';
import { listAllOrders } from '../../src/db/repositories/orders';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '../../src/domain/types';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';

type Filter = 'active' | OrderStatus;

export default function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>('active');
  const { data: orders, loading, error } = useFocusQuery(listAllOrders, []);
  const { currencySymbol } = useSettings();

  const shown = (orders ?? []).filter((o) =>
    filter === 'active' ? o.status !== 'delivered' : o.status === filter,
  );

  return (
    <Screen>
      <ChipScroller>
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={STATUS_LABELS[s]}
            selected={filter === s}
            onPress={() => setFilter(s)}
          />
        ))}
      </ChipScroller>
      {error ? <ErrorNote message={`Could not load orders: ${error.message}`} /> : null}
      {loading && !orders ? <LoadingView /> : null}
      {!loading && shown.length === 0 ? (
        <EmptyState
          icon="shirt-outline"
          title="No orders here"
          message={
            filter === 'active'
              ? 'Orders you add to a client will show up here.'
              : 'Nothing at this stage right now.'
          }
        />
      ) : null}
      {shown.map((o) => (
        <OrderCard key={o.id} order={o} clientName={o.clientName} currencySymbol={currencySymbol} />
      ))}
    </Screen>
  );
}
