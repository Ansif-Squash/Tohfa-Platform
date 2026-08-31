import { describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { createApp } from '../../app.js';
import { signRefreshToken } from '../../auth/jwt.js';
import { createAuthService } from './auth.service.js';
import type { AuthRepo, OtpVerificationRow, RefreshTokenRow } from './auth.repo.js';
import { databaseReady, describeIfDatabase } from '../../test/factories.js';

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function mockRepo(overrides: Partial<AuthRepo> = {}): AuthRepo {
  return {
    findUserByMobile: async () => null,
    findUserByEmail: async () => null,
    findUserById: async () => null,
    getUserRoles: async () => [],
    getUserPermissions: async () => [],
    createCustomerUser: async (_db, params) => ({
      id: '00000000-0000-0000-0000-000000000001',
      mobile: params.mobile,
      email: params.email ?? null,
      password_hash: params.passwordHash,
      full_name: params.fullName,
      preferred_locale: params.preferredLocale,
      user_type: 'CUSTOMER',
      status: 'ACTIVE',
      mfa_enabled: false,
      last_login_at: null,
      created_at: new Date(),
    }),
    updateUserPassword: async () => {},
    updateUserStatus: async () => {},
    updateUserLastLogin: async () => {},
    createSession: async (_db, params) => ({
      id: '11111111-1111-1111-1111-111111111111',
      user_id: params.userId,
      device_id: params.deviceId ?? null,
      platform: params.platform ?? null,
      fcm_token: null,
      user_agent: params.userAgent ?? null,
      last_seen_ip: params.ip ?? null,
      issued_at: new Date(),
      expires_at: params.expiresAt,
      last_seen_at: null,
      revoked_at: null,
      revoked_by: null,
      revoke_reason: null,
    }),
    findSessionById: async () => null,
    revokeSession: async () => {},
    revokeAllUserSessions: async () => {},
    createRefreshToken: async (_db, params) => ({
      id: '22222222-2222-2222-2222-222222222222',
      session_id: params.sessionId,
      user_id: params.userId,
      token_hash: params.tokenHash,
      issued_at: new Date(),
      expires_at: params.expiresAt,
      used_at: null,
      revoked_at: null,
      replaced_by: null,
    }),
    findRefreshTokenByHash: async () => null,
    rotateRefreshToken: async (_db, _oldId, params) => ({
      id: '33333333-3333-3333-3333-333333333333',
      session_id: params.sessionId,
      user_id: params.userId,
      token_hash: params.tokenHash,
      issued_at: new Date(),
      expires_at: params.expiresAt,
      used_at: null,
      revoked_at: null,
      replaced_by: null,
    }),
    revokeSessionTokenFamily: async () => {},
    createOtpVerification: async (_db, params) => ({
      id: '44444444-4444-4444-4444-444444444444',
      user_id: params.userId ?? null,
      mobile: params.mobile,
      purpose: params.purpose,
      code_hash: params.codeHash,
      attempts: 0,
      max_attempts: params.maxAttempts,
      locked_at: null,
      expires_at: params.expiresAt,
      consumed_at: null,
      resend_count: 0,
      last_sent_at: new Date(),
      created_at: new Date(),
    }),
    findLatestOtp: async () => null,
    findOtpById: async () => null,
    incrementOtpAttempts: async () => null,
    consumeOtp: async () => {},
    ...overrides,
  };
}

describe('Auth Module & BR-32 Test Contract', () => {
  describe('BR-32a: OTP 3-attempt lockout', () => {
    it('BR-32a: 4th wrong attempt -> 429 OTP_LOCKED and challenge stays dead for correct code', async () => {
      const correctCode = '123456';
      const challengeId = '44444444-4444-4444-4444-444444444444';

      let challenge: OtpVerificationRow = {
        id: challengeId,
        user_id: null,
        mobile: '+919000000001',
        purpose: 'LOGIN',
        code_hash: hashValue(correctCode),
        attempts: 0,
        max_attempts: 3,
        locked_at: null,
        expires_at: new Date(Date.now() + 300000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(),
        created_at: new Date(),
      };

      const repo = mockRepo({
        findOtpById: async () => challenge,
        incrementOtpAttempts: async (_db, _id, lock) => {
          challenge = {
            ...challenge,
            attempts: challenge.attempts + 1,
            locked_at: lock ? new Date() : null,
          };
          return challenge;
        },
      });

      const service = createAuthService(repo);

      // Attempt 1: wrong code -> 401 OTP_INVALID
      await expect(service.verifyOtp({ challengeId, code: '000000' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_INVALID', status: 401 }),
      );
      expect(challenge.attempts).toBe(1);

      // Attempt 2: wrong code -> 401 OTP_INVALID
      await expect(service.verifyOtp({ challengeId, code: '000000' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_INVALID', status: 401 }),
      );
      expect(challenge.attempts).toBe(2);

      // Attempt 3: wrong code -> 429 OTP_LOCKED (locks challenge on 3rd failure)
      await expect(service.verifyOtp({ challengeId, code: '000000' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_LOCKED', status: 429 }),
      );
      expect(challenge.attempts).toBe(3);
      expect(challenge.locked_at).not.toBeNull();

      // 4th attempt: even with CORRECT code, challenge is locked -> 429 OTP_LOCKED
      await expect(service.verifyOtp({ challengeId, code: correctCode })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_LOCKED', status: 429 }),
      );
    });
  });

  describe('BR-32b: 60-second OTP resend cooldown', () => {
    it('BR-32b: Resend at 59s -> 429 OTP_RESEND_TOO_SOON; at 61s -> accepted', async () => {
      const mobile = '+919000000001';

      // Case 1: Last sent 59 seconds ago
      const recentOtp: OtpVerificationRow = {
        id: '44444444-4444-4444-4444-444444444444',
        user_id: null,
        mobile,
        purpose: 'LOGIN',
        code_hash: 'abc',
        attempts: 0,
        max_attempts: 3,
        locked_at: null,
        expires_at: new Date(Date.now() + 240000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(Date.now() - 59 * 1000), // 59s ago
        created_at: new Date(Date.now() - 59 * 1000),
      };

      const repoRecent = mockRepo({
        findLatestOtp: async () => recentOtp,
      });
      const serviceRecent = createAuthService(repoRecent);

      await expect(serviceRecent.sendOtp({ mobile, purpose: 'LOGIN' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_RESEND_TOO_SOON', status: 429 }),
      );

      // Case 2: Last sent 61 seconds ago
      const agedOtp: OtpVerificationRow = {
        ...recentOtp,
        last_sent_at: new Date(Date.now() - 61 * 1000), // 61s ago
      };

      const repoAged = mockRepo({
        findLatestOtp: async () => agedOtp,
      });
      const serviceAged = createAuthService(repoAged);

      const result = await serviceAged.sendOtp({ mobile, purpose: 'LOGIN' });
      expect(result).toHaveProperty('challengeId');
      expect(result).toHaveProperty('attemptsRemaining', 3);
    });
  });

  describe('Refresh Token Rotation & Theft Detection', () => {
    it('reusing a rotated refresh token revokes the entire session', async () => {
      let revokedSessionId: string | null = null;

      const validJwt = signRefreshToken({ sub: 'user-1', jti: 'session-123' });
      const tokenHash = hashValue(validJwt);

      const rotatedToken: RefreshTokenRow = {
        id: 'token-1',
        session_id: 'session-123',
        user_id: 'user-1',
        token_hash: tokenHash,
        issued_at: new Date(),
        expires_at: new Date(Date.now() + 1000000),
        used_at: new Date(), // Already used / rotated!
        revoked_at: null,
        replaced_by: 'token-2',
      };

      const repo = mockRepo({
        findRefreshTokenByHash: async () => rotatedToken,
        revokeSessionTokenFamily: async (_db, sessionId) => {
          revokedSessionId = sessionId;
        },
      });

      const service = createAuthService(repo);

      // Expect 401 UNAUTHENTICATED on reused token
      await expect(service.refreshToken(validJwt)).rejects.toThrow(
        expect.objectContaining({ code: 'UNAUTHENTICATED' }),
      );

      // Assert that the entire session family was revoked
      expect(revokedSessionId).toBe('session-123');
    });
  });

  describe('HTTP Schema Validation', () => {
    const app = createApp();

    it('POST /v1/auth/otp/send rejects invalid mobile format with 422', async () => {
      const res = await request(app)
        .post('/v1/auth/otp/send')
        .send({ mobile: 'invalid-mobile', purpose: 'LOGIN' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('POST /v1/auth/register/customer rejects short password with 422', async () => {
      const res = await request(app)
        .post('/v1/auth/register/customer')
        .send({
          mobile: '+919876543210',
          fullName: 'Test User',
          password: 'short',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();

    it('POST /v1/auth/forgot-password always responds with 202 on real database', async () => {
      if (!(await databaseReady('otp_verifications'))) return;

      const randMobile = `+91987654${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ mobile: randMobile });

      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty('challengeId');
    });
  });
});
