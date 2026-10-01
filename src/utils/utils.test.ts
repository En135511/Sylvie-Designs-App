import { describe, expect, it } from 'vitest';
import { addDays, daysUntil, describeDue, parseISODate, toISODate } from './dates';
import { formatMoney, minorToInput, parseMoney } from './money';
import { normalizePhone, telUrl, whatsappUrl } from './phone';
import { cmToDisplay, parseNumber, toCm } from './units';

describe('units', () => {
  it('parses decimals with dot or comma and rejects junk', () => {
    expect(parseNumber('38')).toBe(38);
    expect(parseNumber(' 38,5 ')).toBe(38.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('-4')).toBeNull();
    expect(parseNumber('1.2.3')).toBeNull();
  });

  it('converts between cm and inches, rounding to 0.1', () => {
    expect(toCm(10, 'in')).toBe(25.4);
    expect(cmToDisplay(25.4, 'in')).toBe(10);
    expect(cmToDisplay(91.4, 'cm')).toBe(91.4);
    expect(cmToDisplay(toCm(36.5, 'in'), 'in')).toBe(36.5);
  });
});

describe('money', () => {
  it('stores integer minor units', () => {
    expect(parseMoney('12.50')).toBe(1250);
    expect(parseMoney('0.1')).toBe(10);
    expect(parseMoney('19.99')).toBe(1999);
    expect(parseMoney('x')).toBeNull();
  });

  it('formats with thousands separators', () => {
    expect(formatMoney(1250, '$')).toBe('$12.50');
    expect(formatMoney(150000, 'KSh ')).toBe('KSh 1,500');
    expect(minorToInput(0)).toBe('');
    expect(minorToInput(1250)).toBe('12.50');
  });
});

describe('dates', () => {
  it('round-trips and validates ISO dates', () => {
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(toISODate(parseISODate('2026-03-05')!)).toBe('2026-03-05');
    expect(parseISODate('05/03/2026')).toBeNull();
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts whole days and describes due state', () => {
    expect(daysUntil('2026-05-10', '2026-05-07')).toBe(3);
    expect(describeDue('2026-05-07', '2026-05-07')).toBe('Due today');
    expect(describeDue('2026-05-08', '2026-05-07')).toBe('Due tomorrow');
    expect(describeDue('2026-05-04', '2026-05-07')).toBe('3 days overdue');
    expect(daysUntil('2026-03-30', '2026-03-28')).toBe(2); // DST-safe
  });
});

describe('phone', () => {
  it('normalizes and builds links', () => {
    expect(normalizePhone('+254 712-345 678')).toBe('+254712345678');
    expect(telUrl('0712 345 678')).toBe('tel:0712345678');
    expect(whatsappUrl('+254 712 345 678', 'Hi there')).toBe(
      'https://wa.me/254712345678?text=Hi%20there',
    );
    expect(whatsappUrl('12')).toBeNull();
  });
});
