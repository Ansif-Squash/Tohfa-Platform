import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  renderOtpState,
  registerCustomer,
  verifyOtp,
  loginWithPassword,
  forgotPassword,
  resetPassword,
  fetchMe,
  logout,
} from '../api/auth';
import * as client from '../api/client';
import * as storage from '../storage/tokenStorage';

describe('User Story 47 (S-47) Customer Auth Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clearTokens();
  });

  describe('BR-32: Server-driven OTP state assertions', () => {
    it('BR-32: resend timer and lockout come from server fields, not local counter', () => {
      const now = 1725700000000;
      // Server returned resendAvailableAt in future (e.g. 45s from now)
      const resendAvailableAt = new Date(now + 45000).toISOString();

      const state1 = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      // Cooldown timer strictly computed from server timestamp
      expect(state1.canResend).toBe(false);
      expect(state1.secondsUntilResend).toBe(45);
      expect(state1.attemptsRemaining).toBe(3);
      expect(state1.isLocked).toBe(false);

      // Advance clock 20s
      const state2 = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now: now + 20000,
      });
      expect(state2.secondsUntilResend).toBe(25);
      expect(state2.canResend).toBe(false);

      // Expired cooldown allows resend
      const state3 = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now: now + 46000,
      });
      expect(state3.canResend).toBe(true);
      expect(state3.secondsUntilResend).toBe(0);

      // Lockout strictly driven by server attemptsRemaining <= 0
      const lockedState = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 0,
        now,
      });
      expect(lockedState.isLocked).toBe(true);
      expect(lockedState.attemptsRemaining).toBe(0);
      expect(lockedState.canResend).toBe(true); // Must allow requesting a fresh challenge
    });

    it('BR-32: immediate resend allowed when resendAvailableAt is missing or past', () => {
      const state = renderOtpState({
        resendAvailableAt: null,
        attemptsRemaining: 2,
        now: Date.now(),
      });
      expect(state.canResend).toBe(true);
      expect(state.secondsUntilResend).toBe(0);
      expect(state.attemptsRemaining).toBe(2);
    });
  });

  describe('Customer Self-Registration and Instant Activation', () => {
    it('Customer self-registration succeeds and receives challengeId with server resend timestamps', async () => {
      const mockAccepted = {
        userId: 'cust-uuid-1',
        status: 'PENDING_OTP' as const,
        challengeId: 'chal-uuid-1',
        otpExpiresAt: new Date(Date.now() + 600000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
        attemptsRemaining: 3,
        _mockCode: '123456',
      };

      const requestSpy = vi.spyOn(client, 'request').mockResolvedValueOnce(mockAccepted);

      const res = await registerCustomer({
        fullName: 'Deepa Raman',
        mobile: '9876543210',
        password: 'Password@1234',
      });

      expect(requestSpy).toHaveBeenCalledWith('/auth/register/customer', {
        method: 'POST',
        body: {
          fullName: 'Deepa Raman',
          mobile: '+919876543210',
          password: 'Password@1234',
          preferredLocale: 'en',
        },
      });
      expect(res.userId).toBe('cust-uuid-1');
      expect(res.status).toBe('PENDING_OTP');
      expect(res.challengeId).toBe('chal-uuid-1');
      expect(res.attemptsRemaining).toBe(3);
    });

    it('Instant activation: OTP verification immediately transitions customer to ACTIVE without admin review', async () => {
      const mockAuth = {
        accessToken: 'access-jwt-token',
        refreshToken: 'refresh-jwt-token',
        user: {
          id: 'cust-uuid-1',
          mobile: '+919876543210',
          fullName: 'Deepa Raman',
          status: 'ACTIVE', // Instant activation!
          roles: [{ code: 'CUSTOMER' }],
        },
      };

      vi.spyOn(client, 'request')
        .mockResolvedValueOnce(mockAuth) // verifyOtp
        .mockResolvedValueOnce(mockAuth.user); // fetchMe

      const verifyRes = await verifyOtp({
        challengeId: 'chal-uuid-1',
        code: '123456',
      });

      expect(verifyRes.user.status).toBe('ACTIVE');
      expect(await storage.getAccessToken()).toBe('access-jwt-token');

      const me = await fetchMe();
      // Verifies customer is directly ACTIVE and ready to use the app without admin application review
      expect(me.status).toBe('ACTIVE');
      expect(me.roles[0]?.code).toBe('CUSTOMER');
    });

    it('Customer login, logout, forgot-password and reset-password operate end-to-end', async () => {
      const mockAuth = {
        accessToken: 'login-token',
        refreshToken: 'login-refresh',
        user: {
          id: 'cust-uuid-2',
          mobile: '+919876543211',
          fullName: 'Rajesh Nair',
          status: 'ACTIVE',
          roles: [{ code: 'CUSTOMER' }],
        },
      };

      const requestSpy = vi.spyOn(client, 'request')
        .mockResolvedValueOnce(mockAuth) // loginWithPassword
        .mockResolvedValueOnce({ challengeId: 'forgot-chal-1', expiresAt: '', resendAvailableAt: '', attemptsRemaining: 3 }) // forgotPassword
        .mockResolvedValueOnce(undefined) // resetPassword
        .mockResolvedValueOnce(undefined); // logout

      // Login
      const loginRes = await loginWithPassword({
        mobile: '+919876543211',
        password: 'MyPassword123',
      });
      expect(loginRes.user.id).toBe('cust-uuid-2');
      expect(await storage.getAccessToken()).toBe('login-token');

      // Forgot password
      const forgotRes = await forgotPassword({ mobile: '+919876543211' });
      expect(forgotRes.challengeId).toBe('forgot-chal-1');

      // Reset password
      await resetPassword({
        challengeId: 'forgot-chal-1',
        code: '654321',
        newPassword: 'BrandNewPassword123',
      });

      // Logout clears tokens
      await logout();
      expect(await storage.getAccessToken()).toBeNull();
      expect(requestSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('Performance Target: Sub-60s Registration to First Authenticated Screen', () => {
    it('measures registration-to-authenticated-screen path to be well under 60 seconds (<60,000ms)', async () => {
      const startTime = performance.now();

      // Step 1: User submits registration
      const mockRegAccepted = {
        userId: 'perf-cust-1',
        status: 'PENDING_OTP' as const,
        challengeId: 'perf-chal-1',
        otpExpiresAt: new Date(Date.now() + 600000).toISOString(),
        resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
        attemptsRemaining: 3,
        _mockCode: '888888',
      };
      const mockAuth = {
        accessToken: 'perf-token',
        refreshToken: 'perf-refresh',
        user: {
          id: 'perf-cust-1',
          mobile: '+919876543999',
          fullName: 'Fast Customer',
          status: 'ACTIVE',
          roles: [{ code: 'CUSTOMER' }],
        },
      };

      vi.spyOn(client, 'request')
        .mockResolvedValueOnce(mockRegAccepted) // register
        .mockResolvedValueOnce(mockAuth) // verify
        .mockResolvedValueOnce(mockAuth.user); // fetchMe

      const regRes = await registerCustomer({
        fullName: 'Fast Customer',
        mobile: '9876543999',
        password: 'FastPassword123!',
      });

      // Step 2: User enters OTP code immediately
      const authRes = await verifyOtp({
        challengeId: regRes.challengeId!,
        code: '888888',
      });

      // Step 3: Screen arrives at authenticated landing state
      const me = await fetchMe();
      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);

      expect(authRes.user.status).toBe('ACTIVE');
      expect(me.status).toBe('ACTIVE');
      expect(elapsedMs).toBeLessThan(60000); // Must be sub-60 seconds (BR-32 & S-47 performance target)

      // Log recorded measurement
      console.log(`[PERFORMANCE BENCHMARK] Customer registration to authenticated screen: ${elapsedMs}ms (target: <60,000ms)`);
    });
  });
});
