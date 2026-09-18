import { describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { createApp } from '../../app.js';
import { signOAuthLinkToken, signRefreshToken, verifyOAuthLinkToken } from '../../auth/jwt.js';
import { AppError } from '../../http/problem.js';
import { createAuthService } from './auth.service.js';
import type { AuthRepo, OAuthIdentityRow, OtpVerificationRow, RefreshTokenRow } from './auth.repo.js';
import type { OAuthProviderClient } from './oauth.providers.js';
import { anActor, databaseReady, describeIfDatabase } from '../../test/factories.js';

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
    findOAuthIdentity: async () => null,
    findOAuthIdentityByUserAndProvider: async () => null,
    createOAuthIdentity: async (_db, params) => ({
      id: '55555555-5555-5555-5555-555555555555',
      user_id: params.userId,
      provider: params.provider,
      provider_subject_id: params.providerSubjectId,
      email: params.email ?? null,
      linked_at: new Date(),
      created_at: new Date(),
    }),
    deleteOAuthIdentity: async () => null,
    ...overrides,
  };
}

function fakeOAuthClient(overrides: Partial<OAuthProviderClient> = {}): OAuthProviderClient {
  return {
    verifyGoogleToken: async () => ({
      subjectId: 'google-sub-1',
      email: 'priya@example.com',
      fullName: 'Priya Raman',
      photoUrl: 'https://lh3.googleusercontent.com/a/photo.jpg',
    }),
    verifyFacebookToken: async () => ({
      subjectId: 'fb-sub-1',
      email: 'priya@example.com',
      fullName: 'Priya Raman',
    }),
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

  describe('BR-39: OAuth is login/linking only, never a bypass of mobile+OTP', () => {
    it('BR-39b: a verified token with no linked identity returns NOT_LINKED + profile + linkToken, no tokens issued', async () => {
      const repo = mockRepo({ findOAuthIdentity: async () => null });
      const service = createAuthService(repo, fakeOAuthClient());

      const result = (await service.loginWithOAuth('google', { token: 'valid-google-token' })) as {
        status: string;
        profile: { fullName?: string; email?: string; photoUrl?: string };
        linkToken: string;
      };

      expect(result.status).toBe('NOT_LINKED');
      expect(result.profile.email).toBe('priya@example.com');
      expect(result.profile.fullName).toBe('Priya Raman');
      expect(result).not.toHaveProperty('accessToken');

      // The linkToken is real and carries the verified profile through to
      // /auth/otp/verify.
      const payload = verifyOAuthLinkToken(result.linkToken);
      expect(payload.provider).toBe('GOOGLE');
      expect(payload.providerSubjectId).toBe('google-sub-1');
      expect(payload.email).toBe('priya@example.com');
    });

    it('BR-39e: POST /auth/me/oauth/link against an identity already linked to a DIFFERENT account fails with OAUTH_IDENTITY_ALREADY_LINKED', async () => {
      const repo = mockRepo({
        findOAuthIdentity: async () => ({
          id: 'identity-other',
          user_id: 'someone-else',
          provider: 'GOOGLE',
          provider_subject_id: 'google-sub-1',
          email: 'other@example.com',
          linked_at: new Date(),
          created_at: new Date(),
        }),
      });
      const service = createAuthService(repo, fakeOAuthClient());
      const actor = anActor({ userId: 'me-user-id' });

      await expect(
        service.linkOAuthIdentity(actor, { provider: 'google', token: 'valid-google-token' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'OAUTH_IDENTITY_ALREADY_LINKED', status: 409 }));
    });

    it('BR-39f: a provider that rejects the token surfaces OAUTH_TOKEN_INVALID, not a generic 401', async () => {
      const repo = mockRepo();
      const service = createAuthService(
        repo,
        fakeOAuthClient({
          verifyGoogleToken: async () => {
            throw new AppError('OAUTH_TOKEN_INVALID', { detail: 'Google rejected the ID token.' });
          },
        }),
      );

      await expect(service.loginWithOAuth('google', { token: 'garbage' })).rejects.toThrow(
        expect.objectContaining({ code: 'OAUTH_TOKEN_INVALID', status: 401 }),
      );
    });

    it('BR-39f: a malformed/tampered linkToken passed to /auth/otp/verify surfaces OAUTH_LINK_TOKEN_INVALID, not a generic 401', async () => {
      const correctCode = '333444';
      const challengeId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const challenge: OtpVerificationRow = {
        id: challengeId,
        user_id: null,
        mobile: '+919000000097',
        purpose: 'REGISTRATION',
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
        findUserByMobile: async () => null,
      });
      const service = createAuthService(repo);

      await expect(
        service.verifyOtp({ challengeId, code: correctCode, linkToken: 'not-a-real-jwt' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'OAUTH_LINK_TOKEN_INVALID', status: 401 }));
    });

    // The remaining BR-39 cases exercise the success path, which — like
    // `login`/`verifyOtp` themselves — reaches the database directly for the
    // farmer/customer lookup and/or `withTransaction`, not only through the
    // mocked repo. They run only when DATABASE_URL points at a real,
    // migrated Postgres (see apps/api/CLAUDE.md's "Tests" section).
    describeIfDatabase('success paths (real database)', () => {
      it('BR-39a: a verified Google token for an already-linked identity logs in like /auth/login', async () => {
        if (!(await databaseReady('users'))) return;

        const linkedUserId = '66666666-6666-6666-6666-666666666666';
        const repo = mockRepo({
          findOAuthIdentity: async () => ({
            id: 'identity-1',
            user_id: linkedUserId,
            provider: 'GOOGLE',
            provider_subject_id: 'google-sub-1',
            email: 'priya@example.com',
            linked_at: new Date(),
            created_at: new Date(),
          }),
          findUserById: async () => ({
            id: linkedUserId,
            mobile: '+919876500001',
            email: 'priya@example.com',
            password_hash: null,
            full_name: 'Priya Raman',
            preferred_locale: 'en',
            user_type: 'CUSTOMER',
            status: 'ACTIVE',
            mfa_enabled: false,
            last_login_at: null,
            created_at: new Date(),
          }),
          getUserRoles: async () => [],
        });

        const service = createAuthService(repo, fakeOAuthClient());
        const result = (await service.loginWithOAuth('google', { token: 'valid-google-token' })) as {
          accessToken: string;
          requiresRoleSelection: boolean;
        };

        expect(result.accessToken).toBeTypeOf('string');
        expect(result.requiresRoleSelection).toBe(false);
      });

      it('BR-39c: OTP-verify with a valid linkToken for a brand-new mobile number creates the account AND links the identity', async () => {
        if (!(await databaseReady('oauth_identities'))) return;

        const correctCode = '654321';
        const challengeId = '77777777-7777-7777-7777-777777777777';
        const mobile = '+919000000099';

        const challenge: OtpVerificationRow = {
          id: challengeId,
          user_id: null,
          mobile,
          purpose: 'REGISTRATION',
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

        let createdUserId: string | null = null;
        let createCustomerUserCalls = 0;
        let createOAuthIdentityCalls = 0;

        const repo = mockRepo({
          findOtpById: async () => challenge,
          findUserByMobile: async () => null,
          createCustomerUser: async (_db, params) => {
            createCustomerUserCalls += 1;
            // A real seeded user id (db/seed/003_dev_users.sql) — not
            // semantically meaningful here, only load-bearing: `repo` is
            // mocked so this "created" row is never really inserted, but the
            // service's `writeAuditLog` call right after IS a real INSERT
            // whose `actor_id` carries a live FK to `users(id)`.
            createdUserId = '00000000-0000-0000-0000-000000000001';
            return {
              id: createdUserId,
              mobile: params.mobile,
              email: params.email ?? null,
              password_hash: params.passwordHash,
              full_name: params.fullName,
              preferred_locale: params.preferredLocale,
              user_type: 'CUSTOMER',
              status: params.status ?? 'ACTIVE',
              mfa_enabled: false,
              last_login_at: null,
              created_at: new Date(),
            };
          },
          createOAuthIdentity: async (_db, params): Promise<OAuthIdentityRow> => {
            createOAuthIdentityCalls += 1;
            expect(params.userId).toBe(createdUserId);
            return {
              id: 'identity-new',
              user_id: params.userId,
              provider: params.provider,
              provider_subject_id: params.providerSubjectId,
              email: params.email ?? null,
              linked_at: new Date(),
              created_at: new Date(),
            };
          },
        });

        const service = createAuthService(repo);
        const linkToken = signOAuthLinkToken({
          provider: 'GOOGLE',
          providerSubjectId: 'google-sub-new',
          email: 'newperson@example.com',
          fullName: 'New Person',
        });

        const result = (await service.verifyOtp({ challengeId, code: correctCode, linkToken })) as {
          accessToken: string;
          oauthProfile?: { fullName?: string; email?: string };
        };

        expect(createCustomerUserCalls).toBe(1);
        expect(createOAuthIdentityCalls).toBe(1);
        expect(result.accessToken).toBeTypeOf('string');
        expect(result.oauthProfile?.email).toBe('newperson@example.com');
      });

      it('BR-39d: OTP-verify with a valid linkToken for an EXISTING mobile number links to that account instead of creating a duplicate', async () => {
        if (!(await databaseReady('oauth_identities'))) return;

        const correctCode = '111222';
        const challengeId = '99999999-9999-9999-9999-999999999999';
        // A real seeded user id (db/seed/003_dev_users.sql) — see the same
        // note on BR-39c above: `writeAuditLog` inside the link branch does a
        // real INSERT whose actor_id needs a live FK target.
        const existingUserId = '00000000-0000-0000-0000-000000000002';
        const mobile = '+919000000098';

        const challenge: OtpVerificationRow = {
          id: challengeId,
          user_id: existingUserId,
          mobile,
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

        let createCustomerUserCalls = 0;
        let createOAuthIdentityCalls = 0;

        const repo = mockRepo({
          findOtpById: async () => challenge,
          findUserById: async () => ({
            id: existingUserId,
            mobile,
            email: null,
            password_hash: 'hash',
            full_name: 'Existing User',
            preferred_locale: 'en',
            user_type: 'CUSTOMER',
            status: 'ACTIVE',
            mfa_enabled: false,
            last_login_at: null,
            created_at: new Date(),
          }),
          createCustomerUser: async () => {
            createCustomerUserCalls += 1;
            throw new Error('must not create a new account for an existing mobile number');
          },
          findOAuthIdentity: async () => null,
          createOAuthIdentity: async (_db, params): Promise<OAuthIdentityRow> => {
            createOAuthIdentityCalls += 1;
            expect(params.userId).toBe(existingUserId);
            return {
              // audit_log.entity_id is `uuid` (no FK, but the column type
              // still rejects a non-UUID string).
              id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
              user_id: params.userId,
              provider: params.provider,
              provider_subject_id: params.providerSubjectId,
              email: params.email ?? null,
              linked_at: new Date(),
              created_at: new Date(),
            };
          },
        });

        const service = createAuthService(repo);
        const linkToken = signOAuthLinkToken({
          provider: 'GOOGLE',
          providerSubjectId: 'google-sub-existing',
          email: 'existing@example.com',
        });

        const result = (await service.verifyOtp({ challengeId, code: correctCode, linkToken })) as {
          accessToken: string;
        };

        expect(createCustomerUserCalls).toBe(0);
        expect(createOAuthIdentityCalls).toBe(1);
        expect(result.accessToken).toBeTypeOf('string');
      });

      it('unlink removes the row', async () => {
        if (!(await databaseReady('oauth_identities'))) return;

        let deleteCalledWith: { userId: string; provider: string } | null = null;
        const repo = mockRepo({
          deleteOAuthIdentity: async (_db, userId, provider): Promise<OAuthIdentityRow> => {
            deleteCalledWith = { userId, provider };
            return {
              // See the BR-39d note above: audit_log.entity_id is `uuid`.
              id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
              user_id: userId,
              provider,
              provider_subject_id: 'google-sub-1',
              email: null,
              linked_at: new Date(),
              created_at: new Date(),
            };
          },
        });
        const service = createAuthService(repo, fakeOAuthClient());
        // A real seeded user id (db/seed/003_dev_users.sql) — `writeAuditLog`
        // after the delete needs a live FK target, same as BR-39c/d above.
        const actor = anActor({ userId: '00000000-0000-0000-0000-000000000003' });

        await service.unlinkOAuthIdentity(actor, 'google');

        expect(deleteCalledWith).toEqual({
          userId: '00000000-0000-0000-0000-000000000003',
          provider: 'GOOGLE',
        });
      });
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
