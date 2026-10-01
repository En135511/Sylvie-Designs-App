import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
  SearchBar,
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
import { colors, font, radius, spacing } from '../../src/theme';

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
      <Screen scroll={false}>
        <LoadingView />
      </Screen>
    );
  }
  if (!data?.cls) {
    return (
      <Screen>
        <EmptyState icon="people-outline" message="This class no longer exists." />
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

  const percent = students.length ? Math.round((measured / students.length) * 100) : 0;
  const addStudentsRoute = () =>
    router.push({ pathname: '/class/add-students', params: { classId: cls.id } });

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: cls.name,
          headerRight: () => (
            <IconButton
              icon="trash-outline"
              label="Delete class"
              tone="plain"
              onPress={confirmDelete}
            />
          ),
        }}
      />
      <Text style={styles.school}>{cls.schoolName}</Text>

      <SectionHeader title="Garment to measure" />
      <ChipScroller>
        {GARMENTS.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            selected={garment === g.key}
            onPress={() => setGarment(g.key)}
          />
        ))}
      </ChipScroller>

      <Card style={{ gap: spacing.sm }}>
        <View style={styles.progressTop}>
          <Text style={textStyles.title}>
            {measured} of {students.length} measured
          </Text>
          <Text style={styles.percent}>{percent}%</Text>
        </View>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: students.length, now: measured }}
        >
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <Text style={textStyles.muted}>
          {students.length - measured} still to do for this garment
        </Text>
      </Card>

      <Button
        title="Measure next student"
        icon="arrow-forward"
        onPress={measureNext}
        disabled={students.length === 0}
      />
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <Button
            title="Add students"
            icon="person-add-outline"
            variant="secondary"
            onPress={addStudentsRoute}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Export sheet"
            icon="download-outline"
            variant="secondary"
            onPress={onExport}
            loading={exporting}
            disabled={measured === 0}
          />
        </View>
      </View>

      <SectionHeader title={`Students · ${students.length}`} />
      {students.length > 8 ? (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Find a student" />
      ) : null}
      {students.length === 0 ? (
        <EmptyState
          icon="person-add-outline"
          title="No students yet"
          message="Paste the class list to add every student at once."
          actionLabel="Add students"
          onAction={addStudentsRoute}
        />
      ) : null}
      {shown.map((st) => (
        <ListRow
          key={st.id}
          title={st.name}
          avatarName={st.name}
          subtitle={st.measurementId ? 'Measured' : 'Not measured yet'}
          chevron={false}
          trailing={
            <Icon
              name={st.measurementId ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={st.measurementId ? colors.success : colors.textMuted}
            />
          }
          onPress={() => openStudent(st.id, st.measurementId)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  school: { fontSize: font.body, color: colors.textMuted, marginTop: -spacing.xs },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  percent: { fontSize: font.title, fontWeight: '800', color: colors.primary },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
  pair: { flexDirection: 'row', gap: spacing.md },
});
