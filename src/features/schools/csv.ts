import { fieldLabel } from '../../domain/garments';
import type { MeasurementValues, Unit } from '../../domain/types';
import { cmToDisplay } from '../../utils/units';

export interface SheetRow {
  name: string;
  values: MeasurementValues | null;
  notes: string;
}

function cell(text: string): string {
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Builds a class measurement sheet as CSV (opens in Excel / Google Sheets). Columns are the
 * measurements that at least one student has, in the order given by `fieldOrder`.
 */
export function buildClassCsv(rows: SheetRow[], fieldOrder: string[], unit: Unit): string {
  const used = new Set(rows.flatMap((r) => Object.keys(r.values ?? {})));
  const ordered = [
    ...fieldOrder.filter((k) => used.has(k)),
    ...[...used].filter((k) => !fieldOrder.includes(k)),
  ];

  const header = ['Student', ...ordered.map((k) => `${fieldLabel(k)} (${unit})`), 'Notes'];
  const lines = [header.map(cell).join(',')];
  for (const row of rows) {
    const values = ordered.map((k) => {
      const v = row.values?.[k];
      return v === undefined ? '' : String(cmToDisplay(v, unit));
    });
    lines.push([row.name, ...values, row.notes].map(cell).join(','));
  }
  return lines.join('\r\n');
}
