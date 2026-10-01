import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Field, Screen } from '../../src/components/ui';
import { createSchool, getSchool, updateSchool } from '../../src/db/repositories/schools';

export default function SchoolFormScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSchool(db, id).then((s) => {
      if (!s) return;
      setName(s.name);
      setNotes(s.notes);
    });
  }, [db, id]);

  const save = async () => {
    if (!name.trim()) {
      setNameError('Please enter the school name');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updateSchool(db, id, { name, notes });
        router.back();
      } else {
        const newId = await createSchool(db, { name, notes });
        router.replace({ pathname: '/school/[id]', params: { id: newId } });
      }
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={<Button title="Save school" icon="checkmark" onPress={save} loading={saving} />}
    >
      <Stack.Screen options={{ title: id ? 'Edit school' : 'New school' }} />
      <Field
        label="School name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setNameError(undefined);
        }}
        error={nameError}
        autoCapitalize="words"
        autoFocus={!id}
      />
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Contact person, uniform colours, deadline…"
      />
    </Screen>
  );
}
