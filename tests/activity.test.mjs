import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCalendarDays, changeCalendarMonth, formatCalendarDate, getBucharestToday,
  getCalendarMonth, getCalendarWeekday, getDaysInCalendarMonth, getStartOfCalendarWeek,
} from '../src/utils/activity.js';

const cases = [
  ['2026-09-08T21:05:00Z', '2026-09-09'], // 00:05, summer
  ['2026-09-08T23:00:00Z', '2026-09-09'], // original 02:00 bug
  ['2026-09-09T20:55:00Z', '2026-09-09'], // 23:55
  ['2026-09-09T21:05:00Z', '2026-09-10'], // next day's 00:05
  ['2026-01-08T22:05:00Z', '2026-01-09'], // 00:05, winter
  ['2026-01-09T00:00:00Z', '2026-01-09'], // 02:00, winter
  ['2026-03-29T00:59:59Z', '2026-03-29'], // spring DST transition
  ['2026-03-29T01:00:00Z', '2026-03-29'],
  ['2026-10-25T00:59:59Z', '2026-10-25'], // autumn repeated hour
  ['2026-10-25T01:00:00Z', '2026-10-25'],
  ['2026-12-31T22:05:00Z', '2027-01-01'], // current-month/year rollover
];

for (const [instant, expected] of cases) {
  test(`${instant} displays Bucharest day ${expected}`, () => {
    assert.equal(getBucharestToday(new Date(instant)), expected);
  });
}

test('calendar DATEs do not shift in any browser timezone', () => {
  assert.equal(formatCalendarDate('2026-09-09', { day: 'numeric', month: 'long' }), '9 septembrie');
  assert.equal(addCalendarDays('2026-09-09', -1), '2026-09-08');
  assert.equal(getCalendarWeekday('2026-09-01'), 1); // Monday-first Tuesday
  assert.equal(getStartOfCalendarWeek('2026-09-09'), '2026-09-07');
  assert.equal(getStartOfCalendarWeek('2026-09-01'), '2026-08-31');
  assert.equal(getCalendarMonth('2026-09-09'), '2026-09-01');
  assert.equal(changeCalendarMonth(changeCalendarMonth('2026-09-01', -1), 1), '2026-09-01');
  assert.equal(changeCalendarMonth('2026-12-01', 1), '2027-01-01');
  assert.equal(getDaysInCalendarMonth('2026-09-01'), 30);
  assert.equal(getDaysInCalendarMonth('2028-02-01'), 29);
});

test('calendar arithmetic crosses DST without skipped or repeated dates', () => {
  assert.equal(addCalendarDays('2026-03-29', 1), '2026-03-30');
  assert.equal(addCalendarDays('2026-10-25', 1), '2026-10-26');
  assert.throws(() => formatCalendarDate('2026-02-30'), RangeError);
  assert.throws(() => formatCalendarDate('2026-09-09T00:00:00Z'), RangeError);
});
