import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { DateField } from '../../src/components/DateField';
import { Button, Chip, ChipRow, Field, Screen, SectionHeader } from '../../src/components/ui';
import { createOrder, getOrder, updateOrder } from '../../src/db/repositories/orders';
import { GARMENTS } from '../../src/domain/garments';
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from '../../src/domain/types';
import { useSettings } from '../../src/hooks/useSettings';
import { addDays, todayISO } from '../../src/utils/dates';
import { minorToInput, parseMoney } from '../../src/utils/money';

export default function OrderFormScreen() {
  const db = useSQLiteContext();
  const { clientId, id } = useLocalSearchParams<{ clientId: string; id?: string }>();
  const { currencySymbol } = useSettings();

  const [garment, setGarment] = useState('shirt');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 7));
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [status, setStatus] = useState<OrderStatus>('new');
  const [errors, setErrors] = useState<{ price?: string; deposit?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOrder(db, id).then((o) => {
      if (!o) return;
      setGarment(o.garment);
      setDescription(o.description);
      setDueDate(o.dueDate);
      setPrice(minorToInput(o.priceMinor));
      setDeposit(minorToInput(o.depositMinor));
      setStatus(o.status);
    });
  }, [db, id]);

  const save = async () => {
    const priceMinor = price.trim() ? parseMoney(price) : 0;
    const depositMinor = deposit.trim() ? parseMoney(deposit) : 0;
    const next: typeof errors = {};
    if (priceMinor === null) next.price = 'Enter a valid amount';
    if (depositMinor === null) next.deposit = 'Enter a valid amount';
    if (priceMinor !== null && depositMinor !== null && depositMinor > priceMinor) {
      next.deposit = 'Deposit cannot be more than the price';
    }
    setErrors(next);
    if (priceMinor === null || depositMinor === null || Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      if (id) {
        await updateOrder(db, id, {
          garment,
          description,
          dueDate,
          priceMinor,
          depositMinor,
          status,
        });
      } else {
        await createOrder(db, {
          clientId,
          garment,
          description,
          dueDate,
          priceMinor,
          depositMinor,
          status,
        });
      }
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? 'Edit order' : 'New order' }} />
      <SectionHeader title="Garment" />
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
      <Field
        label="Details"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Fabric, style, buttons, lining…"
      />
      <DateField label="Due date" value={dueDate} onChange={setDueDate} />
      <Field
        label={`Price (${currencySymbol})`}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        error={errors.price}
      />
      <Field
        label={`Deposit paid (${currencySymbol})`}
        value={deposit}
        onChangeText={setDeposit}
        keyboardType="decimal-pad"
        error={errors.deposit}
      />
      <SectionHeader title="Status" />
      <ChipRow>
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={STATUS_LABELS[s]}
            selected={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </ChipRow>
      <Button title="Save" onPress={save} loading={saving} />
    </Screen>
  );
}
