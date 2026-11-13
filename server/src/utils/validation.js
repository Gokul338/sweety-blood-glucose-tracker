export const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];


export function validateReading({ reading_date, time_slot, value }) {
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }

  const numericValue = Number(value);

  if (
    !Number.isInteger(numericValue) ||
    numericValue < 40 ||
    numericValue > 600
  ) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  if (!reading_date || !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
    return 'Please enter a valid date.';
  }

  // Parse the date in UTC to avoid timezone mismatches.
  const parsed = new Date(`${reading_date}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== reading_date
  ) {
    return 'Please enter a valid date.';
  }

  // Compare against today's local date.
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');

  if (reading_date > today) {
    return 'Date cannot be in the future.';
  }

  if (!TIME_SLOTS.includes(time_slot)) {
    return 'Please select a valid time slot.';
  }

  return null;
}


export function reportStats(rows) {
  if (!rows.length) return { highest: null, lowest: null, average: null, count: 0 };
  const values = rows.map(row => Number(row.value));
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
    count: values.length
  };
}
