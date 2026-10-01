import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  ListRow,
  LoadingView,
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
import { spacing } from '../../src/theme';

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
      <Screen scroll={false}>
        <LoadingView />
      </Screen>
    );
  }
  if (!data?.school) {
    return (
      <Screen>
        <EmptyState icon="school-outline" message="This school no longer exists." />
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
      <Stack.Screen
        options={{
          title: school.name,
          headerRight: () => (
            <IconButton
              icon="create-outline"
              label="Edit school"
              tone="plain"
              onPress={() => router.push({ pathname: '/school/form', params: { id: school.id } })}
            />
          ),
        }}
      />
      {school.notes ? (
        <Card>
          <Text style={textStyles.body}>{school.notes}</Text>
        </Card>
      ) : null}

      <SectionHeader title="Classes" />
      {classes.length === 0 ? (
        <Text style={textStyles.muted}>No classes yet. Add the first one below.</Text>
      ) : null}
      {classes.map((c) => (
        <ListRow
          key={c.id}
          icon="people"
          title={c.name}
          subtitle={`${c.studentCount} ${c.studentCount === 1 ? 'student' : 'students'}`}
          onPress={() => router.push({ pathname: '/class/[id]', params: { id: c.id } })}
        />
      ))}

      <View style={styles.add}>
        <View style={{ flex: 1 }}>
          <Field
            label="Add a class"
            value={className}
            onChangeText={setClassName}
            placeholder="e.g. Class 4B, Form 2 East"
            onSubmitEditing={addClass}
            returnKeyType="done"
          />
        </View>
        <IconButton icon="add" label="Add class" onPress={addClass} disabled={!className.trim()} />
      </View>

      <View style={styles.danger}>
        <Button
          title="Delete school"
          icon="trash-outline"
          variant="ghostDanger"
          onPress={confirmDelete}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  danger: { marginTop: spacing.xl, alignItems: 'center' },
});
