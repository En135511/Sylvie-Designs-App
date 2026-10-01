import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, EmptyState, Field, Screen, textStyles } from '../../src/components/ui';
import { listClients } from '../../src/db/repositories/clients';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { colors } from '../../src/theme';

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const {
    data: clients,
    loading,
    error,
  } = useFocusQuery((db) => listClients(db, search), [search]);

  return (
    <Screen>
      <Field label="Search" value={search} onChangeText={setSearch} placeholder="Name or phone" />
      <Button title="＋ New client" onPress={() => router.push('/client/form')} />
      {error ? (
        <Text style={{ color: colors.danger }}>Could not load clients: {error.message}</Text>
      ) : null}
      {!loading && clients?.length === 0 ? (
        <EmptyState
          message={search ? 'No clients match your search.' : 'No clients yet. Add your first one!'}
        />
      ) : null}
      {clients?.map((c) => (
        <Card
          key={c.id}
          onPress={() => router.push({ pathname: '/client/[id]', params: { id: c.id } })}
        >
          <Text style={textStyles.title}>{c.name}</Text>
          {c.phone ? <Text style={textStyles.muted}>{c.phone}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}
