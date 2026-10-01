import type { SQLiteDatabase } from 'expo-sqlite';
import type { Measurement, MeasurementValues } from '../../domain/types';
import { newId, nowISO } from '../../utils/id';

interface MeasurementRow {
  id: string;
  client_id: string;
  garment: string;
  values_json: string;
  notes: string;
  taken_at: string;
  created_at: string;
}

function parseValues(json: string): MeasurementValues {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)),
    ) as MeasurementValues;
  } catch {
    return {};
  }
}

const toMeasurement = (r: MeasurementRow): Measurement => ({
  id: r.id,
  clientId: r.client_id,
  garment: r.garment,
  values: parseValues(r.values_json),
  notes: r.notes,
  takenAt: r.taken_at,
  createdAt: r.created_at,
});

export type MeasurementInput = Pick<
  Measurement,
  'clientId' | 'garment' | 'values' | 'notes' | 'takenAt'
>;

export async function listMeasurements(
  db: SQLiteDatabase,
  clientId: string,
): Promise<Measurement[]> {
  const rows = await db.getAllAsync<MeasurementRow>(
    'SELECT * FROM measurements WHERE client_id = ? ORDER BY taken_at DESC, created_at DESC',
    clientId,
  );
  return rows.map(toMeasurement);
}

export async function getMeasurement(db: SQLiteDatabase, id: string): Promise<Measurement | null> {
  const row = await db.getFirstAsync<MeasurementRow>('SELECT * FROM measurements WHERE id = ?', id);
  return row ? toMeasurement(row) : null;
}

export async function createMeasurement(
  db: SQLiteDatabase,
  input: MeasurementInput,
): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO measurements (id, client_id, garment, values_json, notes, taken_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.clientId,
    input.garment,
    JSON.stringify(input.values),
    input.notes.trim(),
    input.takenAt,
    nowISO(),
  );
  return id;
}

export async function updateMeasurement(
  db: SQLiteDatabase,
  id: string,
  input: Omit<MeasurementInput, 'clientId'>,
): Promise<void> {
  await db.runAsync(
    'UPDATE measurements SET garment = ?, values_json = ?, notes = ?, taken_at = ? WHERE id = ?',
    input.garment,
    JSON.stringify(input.values),
    input.notes.trim(),
    input.takenAt,
    id,
  );
}

export async function deleteMeasurement(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM measurements WHERE id = ?', id);
}

/** Most recent measurement for a client and garment, used to pre-fill a new record. */
export async function latestMeasurement(
  db: SQLiteDatabase,
  clientId: string,
  garment: string,
): Promise<Measurement | null> {
  const row = await db.getFirstAsync<MeasurementRow>(
    `SELECT * FROM measurements WHERE client_id = ? AND garment = ?
     ORDER BY taken_at DESC, created_at DESC LIMIT 1`,
    clientId,
    garment,
  );
  return row ? toMeasurement(row) : null;
}
