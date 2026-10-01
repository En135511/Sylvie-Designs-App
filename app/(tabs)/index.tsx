import { router } from 'expo-router';
import { useState } from 'react';
import {
  EmptyState,
  ErrorNote,
  ListRow,
  LoadingView,
  Screen,
  SearchBar,
} from '../../src/components/ui';
import { listClients } from '../../src/db/repositories/clients';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const hideStudents = useFlag('schools');
  const {
    data: clients,
    loading,
    error,
  } = useFocusQuery((db) => listClients(db, search, hideStudents), [search, hideStudents]);
  const addClient = () => router.push('/client/form');

  return (
    <Screen fab={{ icon: 'add', label: 'New client', onPress: addClient }}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name or phone" />
      {error ? <ErrorNote message={`Could not load clients: ${error.message}`} /> : null}
      {loading && !clients ? <LoadingView /> : null}
      {!loading && clients?.length === 0 ? (
        search ? (
          <EmptyState icon="search" title="No matches" message="No clients match your search." />
        ) : (
          <EmptyState
            icon="people-outline"
            title="No clients yet"
            message="Add your first client to start recording measurements."
            actionLabel="Add client"
            onAction={addClient}
          />
        )
      ) : null}
      {clients?.map((c) => (
        <ListRow
          key={c.id}
          title={c.name}
          subtitle={c.phone || undefined}
          avatarName={c.name}
          onPress={() => router.push({ pathname: '/client/[id]', params: { id: c.id } })}
        />
      ))}
    </Screen>
  );
}
