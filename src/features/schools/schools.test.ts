import { describe, expect, it } from 'vitest';
import { buildClassCsv } from './csv';
import { parseNames } from './names';

describe('parseNames', () => {
  it('splits lines, trims, drops numbering, blanks and duplicates', () => {
    const text = '1. Amina  Wanjiru\n2) John Otieno\n\n  john otieno \nMary, Peter;Grace';
    expect(parseNames(text)).toEqual(['Amina Wanjiru', 'John Otieno', 'Mary', 'Peter', 'Grace']);
  });

  it('returns an empty list for blank input', () => {
    expect(parseNames('  \n , ;')).toEqual([]);
  });
});

describe('buildClassCsv', () => {
  it('includes only used columns, converts units and escapes cells', () => {
    const csv = buildClassCsv(
      [
        { name: 'Amina', values: { chest: 76.2, waist: 60 }, notes: 'Tall, slim' },
        { name: 'John "JJ"', values: null, notes: '' },
      ],
      ['chest', 'waist', 'hip'],
      'in',
    );
    expect(csv.split('\r\n')).toEqual([
      'Student,Chest / Bust (in),Waist (in),Notes',
      'Amina,30,23.6,"Tall, slim"',
      '"John ""JJ""",,,',
    ]);
  });
});
