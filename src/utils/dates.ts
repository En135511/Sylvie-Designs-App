const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Parses a YYYY-MM-DD string as a local date (never UTC, so no off-by-one days). */
export function parseISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return toISODate(date) === iso ? date : null;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  if (!date) throw new Error(`Invalid date: ${iso}`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Whole days from `today` until `iso` (negative when overdue). */
export function daysUntil(iso: string, today: string = todayISO()): number {
  const a = parseISODate(iso);
  const b = parseISODate(today);
  if (!a || !b) throw new Error('Invalid date');
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function formatDate(iso: string): string {
  const date = parseISODate(iso);
  return date
    ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : iso;
}

export function describeDue(iso: string, today: string = todayISO()): string {
  const days = daysUntil(iso, today);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  if (days === -1) return '1 day overdue';
  return `${-days} days overdue`;
}
