export const ACTIVITY_TIME_ZONE = 'Europe/Bucharest';

const bucharestDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ACTIVITY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Instants are converted to the product's timezone for display only. The DB
// derives the authoritative activity date; no caller sends this value on writes.
export function getBucharestToday(instant = new Date()) {
  const parts = Object.fromEntries(bucharestDateFormatter.formatToParts(instant)
    .map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// PostgreSQL DATE values stay YYYY-MM-DD strings. UTC is used ONLY as a
// timezone-independent container for calendar arithmetic, never as an instant
// to convert to local time. Always pair these dates with UTC getters/formatting.
function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Invalid calendar date');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (calendarDateKey(date) !== value) throw new RangeError('Invalid calendar date');
  return date;
}

function calendarDateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function addCalendarDays(value, days) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return calendarDateKey(date);
}

export function getCalendarMonth(value) {
  return `${value.slice(0, 7)}-01`;
}

export function changeCalendarMonth(value, amount) {
  const date = calendarDate(getCalendarMonth(value));
  date.setUTCMonth(date.getUTCMonth() + amount);
  return calendarDateKey(date);
}

export function getCalendarWeekday(value) {
  return (calendarDate(value).getUTCDay() + 6) % 7;
}

export function getStartOfCalendarWeek(value) {
  return addCalendarDays(value, -getCalendarWeekday(value));
}

export function getDaysInCalendarMonth(value) {
  return Number(addCalendarDays(changeCalendarMonth(value, 1), -1).slice(-2));
}

export function formatCalendarDate(value, options = {}) {
  return new Intl.DateTimeFormat('ro-RO', { ...options, timeZone: 'UTC' }).format(calendarDate(value));
}
