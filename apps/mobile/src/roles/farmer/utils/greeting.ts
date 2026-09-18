import type { TranslationKey } from '../../../i18n/farmer';

/**
 * Returns the appropriate greeting key based on time-of-day.
 * - 05:00 - 11:59: Morning
 * - 12:00 - 16:59: Afternoon
 * - 17:00 - 04:59: Evening
 */
export function getGreetingKey(date: Date = new Date()): TranslationKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'farmer.dashboard.greeting.morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'farmer.dashboard.greeting.afternoon';
  }
  return 'farmer.dashboard.greeting.evening';
}
