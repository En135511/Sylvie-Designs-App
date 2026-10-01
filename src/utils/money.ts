import { parseNumber } from './units';

/** Parses an amount like "12.50" into minor units (1250). Returns null if invalid. */
export function parseMoney(input: string): number | null {
  const n = parseNumber(input);
  return n === null ? null : Math.round(n * 100);
}

export function formatMoney(minor: number, symbol: string): string {
  const major = minor / 100;
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${symbol}${text.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function minorToInput(minor: number): string {
  if (minor === 0) return '';
  const major = minor / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}
