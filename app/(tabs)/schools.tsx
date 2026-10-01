import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, EmptyState, Screen, textStyles } from '../../src/components/ui';
import { listSchools } from '../../src/db/repositories/schools';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { colors } from '../../src/theme';

export default function SchoolsScreen() {
  const { data: schools, loading, error } = useFocusQuery(listSchools, []);

  return (
    <Screen>
      <Button title="＋ New school" onPress={() => router.push('/school/form')} />
      {error ? (
        <Text style={{ color: colors.danger }}>Could not load schools: {error.message}</Text>
      ) : null}
      {!loading && schools?.length === 0 ? (
        <EmptyState message="No schools yet. Add a school, then its classes and students." />
      ) : null}
      {schools?.map((s) => (
        <Card
          key={s.id}
          onPress={() => router.push({ pathname: '/school/[id]', params: { id: s.id } })}
        >
          <Text style={textStyles.title}>{s.name}</Text>
          <Text style={textStyles.muted}>
            {s.classCount} {s.classCount === 1 ? 'class' : 'classes'} · {s.studentCount}{' '}
            {s.studentCount === 1 ? 'student' : 'students'}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
