import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Linking, Text, View } from 'react-native';
import { OrderCard } from '../../src/components/OrderCard';
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import { deleteClient, getClient } from '../../src/db/repositories/clients';
import { listMeasurements } from '../../src/db/repositories/measurements';
import { listOrdersForClient } from '../../src/db/repositories/orders';
import { garmentLabel } from '../../src/domain/garments';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors } from '../../src/theme';
import { formatDate } from '../../src/utils/dates';
import { telUrl, whatsappUrl } from '../../src/utils/phone';

export default function ClientDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currencySymbol } = useSettings();
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

  if (loading)
    return (
      <Screen>
        <Text style={textStyles.muted}>Loading…</Text>
      </Screen>
    );
  if (!data?.client)
    return (
      <Screen>
        <EmptyState message="This client no longer exists." />
      </Screen>
    );
  const { client, measurements, orders } = data;

  const open = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open', 'No app available to handle this.'),
    );
  };

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
      <Stack.Screen options={{ title: client.name }} />
      <Card>
        <Text style={textStyles.title}>{client.name}</Text>
        {client.phone ? <Text style={textStyles.body}>{client.phone}</Text> : null}
        {client.notes ? <Text style={textStyles.muted}>{client.notes}</Text> : null}
      </Card>

      {client.phone ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button title="Call" variant="secondary" onPress={() => open(telUrl(client.phone))} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="WhatsApp"
              variant="secondary"
              onPress={() => open(whatsappUrl(client.phone))}
            />
          </View>
        </View>
      ) : null}

      <SectionHeader
        title="Measurements"
        action={
          <LinkButton
            title="＋ Add"
            onPress={() =>
              router.push({ pathname: '/measurement/form', params: { clientId: client.id } })
            }
          />
        }
      />
      {measurements.length === 0 ? <EmptyState message="No measurements recorded yet." /> : null}
      {measurements.map((m) => (
        <Card
          key={m.id}
          onPress={() =>
            router.push({
              pathname: '/measurement/form',
              params: { clientId: client.id, id: m.id },
            })
          }
        >
          <Text style={textStyles.title}>{garmentLabel(m.garment)}</Text>
          <Text style={textStyles.muted}>
            {formatDate(m.takenAt)} · {Object.keys(m.values).length} measurements
          </Text>
        </Card>
      ))}

      <SectionHeader
        title="Orders"
        action={
          <LinkButton
            title="＋ Add"
            onPress={() =>
              router.push({ pathname: '/order/form', params: { clientId: client.id } })
            }
          />
        }
      />
      {orders.length === 0 ? <EmptyState message="No orders yet." /> : null}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} currencySymbol={currencySymbol} />
      ))}

      <View style={{ height: 12 }} />
      <Button
        title="Edit client"
        variant="secondary"
        onPress={() => router.push({ pathname: '/client/form', params: { id: client.id } })}
      />
      <Button title="Delete client" variant="danger" onPress={confirmDelete} />
      <Text style={[textStyles.muted, { color: colors.textMuted, textAlign: 'center' }]}>
        Added {formatDate(client.createdAt.slice(0, 10))}
      </Text>
    </Screen>
  );
}
