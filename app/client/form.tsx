import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Alert, type TextInput } from 'react-native';
import { Button, Field, Screen } from '../../src/components/ui';
import { createClient, getClient, updateClient } from '../../src/db/repositories/clients';

export default function ClientFormScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!id) return;
    getClient(db, id).then((c) => {
      if (!c) return;
      setName(c.name);
      setPhone(c.phone);
      setNotes(c.notes);
    });
  }, [db, id]);

  const save = async () => {
    if (!name.trim()) {
      setNameError('Please enter a name');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updateClient(db, id, { name, phone, notes });
        router.back();
      } else {
        const newId = await createClient(db, { name, phone, notes });
        router.replace({ pathname: '/client/[id]', params: { id: newId } });
      }
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={<Button title="Save client" icon="checkmark" onPress={save} loading={saving} />}
    >
      <Stack.Screen options={{ title: id ? 'Edit client' : 'New client' }} />
      <Field
        label="Name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setNameError(undefined);
        }}
        error={nameError}
        autoCapitalize="words"
        autoFocus={!id}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <Field
        ref={phoneRef}
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Optional"
      />
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Preferences, allergies to fabrics, how they heard of you…"
      />
    </Screen>
  );
}
