import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '../../src/components/StatusBadge';
import {
  Button,
  Card,
  Chip,
  ChipScroller,
  EmptyState,
  Icon,
  IconButton,
  ListRow,
  LoadingView,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import { getClient } from '../../src/db/repositories/clients';
import { deleteOrder, getOrder, setOrderStatus } from '../../src/db/repositories/orders';
import { garmentLabel } from '../../src/domain/garments';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '../../src/domain/types';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors, font, spacing } from '../../src/theme';
import { describeDue, formatDate } from '../../src/utils/dates';
import { formatMoney } from '../../src/utils/money';
import { whatsappUrl } from '../../src/utils/phone';

export default function OrderDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currencySymbol } = useSettings();
  const showPayments = useFlag('payments');
  const showContact = useFlag('contact');
  const [version, setVersion] = useState(0);
  const { data, loading } = useFocusQuery(
    async (d) => {
      const order = await getOrder(d, id);
      const client = order ? await getClient(d, order.clientId) : null;
      return { order, client };
    },
    [id, version],
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingView />
      </Screen>
    );
  }
  if (!data?.order) {
    return (
      <Screen>
        <EmptyState icon="shirt-outline" message="This order no longer exists." />
      </Screen>
    );
  }
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
      <Stack.Screen
        options={{
          title: 'Order',
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Edit order"
              tone="plain"
              onPress={() =>
                router.push({
                  pathname: '/order/form',
                  params: { clientId: order.clientId, id: order.id },
                })
              }
            />
          ),
        }}
      />
      <Card>
        <View style={styles.top}>
          <Text style={styles.garment}>{garmentLabel(order.garment)}</Text>
          <StatusBadge status={order.status} />
        </View>
        {order.description ? <Text style={textStyles.body}>{order.description}</Text> : null}
        <View style={styles.due}>
          <Icon name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={textStyles.muted}>
            {formatDate(order.dueDate)}
            {order.status !== 'delivered' ? ` · ${describeDue(order.dueDate)}` : ''}
          </Text>
        </View>
      </Card>

      <ListRow
        title={order.clientName}
        subtitle="View client"
        avatarName={order.clientName}
        onPress={() => router.push({ pathname: '/client/[id]', params: { id: order.clientId } })}
      />

      {showPayments ? (
        <Card style={{ gap: spacing.sm }}>
          <View style={styles.line}>
            <Text style={textStyles.body}>Price</Text>
            <Text style={textStyles.body}>{formatMoney(order.priceMinor, currencySymbol)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={textStyles.body}>Deposit paid</Text>
            <Text style={textStyles.body}>{formatMoney(order.depositMinor, currencySymbol)}</Text>
          </View>
          <View style={[styles.line, styles.balanceLine]}>
            <Text style={styles.balanceLabel}>{balance > 0 ? 'Balance due' : 'Fully paid'}</Text>
            {balance > 0 ? (
              <Text style={[styles.balanceLabel, { color: colors.warning }]}>
                {formatMoney(balance, currencySymbol)}
              </Text>
            ) : (
              <Icon name="checkmark-circle" size={24} color={colors.success} />
            )}
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Progress" />
      <ChipScroller>
        {ORDER_STATUSES.map((st) => (
          <Chip
            key={st}
            label={STATUS_LABELS[st]}
            selected={order.status === st}
            onPress={() => changeStatus(st)}
          />
        ))}
      </ChipScroller>

      {showContact && order.status === 'ready' ? (
        <Button title="Tell client it's ready" icon="logo-whatsapp" onPress={notifyReady} />
      ) : null}

      <View style={styles.danger}>
        <Button
          title="Delete order"
          icon="trash-outline"
          variant="ghostDanger"
          onPress={confirmDelete}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  garment: { flex: 1, fontSize: font.heading, fontWeight: '800', color: colors.text },
  due: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  balanceLabel: { fontSize: font.title, fontWeight: '700', color: colors.text },
  danger: { marginTop: spacing.xl, alignItems: 'center' },
});
