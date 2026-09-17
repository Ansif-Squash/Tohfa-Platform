import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  dateFromCalendarDay,
  toCalendarDateString,
  todayCalendarDateString,
  type CalendarDay,
} from '../screens/farm/toolPurchaseDate';
import { formatSafeDate } from '../polyfills';

/**
 * Add Tool → "Purchase date" calendar.
 *
 * The screen itself cannot be rendered here (no React Native renderer in this
 * app's vitest setup — plain Node, see apps/mobile/CLAUDE.md § Testing), so the
 * date arithmetic is tested directly and the screen is checked for the wiring
 * that connects the field to the calendar, the same source-scan approach
 * `accessibility.test.ts` already uses.
 */
describe('Add Tool (S-46): Purchase date calendar', () => {
  describe('toCalendarDateString', () => {
    it('formats a date as the calendar key, zero-padding month and day', () => {
      expect(toCalendarDateString(new Date(2025, 0, 4))).toBe('2025-01-04');
      expect(toCalendarDateString(new Date(2025, 8, 17))).toBe('2025-09-17');
      expect(toCalendarDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
    });

    it('reads the device-local calendar day, never the UTC instant', () => {
      // 04 Jan 2025 00:30 on a device at UTC+05:30 (every TOHFA farmer) is
      // still 03 Jan in UTC. A `toISOString().slice(0, 10)` implementation
      // would return '2025-01-03' here and mark the wrong day in the grid.
      const localDayInIndia = {
        getFullYear: () => 2025,
        getMonth: () => 0,
        getDate: () => 4,
      } as unknown as Date;

      expect(toCalendarDateString(localDayInIndia)).toBe('2025-01-04');
    });
  });

  describe('dateFromCalendarDay', () => {
    it('drops the time of day so a picked date is a stable value', () => {
      const picked = dateFromCalendarDay({
        year: 2025,
        month: 7,
        day: 16,
        dateString: '2025-07-16',
      });

      expect(picked.getFullYear()).toBe(2025);
      expect(picked.getMonth()).toBe(6);
      expect(picked.getDate()).toBe(16);
      expect([
        picked.getHours(),
        picked.getMinutes(),
        picked.getSeconds(),
        picked.getMilliseconds(),
      ]).toEqual([0, 0, 0, 0]);
    });

    it('round-trips every day the calendar reports back to the same key', () => {
      const days: CalendarDay[] = [
        { year: 2025, month: 1, day: 4, dateString: '2025-01-04' },
        { year: 2025, month: 1, day: 31, dateString: '2025-01-31' },
        { year: 2025, month: 2, day: 1, dateString: '2025-02-01' },
        { year: 2024, month: 2, day: 29, dateString: '2024-02-29' }, // leap day
        { year: 2025, month: 12, day: 31, dateString: '2025-12-31' },
      ];

      for (const day of days) {
        expect(toCalendarDateString(dateFromCalendarDay(day))).toBe(day.dateString);
      }
    });
  });

  describe('todayCalendarDateString', () => {
    it('is today as a calendar key, so future purchase dates stay unselectable', () => {
      expect(todayCalendarDateString(new Date(2026, 8, 17, 22, 10))).toBe('2026-09-17');
      expect(todayCalendarDateString(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
    });
  });

  it('labels the field the way the design does: "04 Jan 2025"', () => {
    const label = formatSafeDate(
      dateFromCalendarDay({ year: 2025, month: 1, day: 4, dateString: '2025-01-04' }),
    );

    expect(label).toBe('04 Jan 2025');
  });

  it('opens a calendar from the "Select date" field in AddToolScreen', () => {
    const screenSource = fs.readFileSync(
      path.resolve(__dirname, '../screens/farm/AddToolScreen.tsx'),
      'utf8',
    );

    expect(screenSource).toContain("from 'react-native-calendars'");
    expect(screenSource).toContain('<Calendar');
    expect(screenSource).toContain('onDayPress={handlePurchaseDateSelected}');
    expect(screenSource).toContain("'Select date'");
    expect(screenSource).toContain('setShowPurchaseDateCalendar(true)');
  });
});
