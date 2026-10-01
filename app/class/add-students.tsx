import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Field, Screen } from '../../src/components/ui';
import { addStudents } from '../../src/db/repositories/schools';
import { parseNames } from '../../src/features/schools/names';

export default function AddStudentsScreen() {
  const db = useSQLiteContext();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const names = useMemo(() => parseNames(text), [text]);

  const save = async () => {
    setSaving(true);
    try {
      await addStudents(db, classId, names);
      router.back();
    } catch (e) {
      Alert.alert('Could not add students', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Add students' }} />
      <Field
        label="Student names (one per line, or paste a whole class list)"
        value={text}
        onChangeText={setText}
        multiline
        autoCapitalize="words"
        placeholder={'Amina Wanjiru\nJohn Otieno\nMary Achieng'}
        style={{ minHeight: 220 }}
      />
      <Button
        title={names.length ? `Add ${names.length} students` : 'Add students'}
        onPress={save}
        disabled={names.length === 0}
        loading={saving}
      />
    </Screen>
  );
}
