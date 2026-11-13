import { describe, expect, test } from '@jest/globals';
import { validateReading, reportStats } from '../src/utils/validation.js';

describe('validateReading', () => {
  const base = { reading_date: '2026-10-15', time_slot: 'Morning (fasting)', value: 100 };
  test('requires a value', () => expect(validateReading({ ...base, value: '' })).toBe('Please enter a glucose value.'));
  test('rejects values outside range', () => expect(validateReading({ ...base, value: 601 })).toBe('Value must be between 40 and 600 mg/dl.'));
  test('rejects decimal values', () => expect(validateReading({ ...base, value: 100.5 })).toBe('Value must be between 40 and 600 mg/dl.'));
  test('accepts valid reading', () => expect(validateReading(base)).toBeNull());
});
describe('reportStats', () => {
  test('returns empty stats', () => expect(reportStats([])).toEqual({ highest: null, lowest: null, average: null, count: 0 }));
  test('calculates rounded average', () => expect(reportStats([{ value: 90 }, { value: 140 }, { value: 160 }, { value: 120 }])).toEqual({ highest: 160, lowest: 90, average: 127.5, count: 4 }));
});
