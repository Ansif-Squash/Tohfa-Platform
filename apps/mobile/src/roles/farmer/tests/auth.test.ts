import { describe, expect, it } from 'vitest';
import { renderOtpState, resolveRouteAfterAuth } from '../api/auth';

describe('User Story 42 (S-42) Auth Tests', () => {
  describe('BR-32: Server-driven OTP state assertions', () => {
    it('BR-32: resend timer counts down from server resendAvailableAt timestamp', () => {
      const now = Date.now();
      const resendAvailableAt = new Date(now + 45000).toISOString();

      const state = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      expect(state.canResend).toBe(false);
      expect(state.secondsUntilResend).toBe(45);
    });

    it('BR-32: allows immediate resend when resendAvailableAt timestamp is in the past', () => {
      const now = Date.now();
      const resendAvailableAt = new Date(now - 1000).toISOString();

      const state = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      expect(state.canResend).toBe(true);
      expect(state.secondsUntilResend).toBe(0);
    });

    it('BR-32: attempts indicator is driven by server attemptsRemaining', () => {
      const now = Date.now();
      const state = renderOtpState({
        resendAvailableAt: new Date(now + 60000).toISOString(),
        attemptsRemaining: 2,
        now,
      });

      expect(state.attemptsRemaining).toBe(2);
      expect(state.isLocked).toBe(false);
    });

    it('BR-32: locked challenge displays server-driven state and request new challenge action when attemptsRemaining is 0', () => {
      const now = Date.now();
      const state = renderOtpState({
        resendAvailableAt: new Date(now + 60000).toISOString(),
        attemptsRemaining: 0,
        now,
      });

      expect(state.isLocked).toBe(true);
      expect(state.canResend).toBe(true); // Must allow requesting a new challenge
    });
  });

  describe('Farmer Routing Rules', () => {
    it('Routing: pending farmer is routed to application-status timeline', () => {
      const me = {
        userId: 'user-123',
        status: 'PENDING_APPROVAL',
        farmerId: 'farmer-123',
        applicationId: 'app-456',
        roles: [{ code: 'FARMER' as const }],
      };

      const route = resolveRouteAfterAuth(me);
      expect(route.name).toBe('ApplicationStatus');
      expect(route.params).toEqual({ applicationId: 'app-456' });
    });

    it('Routing: approved farmer is routed to main tab dashboard', () => {
      const me = {
        userId: 'user-123',
        status: 'ACTIVE',
        farmerId: 'farmer-123',
        applicationId: 'app-456',
        roles: [{ code: 'FARMER' as const }],
      };

      const route = resolveRouteAfterAuth(me);
      expect(route.name).toBe('MainTabs');
    });
  });
});
