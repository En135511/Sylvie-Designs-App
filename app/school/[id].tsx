import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import {
  createClass,
  deleteSchool,
  getSchool,
  listClassesForSchool,
} from '../../src/db/repositories/schools';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';

export default function SchoolDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const [className, setClassName] = useState('');
  const { data, loading } = useFocusQuery(
    async (d) => ({ school: await getSchool(d, id), classes: await listClassesForSchool(d, id) }),
    [id, version],
  );

  if (loading) {
    return (
      <Screen>
        <Text style={textStyles.muted}>Loading…</Text>
      </Screen>
    );
  }
  if (!data?.school) {
    return (
      <Screen>
        <EmptyState message="This school no longer exists." />
      </Screen>
    );
  }
  const { school, classes } = data;
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  const addClass = async () => {
    const name = className.trim();
    if (!name) return;
    const classId = await createClass(db, school.id, name);
    setClassName('');
    setVersion((v) => v + 1);
    router.push({ pathname: '/class/[id]', params: { id: classId } });
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete school?',
      `${school.name}, its ${classes.length} classes and ${totalStudents} students with all their measurements will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSchool(db, school.id);
            router.back();
          },
        },
      ],
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: school.name }} />
      {school.notes ? (
        <Card>
          <Text style={textStyles.body}>{school.notes}</Text>
        </Card>
      ) : null}

      <SectionHeader title="Classes" />
      {classes.length === 0 ? (
        <EmptyState message="No classes yet. Add the first one below." />
      ) : null}
      {classes.map((c) => (
        <Card
          key={c.id}
          onPress={() => router.push({ pathname: '/class/[id]', params: { id: c.id } })}
        >
          <Text style={textStyles.title}>{c.name}</Text>
          <Text style={textStyles.muted}>
            {c.studentCount} {c.studentCount === 1 ? 'student' : 'students'}
          </Text>
        </Card>
      ))}

      <Field
        label="Add a class"
        value={className}
        onChangeText={setClassName}
        placeholder="e.g. Class 4B, Form 2 East"
        onSubmitEditing={addClass}
      />
      <Button
        title="＋ Add class"
        variant="secondary"
        onPress={addClass}
        disabled={!className.trim()}
      />

      <Button
        title="Edit school"
        variant="secondary"
        onPress={() => router.push({ pathname: '/school/form', params: { id: school.id } })}
      />
      <Button title="Delete school" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
