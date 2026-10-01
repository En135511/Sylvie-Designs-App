import { router } from 'expo-router';
import { EmptyState, ErrorNote, ListRow, LoadingView, Screen } from '../../src/components/ui';
import { listSchools } from '../../src/db/repositories/schools';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';

export default function SchoolsScreen() {
  const { data: schools, loading, error } = useFocusQuery(listSchools, []);
  const addSchool = () => router.push('/school/form');

  return (
    <Screen fab={{ icon: 'add', label: 'New school', onPress: addSchool }}>
      {error ? <ErrorNote message={`Could not load schools: ${error.message}`} /> : null}
      {loading && !schools ? <LoadingView /> : null}
      {!loading && schools?.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="No schools yet"
          message="Add a school, then its classes and students."
          actionLabel="Add school"
          onAction={addSchool}
        />
      ) : null}
      {schools?.map((s) => (
        <ListRow
          key={s.id}
          title={s.name}
          icon="school"
          subtitle={`${s.classCount} ${s.classCount === 1 ? 'class' : 'classes'} · ${s.studentCount} ${s.studentCount === 1 ? 'student' : 'students'}`}
          onPress={() => router.push({ pathname: '/school/[id]', params: { id: s.id } })}
        />
      ))}
    </Screen>
  );
}
