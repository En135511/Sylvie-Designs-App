import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { listClassSheet } from '../../db/repositories/schools';
import { MEASUREMENT_FIELDS, garmentLabel } from '../../domain/garments';
import type { MeasurementValues, Unit } from '../../domain/types';
import { buildClassCsv } from './csv';

function parseValues(json: string | null): MeasurementValues | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as MeasurementValues;
  } catch {
    return null;
  }
}

/** Writes a CSV measurement sheet for one class and garment, then opens the share sheet. */
export async function exportClassSheet(
  db: SQLiteDatabase,
  opts: { classId: string; className: string; schoolName: string; garment: string; unit: Unit },
): Promise<void> {
  const source = await listClassSheet(db, opts.classId, opts.garment);
  const csv = buildClassCsv(
    source.map((r) => ({ name: r.name, values: parseValues(r.valuesJson), notes: r.notes })),
    MEASUREMENT_FIELDS.map((f) => f.key),
    opts.unit,
  );

  const safe = `${opts.schoolName}-${opts.className}-${garmentLabel(opts.garment)}`
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');
  const file = new File(Paths.cache, `${safe}.csv`);
  if (file.exists) file.delete();
  file.create();
  // A BOM makes Excel open UTF-8 names (accents etc.) correctly.
  file.write(`﻿${csv}`);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Share class sheet' });
}
