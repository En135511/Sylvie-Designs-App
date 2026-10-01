import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Linking, Text } from 'react-native';
import { StatusBadge } from '../../src/components/StatusBadge';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import { getClient } from '../../src/db/repositories/clients';
import { deleteOrder, getOrder, setOrderStatus } from '../../src/db/repositories/orders';
import { garmentLabel } from '../../src/domain/garments';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '../../src/domain/types';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors } from '../../src/theme';
import { describeDue, formatDate } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/money';
import { whatsappUrl } from '../../src/utils/phone';

export default function OrderDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currencySymbol } = useSettings();
  const [version, setVersion] = useState(0);
  const { data, loading } = useFocusQuery(
    async (d) => {
      const order = await getOrder(d, id);
      const client = order ? await getClient(d, order.clientId) : null;
      return { order, client };
    },
    [id, version],
  );

  if (loading)
    return (
      <Screen>
        <Text style={textStyles.muted}>Loading…</Text>
      </Screen>
    );
  if (!data?.order)
    return (
      <Screen>
        <EmptyState message="This order no longer exists." />
      </Screen>
    );
  const { order, client } = data;
  const balance = order.priceMinor - order.depositMinor;

  const changeStatus = async (status: OrderStatus) => {
    await setOrderStatus(db, order.id, status);
    setVersion((v) => v + 1);
  };

  const notifyReady = () => {
    const url = client?.phone
      ? whatsappUrl(
          client.phone,
          `Hello ${client.name}, your ${garmentLabel(order.garment).toLowerCase()} is ready for collection.`,
        )
      : null;
    if (!url) {
      Alert.alert('No phone number', 'Add a phone number to this client first.');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Could not open WhatsApp'));
  };

  const confirmDelete = () =>
    Alert.alert('Delete order?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteOrder(db, order.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: garmentLabel(order.garment) }} />
      <Card>
        <Text style={textStyles.title}>{garmentLabel(order.garment)}</Text>
        <Text
          style={textStyles.body}
          onPress={() => router.push({ pathname: '/client/[id]', params: { id: order.clientId } })}
        >
          {order.clientName}
        </Text>
        <StatusBadge status={order.status} />
        {order.description ? <Text style={textStyles.body}>{order.description}</Text> : null}
        <Text style={textStyles.muted}>
          {formatDate(order.dueDate)}
          {order.status !== 'delivered' ? ` · ${describeDue(order.dueDate)}` : ''}
        </Text>
      </Card>

      <Card>
        <Text style={textStyles.body}>Price: {formatMoney(order.priceMinor, currencySymbol)}</Text>
        <Text style={textStyles.body}>
          Deposit: {formatMoney(order.depositMinor, currencySymbol)}
        </Text>
        <Text style={[textStyles.title, { color: balance > 0 ? colors.warning : colors.success }]}>
          {balance > 0 ? `Balance due: ${formatMoney(balance, currencySymbol)}` : 'Fully paid'}
        </Text>
      </Card>

      <SectionHeader title="Progress" />
      <ChipRow>
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={STATUS_LABELS[s]}
            selected={order.status === s}
            onPress={() => changeStatus(s)}
          />
        ))}
      </ChipRow>

      {order.status === 'ready' ? (
        <Button title="Tell client it's ready (WhatsApp)" onPress={notifyReady} />
      ) : null}
      <Button
        title="Edit order"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: '/order/form',
            params: { clientId: order.clientId, id: order.id },
          })
        }
      />
      <Button title="Delete order" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
