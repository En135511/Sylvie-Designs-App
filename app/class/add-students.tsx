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
    <Screen
      footer={
        <Button
          title={
            names.length
              ? `Add ${names.length} ${names.length === 1 ? 'student' : 'students'}`
              : 'Add students'
          }
          icon="person-add"
          onPress={save}
          disabled={names.length === 0}
          loading={saving}
        />
      }
    >
      <Stack.Screen options={{ title: 'Add students' }} />
      <Field
        label="Paste the class list"
        hint="One name per line. Numbering, blank lines and duplicates are cleaned up for you."
        value={text}
        onChangeText={setText}
        multiline
        autoCapitalize="words"
        autoFocus
        placeholder={'Amina Wanjiru\nJohn Otieno\nMary Achieng'}
        style={{ minHeight: 240 }}
      />
    </Screen>
  );
}
