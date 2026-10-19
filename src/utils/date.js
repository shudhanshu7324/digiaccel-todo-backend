function parseDateOnly(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error = new Error(`${fieldName} must use YYYY-MM-DD format`);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    const error = new Error(`${fieldName} is not a valid calendar date`);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return date;
}

function startOfUtcMonday(input) {
  const date = new Date(input);
  date.setUTCHours(0, 0, 0, 0);
  const day = date.getUTCDay(); // Sunday = 0
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

function addUtcDays(input, days) {
  const date = new Date(input);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

module.exports = { parseDateOnly, startOfUtcMonday, addUtcDays };
