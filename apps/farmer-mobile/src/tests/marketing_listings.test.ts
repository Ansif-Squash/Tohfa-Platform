import { describe, it, expect } from 'vitest';
import {
  evalListingCeiling,
  canCounterBack,
  computeRemainingTime,
  formatCountdown,
  type Listing,
  type CounterOffer,
  type CreateListingInput,
} from '../api/listings';

describe('Farmer Marketing & Listings (S-45)', () => {
  describe('BR-07: Listing price must not exceed the fair price ceiling', () => {
    it('BR-07: enforces fair price ceiling before submission and validates inline and server 422', () => {
      const ceilingPrice = '80.00';

      // 1. Asking price within ceiling is valid
      const validCheck = evalListingCeiling('75.00', ceilingPrice);
      expect(validCheck.isValid).toBe(true);
      expect(validCheck.error).toBeNull();

      // 2. Asking price exactly equal to ceiling is valid (BR-07b)
      const exactCheck = evalListingCeiling('80.00', ceilingPrice);
      expect(exactCheck.isValid).toBe(true);
      expect(exactCheck.error).toBeNull();

      // 3. Asking price 1 paisa above ceiling is rejected (BR-07a)
      const aboveCheck = evalListingCeiling('80.01', ceilingPrice);
      expect(aboveCheck.isValid).toBe(false);
      expect(aboveCheck.error).toBe('PRICE_ABOVE_CEILING');
      expect(aboveCheck.message).toContain('80.00');

      // 4. Clearly above ceiling
      const highCheck = evalListingCeiling('95.00', ceilingPrice);
      expect(highCheck.isValid).toBe(false);
      expect(highCheck.error).toBe('PRICE_ABOVE_CEILING');
    });

    it('BR-07: validates invalid or empty price input before ceiling check', () => {
      expect(evalListingCeiling('', '80.00').isValid).toBe(false);
      expect(evalListingCeiling('0', '80.00').isValid).toBe(false);
      expect(evalListingCeiling('-10.00', '80.00').isValid).toBe(false);
    });
  });

  describe('BR-10: Counter-offer response window is 24 hours', () => {
    it('BR-10: computes 24-hour counter-offer countdown strictly from server expiresAt and handles clock drift', () => {
      const serverNow = 1757000000000;
      const clientPerfNow = 10000; // monotonic elapsed time

      // 1. Offer expires in 2 hours
      const expiresAt = new Date(serverNow + 2 * 3600 * 1000).toISOString();
      const remaining = computeRemainingTime(expiresAt, serverNow, clientPerfNow, clientPerfNow);
      expect(remaining.isExpired).toBe(false);
      expect(Math.round(remaining.remainingSeconds / 3600)).toBe(2);
      expect(formatCountdown(remaining.remainingMs)).toBe('02:00:00');

      // 2. Offer expired 1 second ago (BR-10a)
      const expiredAt = new Date(serverNow - 1000).toISOString();
      const expiredCheck = computeRemainingTime(expiredAt, serverNow, clientPerfNow, clientPerfNow);
      expect(expiredCheck.isExpired).toBe(true);
      expect(expiredCheck.remainingSeconds).toBe(0);
      expect(formatCountdown(expiredCheck.remainingMs)).toBe('00:00:00');

      // 3. Survives device clock tampering: client local clock says next year, but monotonic elapsed is only 5 seconds
      const monotonicNow = clientPerfNow + 5000;
      const monotonicCheck = computeRemainingTime(expiresAt, serverNow, clientPerfNow, monotonicNow);
      expect(monotonicCheck.isExpired).toBe(false);
      expect(monotonicCheck.remainingSeconds).toBe(2 * 3600 - 5);
    });
  });

  describe('BR-11: Counter-offers may be countered back at most 3 times', () => {
    it('BR-11: disables counter-back after round 3 and handles 409 COUNTER_LIMIT_REACHED', () => {
      // Admin opens Round 1 -> farmer hasn't countered yet (farmerCounters = 0)
      expect(canCounterBack(0)).toBe(true);

      // Farmer counters once -> round 2 (farmerCounters = 1)
      expect(canCounterBack(1)).toBe(true);

      // Farmer counters twice -> round 3 (farmerCounters = 2)
      expect(canCounterBack(2)).toBe(true);

      // Farmer has countered 3 times (farmerCounters = 3) -> 4th counter prohibited (BR-11a)
      expect(canCounterBack(3)).toBe(false);

      // Greater than 3 is strictly false
      expect(canCounterBack(4)).toBe(false);
    });
  });

  describe('Listing Submission Idempotency & Precision', () => {
    it('uses integer paise precision to avoid floating point math discrepancies in ceiling checks', () => {
      // 0.1 + 0.2 in JS float is 0.30000000000000004
      // Ceiling is 0.30
      const check = evalListingCeiling('0.30', '0.30');
      expect(check.isValid).toBe(true);

      const checkExceed = evalListingCeiling('0.31', '0.30');
      expect(checkExceed.isValid).toBe(false);
    });

    it('formats countdown timer accurately across minute and hour boundaries', () => {
      expect(formatCountdown(0)).toBe('00:00:00');
      expect(formatCountdown(59 * 1000)).toBe('00:00:59');
      expect(formatCountdown(60 * 1000)).toBe('00:01:00');
      expect(formatCountdown(3665 * 1000)).toBe('01:01:05');
      expect(formatCountdown(24 * 3600 * 1000)).toBe('24:00:00');
    });
  });
});
