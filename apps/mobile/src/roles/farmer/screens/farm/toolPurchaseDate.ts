/**
 * Pure date helpers behind the "Purchase date" calendar on Add Tool.
 *
 * They live outside AddToolScreen.tsx so they can be unit-tested: this app's
 * vitest setup runs in plain Node with no React Native renderer (see
 * apps/mobile/CLAUDE.md § Testing), so anything importing `react-native` is not
 * testable here. Same reason `registration/validation.ts` is its own module.
 */

/** The day shape `react-native-calendars` hands to `onDayPress`. */
export interface CalendarDay {
  year: number;
  /** 1-based, exactly as the calendar reports it. */
  month: number;
  day: number;
  /** The calendar's own `YYYY-MM-DD` key for that square. */
  dateString: string;
}

/**
 * `Date` → the local `YYYY-MM-DD` key `react-native-calendars` uses.
 *
 * Built from the local getters on purpose, not from
 * `toISOString().slice(0, 10)`: every TOHFA farmer is east of UTC, where the
 * UTC form of a local midnight is the *previous* day, and that would mark the
 * wrong square in the grid.
 */
export function toCalendarDateString(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * A day tapped in the calendar → local `Date` at midnight.
 *
 * Midnight rather than "now" so a picked purchase date never carries a
 * time-of-day that would make two dates chosen on the same day compare unequal.
 */
export function dateFromCalendarDay(day: CalendarDay): Date {
  return new Date(day.year, day.month - 1, day.day);
}

/**
 * Today as the calendar's `YYYY-MM-DD` key — the newest selectable purchase
 * date, since a tool cannot have been bought in the future.
 *
 * `now` is injectable only so tests can pin it.
 */
export function todayCalendarDateString(now: Date = new Date()): string {
  return toCalendarDateString(now);
}
