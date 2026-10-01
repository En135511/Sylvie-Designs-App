import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { OrderCard } from '../../src/components/OrderCard';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  IconButton,
  ListRow,
  LoadingView,
  QuickAction,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import { deleteClient, getClient } from '../../src/db/repositories/clients';
import { listMeasurements } from '../../src/db/repositories/measurements';
import { listOrdersForClient } from '../../src/db/repositories/orders';
import { garmentLabel } from '../../src/domain/garments';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors, font, radius, spacing } from '../../src/theme';
import { formatDate } from '../../src/utils/dates';
import { telUrl, whatsappUrl } from '../../src/utils/phone';

export default function ClientDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currencySymbol } = useSettings();
  const showOrders = useFlag('orders');
  const showContact = useFlag('contact');
  const { data, loading } = useFocusQuery(
    async (d) => {
      const [client, measurements, orders] = await Promise.all([
        getClient(d, id),
        listMeasurements(d, id),
        listOrdersForClient(d, id),
      ]);
      return { client, measurements, orders };
    },
    [id],
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingView />
      </Screen>
    );
  }
  if (!data?.client) {
    return (
      <Screen>
        <EmptyState icon="person-outline" message="This client no longer exists." />
      </Screen>
    );
  }
  const { client, measurements, orders } = data;

  const open = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open', 'No app is available to handle this.'),
    );
  };
  const addMeasurement = () =>
    router.push({ pathname: '/measurement/form', params: { clientId: client.id } });
  const addOrder = () => router.push({ pathname: '/order/form', params: { clientId: client.id } });

  const confirmDelete = () =>
    Alert.alert(
      'Delete client?',
      `${client.name} and all their measurements and orders will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteClient(db, client.id);
            router.back();
          },
        },
      ],
    );

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Edit client"
              tone="plain"
              onPress={() => router.push({ pathname: '/client/form', params: { id: client.id } })}
            />
          ),
        }}
      />

      <Card style={styles.header}>
        <Avatar name={client.name} size={64} />
        <Text style={styles.name}>{client.name}</Text>
        {client.phone ? <Text style={textStyles.muted}>{client.phone}</Text> : null}
        {client.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{client.notes}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <QuickAction icon="resize-outline" label="Measure" onPress={addMeasurement} />
        {showOrders ? <QuickAction icon="shirt-outline" label="Order" onPress={addOrder} /> : null}
        {showContact && client.phone ? (
          <>
            <QuickAction
              icon="call-outline"
              label="Call"
              onPress={() => open(telUrl(client.phone))}
            />
            <QuickAction
              icon="logo-whatsapp"
              label="WhatsApp"
              onPress={() => open(whatsappUrl(client.phone))}
            />
          </>
        ) : null}
      </View>

      <SectionHeader title="Measurements" />
      {measurements.length === 0 ? (
        <Text style={textStyles.muted}>No measurements recorded yet. Tap Measure to add some.</Text>
      ) : null}
      {measurements.map((m) => (
        <ListRow
          key={m.id}
          icon="resize"
          title={garmentLabel(m.garment)}
          subtitle={`${formatDate(m.takenAt)} · ${Object.keys(m.values).length} measurements${m.notes ? ` · ${m.notes}` : ''}`}
          onPress={() =>
            router.push({
              pathname: '/measurement/form',
              params: { clientId: client.id, id: m.id },
            })
          }
        />
      ))}

      {showOrders ? (
        <>
          <SectionHeader title="Orders" />
          {orders.length === 0 ? <Text style={textStyles.muted}>No orders yet.</Text> : null}
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} currencySymbol={currencySymbol} />
          ))}
        </>
      ) : null}

      <View style={styles.danger}>
        <Button
          title="Delete client"
          icon="trash-outline"
          variant="ghostDanger"
          onPress={confirmDelete}
        />
        <Text style={styles.added}>Added {formatDate(client.createdAt.slice(0, 10))}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  name: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  notes: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  notesText: { fontSize: font.small + 1, color: colors.text, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  danger: { marginTop: spacing.xl, alignItems: 'center', gap: spacing.xs },
  added: { fontSize: font.caption, color: colors.textMuted },
});
