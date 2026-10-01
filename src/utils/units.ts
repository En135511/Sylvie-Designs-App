import type { Unit } from '../domain/types';

const CM_PER_INCH = 2.54;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function cmToDisplay(cm: number, unit: Unit): number {
  return unit === 'cm' ? round1(cm) : round1(cm / CM_PER_INCH);
}

/** Converts a value entered in `unit` to centimetres (rounded to 0.1 cm). */
export function toCm(value: number, unit: Unit): number {
  return unit === 'cm' ? round1(value) : round1(value * CM_PER_INCH);
}

/**
 * Parses user input such as "38", "38.5" or "38,5" (comma decimals are common on phones).
 * Returns null for empty or invalid input.
 */
export function parseNumber(input: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (trimmed === '') return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function formatMeasurement(cm: number, unit: Unit): string {
  return `${cmToDisplay(cm, unit)} ${unit === 'cm' ? 'cm' : 'in'}`;
}
