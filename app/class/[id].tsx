import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  Field,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import {
  deleteClass,
  getClass,
  listStudents,
  nextUnmeasuredStudent,
} from '../../src/db/repositories/schools';
import { GARMENTS } from '../../src/domain/garments';
import { exportClassSheet } from '../../src/features/schools/exportSheet';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { useSettings } from '../../src/hooks/useSettings';
import { colors } from '../../src/theme';

export default function ClassDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { unit } = useSettings();
  const [garment, setGarment] = useState('shirt');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data, loading } = useFocusQuery(
    async (d) => ({ cls: await getClass(d, id), students: await listStudents(d, id, garment) }),
    [id, garment],
  );

  if (loading) {
    return (
      <Screen>
        <Text style={textStyles.muted}>Loading…</Text>
      </Screen>
    );
  }
  if (!data?.cls) {
    return (
      <Screen>
        <EmptyState message="This class no longer exists." />
      </Screen>
    );
  }
  const { cls, students } = data;
  const measured = students.filter((s) => s.measurementId !== null).length;
  const term = search.trim().toLowerCase();
  const shown = term ? students.filter((s) => s.name.toLowerCase().includes(term)) : students;

  const openStudent = (studentId: string, measurementId: string | null) =>
    router.push({
      pathname: '/measurement/form',
      params: {
        clientId: studentId,
        classId: cls.id,
        garment,
        ...(measurementId ? { id: measurementId } : {}),
      },
    });

  const measureNext = async () => {
    const next = await nextUnmeasuredStudent(db, cls.id, garment, '');
    if (!next) {
      Alert.alert('All done', 'Every student has been measured for this garment.');
      return;
    }
    openStudent(next.id, null);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      await exportClassSheet(db, {
        classId: cls.id,
        className: cls.name,
        schoolName: cls.schoolName,
        garment,
        unit,
      });
    } catch (e) {
      Alert.alert('Could not export', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete class?',
      `${cls.name} and its ${students.length} students with all their measurements will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteClass(db, cls.id);
            router.back();
          },
        },
      ],
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: `${cls.schoolName} · ${cls.name}` }} />

      <SectionHeader title="Garment to measure" />
      <ChipRow>
        {GARMENTS.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            selected={garment === g.key}
            onPress={() => setGarment(g.key)}
          />
        ))}
      </ChipRow>

      <Card>
        <Text style={textStyles.title}>
          {measured} of {students.length} measured
        </Text>
        <Text style={textStyles.muted}>
          {students.length - measured} still to do for this garment
        </Text>
      </Card>

      <Button title="Measure next student" onPress={measureNext} disabled={students.length === 0} />
      <Button
        title="＋ Add students (paste a list)"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: '/class/add-students', params: { classId: cls.id } })
        }
      />

      <SectionHeader title="Students" />
      {students.length > 8 ? (
        <Field label="Find a student" value={search} onChangeText={setSearch} />
      ) : null}
      {students.length === 0 ? (
        <EmptyState message="No students yet. Paste the class list to add them all at once." />
      ) : null}
      {shown.map((s) => (
        <Card key={s.id} onPress={() => openStudent(s.id, s.measurementId)}>
          <Text style={textStyles.body}>
            <Text style={{ color: s.measurementId ? colors.success : colors.textMuted }}>
              {s.measurementId ? '✓ ' : '○ '}
            </Text>
            {s.name}
          </Text>
        </Card>
      ))}

      <Button
        title="Export class sheet (CSV)"
        variant="secondary"
        onPress={onExport}
        loading={exporting}
        disabled={measured === 0}
      />
      <Button title="Delete class" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
