import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { type RoleCode } from '@tohfa/shared-types';
import { signOAuthLinkToken, signTokenPair, verifyOAuthLinkToken, verifyRefreshToken } from '../../auth/jwt.js';
import type { Actor } from '../../auth/requireAuth.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { config } from '../../config.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { authRepo, type AuthRepo, type OAuthIdentityRow } from './auth.repo.js';
import { oauthProviderClient, type OAuthProfile, type OAuthProviderClient } from './oauth.providers.js';
import type {
  ForgotPasswordBody,
  LoginBody,
  OAuthLinkBody,
  OAuthLoginBody,
  OAuthProviderCode,
  RegisterCustomerBody,
  ResetPasswordBody,
  SendOtpBody,
  VerifyOtpBody,
} from './auth.schema.js';

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function toProviderCode(provider: OAuthProviderCode): 'GOOGLE' | 'FACEBOOK' {
  return provider === 'google' ? 'GOOGLE' : 'FACEBOOK';
}

/**
 * Translate the UNIQUE(provider, provider_subject_id) / UNIQUE(user_id,
 * provider) violation into a domain error. Mirrors the same pattern in
 * counter-offers.service.ts: the database is the backstop against a
 * concurrent double-link, the service turns its 23505 into a 409 instead of
 * a 500.
 */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

export interface AuthService {
  registerCustomer(input: RegisterCustomerBody): Promise<unknown>;
  sendOtp(input: SendOtpBody): Promise<unknown>;
  verifyOtp(input: VerifyOtpBody, ip?: string, userAgent?: string): Promise<unknown>;
  login(input: LoginBody, ip?: string, userAgent?: string): Promise<unknown>;
  refreshToken(refreshTokenString: string): Promise<unknown>;
  logout(actor: Actor): Promise<void>;
  forgotPassword(input: ForgotPasswordBody): Promise<unknown>;
  resetPassword(input: ResetPasswordBody): Promise<void>;
  terminateSession(actor: Actor, sessionId: string): Promise<void>;
  getMe(actor: Actor): Promise<unknown>;
  loginWithOAuth(
    provider: OAuthProviderCode,
    input: OAuthLoginBody,
    ip?: string,
    userAgent?: string,
  ): Promise<unknown>;
  linkOAuthIdentity(actor: Actor, input: OAuthLinkBody): Promise<unknown>;
  unlinkOAuthIdentity(actor: Actor, provider: OAuthProviderCode): Promise<void>;
}

export function createAuthService(
  repo: AuthRepo = authRepo,
  oauthClient: OAuthProviderClient = oauthProviderClient,
): AuthService {
  return {
    async registerCustomer(input) {
      const existingMobile = await repo.findUserByMobile(pool, input.mobile);
      if (existingMobile !== null) {
        throw new AppError('CONFLICT', {
          detail: 'Mobile number is already registered.',
        });
      }

      if (input.email !== undefined) {
        const existingEmail = await repo.findUserByEmail(pool, input.email);
        if (existingEmail !== null) {
          throw new AppError('CONFLICT', {
            detail: 'Email address is already in use.',
          });
        }
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await repo.createCustomerUser(pool, {
        mobile: input.mobile,
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        preferredLocale: input.preferredLocale,
        status: 'ACTIVE',
      });

      // Generate initial verification OTP
      const otpRes = (await this.sendOtp({
        mobile: input.mobile,
        purpose: 'REGISTRATION',
      })) as {
        challengeId: string;
        expiresAt: string;
        resendAvailableAt: string;
        attemptsRemaining?: number;
        _mockCode?: string;
      };

      return {
        userId: user.id,
        status: 'PENDING_OTP',
        challengeId: otpRes.challengeId,
        otpExpiresAt: otpRes.expiresAt,
        resendAvailableAt: otpRes.resendAvailableAt,
        attemptsRemaining: otpRes.attemptsRemaining ?? config.OTP_MAX_ATTEMPTS,
        ...(otpRes._mockCode !== undefined ? { _mockCode: otpRes._mockCode } : {}),
      };
    },

    async sendOtp(input) {
      const latest = await repo.findLatestOtp(pool, input.mobile, input.purpose);
      const now = Date.now();

      if (latest !== null) {
        const lastSentTime = new Date(latest.last_sent_at).getTime();
        const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);
        const cooldownSeconds = config.OTP_RESEND_SECONDS; // 60s per BR-32

        if (elapsedSeconds < cooldownSeconds) {
          throw new AppError('OTP_RESEND_TOO_SOON', {
            status: 429,
            detail: `Please wait ${cooldownSeconds - elapsedSeconds}s before requesting a new OTP.`,
            meta: {
              secondsRemaining: cooldownSeconds - elapsedSeconds,
              resendAvailableAt: new Date(lastSentTime + cooldownSeconds * 1000).toISOString(),
            },
          });
        }
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = hashValue(code);

      const expiresAt = new Date(now + config.OTP_TTL_SECONDS * 1000);
      const resendAvailableAt = new Date(now + config.OTP_RESEND_SECONDS * 1000);

      const user = await repo.findUserByMobile(pool, input.mobile);

      const challenge = await repo.createOtpVerification(pool, {
        userId: user?.id,
        mobile: input.mobile,
        purpose: input.purpose,
        codeHash,
        maxAttempts: config.OTP_MAX_ATTEMPTS, // 3 per BR-32
        expiresAt,
      });

      return {
        challengeId: challenge.id,
        expiresAt: expiresAt.toISOString(),
        resendAvailableAt: resendAvailableAt.toISOString(),
        attemptsRemaining: challenge.max_attempts,
        ...(config.isTest || config.SMS_PROVIDER === 'mock' ? { _mockCode: code } : {}),
      };
    },

    async verifyOtp(input, ip, userAgent) {
      const challenge = await repo.findOtpById(pool, input.challengeId);
      if (challenge === null) {
        throw new AppError('NOT_FOUND', { detail: 'OTP challenge not found.' });
      }

      const now = new Date();
      if (challenge.consumed_at !== null) {
        throw new AppError('OTP_INVALID', { status: 400, detail: 'OTP challenge has already been used.' });
      }

      if (challenge.locked_at !== null || challenge.attempts >= challenge.max_attempts) {
        throw new AppError('OTP_LOCKED', {
          status: 429,
          detail: 'OTP challenge is locked due to too many failed attempts.',
        });
      }

      if (new Date(challenge.expires_at).getTime() < now.getTime()) {
        throw new AppError('OTP_EXPIRED', { status: 400, detail: 'OTP challenge has expired.' });
      }

      const incomingHash = hashValue(input.code);
      if (incomingHash !== challenge.code_hash) {
        const newAttempts = challenge.attempts + 1;
        const shouldLock = newAttempts >= challenge.max_attempts;
        await repo.incrementOtpAttempts(pool, challenge.id, shouldLock);

        if (shouldLock) {
          throw new AppError('OTP_LOCKED', {
            status: 429,
            detail: 'OTP challenge is locked due to 3 failed attempts (BR-32).',
          });
        }

        throw new AppError('OTP_INVALID', {
          status: 401,
          detail: 'Invalid OTP code.',
          meta: {
            attemptsRemaining: challenge.max_attempts - newAttempts,
          },
        });
      }

      // Mark challenge consumed
      await repo.consumeOtp(pool, challenge.id);

      // BR-39: verify the linkToken (if any) up front — a bad/expired/tampered
      // token must fail loudly (OAUTH_LINK_TOKEN_INVALID) rather than silently
      // skipping the link the client asked for.
      const linkedIdentity = input.linkToken !== undefined ? verifyOAuthLinkToken(input.linkToken) : null;

      // Find or activate user
      let user = challenge.user_id !== null ? await repo.findUserById(pool, challenge.user_id) : null;
      if (user === null) {
        user = await repo.findUserByMobile(pool, challenge.mobile);
      }

      let oauthProfile: Omit<OAuthProfile, 'subjectId'> | undefined;

      if (user === null) {
        if (linkedIdentity === null) {
          return {
            verified: true,
            mobile: challenge.mobile,
            purpose: challenge.purpose,
          };
        }

        // BR-39: brand-new mobile number + a verified OAuth profile — create
        // the account and link the identity atomically (same transaction),
        // so a crash between the two steps can never leave an unlinked
        // orphan account or a linked identity with no user behind it. The
        // account goes straight to ACTIVE: the OTP that proves the phone
        // number just succeeded in this very call, so there is no separate
        // activation step left to run.
        const created = linkedIdentity;
        user = await withTransaction(async (tx) => {
          const newUser = await repo.createCustomerUser(tx, {
            mobile: challenge.mobile,
            // Whatever of these Google/Facebook actually gave us. Falling
            // back to the email (then a generic label) rather than leaving
            // full_name blank keeps the NOT NULL column happy; the client
            // still collects/edits the real name on Step 1 of registration.
            fullName: created.fullName ?? created.email ?? 'TOHFA User',
            email: created.email,
            passwordHash: null,
            preferredLocale: 'en',
            status: 'ACTIVE',
          });

          try {
            await repo.createOAuthIdentity(tx, {
              userId: newUser.id,
              provider: created.provider,
              providerSubjectId: created.providerSubjectId,
              email: created.email,
            });
          } catch (error) {
            if (isUniqueViolation(error)) {
              throw new AppError('OAUTH_IDENTITY_ALREADY_LINKED', {
                detail: 'This social account is already linked to a different TOHFA account.',
              });
            }
            throw error;
          }

          await writeAuditLog(tx, {
            actorId: newUser.id,
            actionCode: 'auth.oauth.link',
            entityType: 'oauth_identity',
            entityId: null,
            after: { provider: created.provider, viaOtpVerify: true, newAccount: true },
          });

          return newUser;
        });

        oauthProfile = {
          fullName: linkedIdentity.fullName,
          email: linkedIdentity.email,
          photoUrl: linkedIdentity.photoUrl,
        };
      } else if (linkedIdentity !== null) {
        // BR-39: an existing account — link the identity to IT rather than
        // creating a duplicate account.
        const existingLink = await repo.findOAuthIdentity(
          pool,
          linkedIdentity.provider,
          linkedIdentity.providerSubjectId,
        );

        if (existingLink !== null && existingLink.user_id !== user.id) {
          throw new AppError('OAUTH_IDENTITY_ALREADY_LINKED', {
            detail: 'This social account is already linked to a different TOHFA account.',
          });
        }

        if (existingLink === null) {
          const targetUserId = user.id;
          await withTransaction(async (tx) => {
            let row: OAuthIdentityRow;
            try {
              row = await repo.createOAuthIdentity(tx, {
                userId: targetUserId,
                provider: linkedIdentity.provider,
                providerSubjectId: linkedIdentity.providerSubjectId,
                email: linkedIdentity.email,
              });
            } catch (error) {
              if (isUniqueViolation(error)) {
                throw new AppError('OAUTH_IDENTITY_ALREADY_LINKED', {
                  detail: 'This social account is already linked to a different TOHFA account.',
                });
              }
              throw error;
            }

            await writeAuditLog(tx, {
              actorId: targetUserId,
              actionCode: 'auth.oauth.link',
              entityType: 'oauth_identity',
              entityId: row.id,
              after: { provider: linkedIdentity.provider, viaOtpVerify: true, newAccount: false },
            });
          });
        }

        oauthProfile = {
          fullName: linkedIdentity.fullName,
          email: linkedIdentity.email,
          photoUrl: linkedIdentity.photoUrl,
        };
      }

      if (user.status === 'PENDING') {
        await repo.updateUserStatus(pool, user.id, 'ACTIVE');
        user.status = 'ACTIVE';
      }

      // Create session and JWT pair
      const roles = await repo.getUserRoles(pool, user.id);
      const roleAssignments = roles.map((r) => ({
        code: r.role_code,
        warehouseId: r.warehouse_id ?? undefined,
        zoneId: r.zone_id ?? undefined,
      }));

      let effectiveRoles = roleAssignments;
      if (effectiveRoles.length === 0) {
        if (user.user_type === 'FARMER') {
          effectiveRoles = [
            {
              code: 'FARMER' as RoleCode,
              warehouseId: undefined,
              zoneId: undefined,
            },
          ];
        } else {
          effectiveRoles = [
            {
              code: 'CUSTOMER' as RoleCode,
              warehouseId: undefined,
              zoneId: undefined,
            },
          ];
        }
      }


      let farmerId: string | null = null;
      let customerId: string | null = null;
      if (user.user_type === 'FARMER' || effectiveRoles.some((r) => r.code === 'FARMER')) {
        const farmerRes = await pool.query<{ id: string }>(
          `SELECT id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [user.id],
        );
        farmerId = farmerRes.rows[0]?.id ?? null;
      }
      if (user.user_type === 'CUSTOMER' || effectiveRoles.some((r) => r.code === 'CUSTOMER')) {
        const customerRes = await pool.query<{ id: string }>(
          `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
          [user.id],
        );
        customerId = customerRes.rows[0]?.id ?? null;
      }

      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const session = await repo.createSession(pool, {
        userId: user.id,
        expiresAt: sessionExpiresAt,
        ip,
        userAgent,
      });

      const tokenPair = signTokenPair(
        {
          sub: user.id,
          roles: effectiveRoles,
          farmerId,
          customerId,
        },
        {
          sub: user.id,
          jti: session.id,
        },
      );


      const refreshTokenHash = hashValue(tokenPair.refreshToken);
      await repo.createRefreshToken(pool, {
        sessionId: session.id,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: sessionExpiresAt,
      });

      await repo.updateUserLastLogin(pool, user.id);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        requiresRoleSelection: false,
        user: {
          id: user.id,
          fullName: user.full_name,
          userType: user.user_type,
          roles: roleAssignments,
          preferredLocale: user.preferred_locale,
        },
        // BR-39: additive/optional — lets the mobile client prefill Step 1 of
        // its registration stepper without a second API call. Absent on a
        // plain mobile+OTP verify (no linkToken was presented).
        ...(oauthProfile !== undefined ? { oauthProfile } : {}),
      };
    },

    async login(input, ip, userAgent) {
      const user = await repo.findUserByMobile(pool, input.mobile);
      if (user === null || user.password_hash === null) {
        throw new AppError('UNAUTHENTICATED', { detail: 'Invalid mobile or password.' });
      }

      if (user.status === 'DISABLED') {
        throw new AppError('FORBIDDEN', { detail: 'Account has been disabled.' });
      }

      const passwordValid = await bcrypt.compare(input.password, user.password_hash);
      if (!passwordValid) {
        throw new AppError('UNAUTHENTICATED', { detail: 'Invalid mobile or password.' });
      }

      const roles = await repo.getUserRoles(pool, user.id);
      const roleAssignments = roles.map((r) => ({
        code: r.role_code,
        warehouseId: r.warehouse_id ?? undefined,
        zoneId: r.zone_id ?? undefined,
      }));

      // If user has multiple roles and didn't specify one, ask client to select
      if (roleAssignments.length > 1 && input.roleCode === undefined) {
        return {
          requiresRoleSelection: true,
          availableRoles: roleAssignments,
        };
      }

      let effectiveRoles = roleAssignments;
      if (input.roleCode !== undefined) {
        const filtered = roleAssignments.filter((r) => r.code === input.roleCode);
        if (filtered.length > 0) {
          effectiveRoles = filtered;
        } else if (user.user_type === input.roleCode) {
          effectiveRoles = [
            {
              code: input.roleCode as RoleCode,
              warehouseId: undefined,
              zoneId: undefined,
            },
          ];
        } else {
          throw new AppError('UNAUTHENTICATED', {
            detail: `User does not hold the ${input.roleCode} role.`,
          });
        }
      } else if (effectiveRoles.length === 0) {
        if (user.user_type === 'FARMER') {
          effectiveRoles = [
            {
              code: 'FARMER' as RoleCode,
              warehouseId: undefined,
              zoneId: undefined,
            },
          ];
        } else {
          effectiveRoles = [
            {
              code: 'CUSTOMER' as RoleCode,
              warehouseId: undefined,
              zoneId: undefined,
            },
          ];
        }
      }


      let farmerId: string | null = null;
      let customerId: string | null = null;
      if (user.user_type === 'FARMER' || effectiveRoles.some((r) => r.code === 'FARMER')) {
        const farmerRes = await pool.query<{ id: string }>(
          `SELECT id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [user.id],
        );
        farmerId = farmerRes.rows[0]?.id ?? null;
      }
      if (user.user_type === 'CUSTOMER' || effectiveRoles.some((r) => r.code === 'CUSTOMER')) {
        const customerRes = await pool.query<{ id: string }>(
          `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
          [user.id],
        );
        customerId = customerRes.rows[0]?.id ?? null;
      }

      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const session = await repo.createSession(pool, {
        userId: user.id,
        deviceId: input.deviceId,
        platform: input.platform,
        ip,
        userAgent,
        expiresAt: sessionExpiresAt,
      });

      const tokenPair = signTokenPair(
        {
          sub: user.id,
          roles: effectiveRoles,
          farmerId,
          customerId,
        },
        {
          sub: user.id,
          jti: session.id,
        },
      );


      const refreshTokenHash = hashValue(tokenPair.refreshToken);
      await repo.createRefreshToken(pool, {
        sessionId: session.id,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: sessionExpiresAt,
      });

      await repo.updateUserLastLogin(pool, user.id);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        requiresRoleSelection: false,
        user: {
          id: user.id,
          fullName: user.full_name,
          userType: user.user_type,
          roles: effectiveRoles,
          preferredLocale: user.preferred_locale,
        },
      };
    },

    async refreshToken(refreshTokenString) {
      const payload = verifyRefreshToken(refreshTokenString);
      const tokenHash = hashValue(refreshTokenString);

      const storedToken = await repo.findRefreshTokenByHash(pool, tokenHash);
      if (storedToken === null || storedToken.revoked_at !== null) {
        throw new AppError('UNAUTHENTICATED', { detail: 'Refresh token is invalid or has been revoked.' });
      }

      // Replay / theft detection: if token was already used, revoke the entire session family!
      if (storedToken.used_at !== null) {
        await repo.revokeSessionTokenFamily(pool, storedToken.session_id, 'TOKEN_REUSE_DETECTED');
        throw new AppError('UNAUTHENTICATED', {
          detail: 'Token reuse detected. All sessions in this family have been terminated.',
        });
      }

      if (new Date(storedToken.expires_at).getTime() < Date.now()) {
        throw new AppError('UNAUTHENTICATED', { detail: 'Refresh token has expired.' });
      }

      const session = await repo.findSessionById(pool, storedToken.session_id);
      if (session === null || session.revoked_at !== null) {
        throw new AppError('UNAUTHENTICATED', { detail: 'Session has been revoked.' });
      }

      const user = await repo.findUserById(pool, payload.sub);
      if (user === null || user.status === 'DISABLED') {
        throw new AppError('UNAUTHENTICATED', { detail: 'User is inactive or disabled.' });
      }

      const roles = await repo.getUserRoles(pool, user.id);
      const roleAssignments = roles.map((r) => ({
        code: r.role_code,
        warehouseId: r.warehouse_id ?? undefined,
        zoneId: r.zone_id ?? undefined,
      }));

      let farmerId: string | null = null;
      let customerId: string | null = null;
      if (user.user_type === 'FARMER' || roleAssignments.some((r) => r.code === 'FARMER')) {
        const farmerRes = await pool.query<{ id: string }>(
          `SELECT id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [user.id],
        );
        farmerId = farmerRes.rows[0]?.id ?? null;
      }
      if (user.user_type === 'CUSTOMER' || roleAssignments.some((r) => r.code === 'CUSTOMER')) {
        const customerRes = await pool.query<{ id: string }>(
          `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
          [user.id],
        );
        customerId = customerRes.rows[0]?.id ?? null;
      }

      const newPair = signTokenPair(
        {
          sub: user.id,
          roles: roleAssignments.length > 0 ? roleAssignments : [{ code: 'CUSTOMER' as RoleCode }],
          farmerId,
          customerId,
        },
        {
          sub: user.id,
          jti: session.id,
        },
      );

      const newTokenHash = hashValue(newPair.refreshToken);
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await withTransaction(async (tx) => {
        await repo.rotateRefreshToken(tx, storedToken.id, {
          sessionId: session.id,
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt: sessionExpiresAt,
        });
      });

      return {
        accessToken: newPair.accessToken,
        refreshToken: newPair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
      };
    },

    async logout(actor) {
      await repo.revokeAllUserSessions(pool, actor.userId, actor.userId, 'USER_LOGOUT');
    },

    async forgotPassword(input) {
      return this.sendOtp({
        mobile: input.mobile,
        purpose: 'PASSWORD_RESET',
      });
    },

    async resetPassword(input) {
      const challenge = await repo.findOtpById(pool, input.challengeId);
      if (challenge === null) {
        throw new AppError('NOT_FOUND', { detail: 'OTP challenge not found.' });
      }

      if (challenge.locked_at !== null || challenge.attempts >= challenge.max_attempts) {
        throw new AppError('OTP_LOCKED', { status: 429, detail: 'OTP challenge is locked.' });
      }

      if (challenge.consumed_at !== null) {
        throw new AppError('OTP_INVALID', { status: 400, detail: 'OTP challenge already consumed.' });
      }

      const incomingHash = hashValue(input.code);
      if (incomingHash !== challenge.code_hash) {
        const newAttempts = challenge.attempts + 1;
        const shouldLock = newAttempts >= challenge.max_attempts;
        await repo.incrementOtpAttempts(pool, challenge.id, shouldLock);
        if (shouldLock) {
          throw new AppError('OTP_LOCKED', { status: 429, detail: 'OTP challenge locked after 3 attempts.' });
        }
        throw new AppError('OTP_INVALID', { status: 401, detail: 'Invalid OTP code.' });
      }

      await repo.consumeOtp(pool, challenge.id);

      const user = await repo.findUserByMobile(pool, challenge.mobile);
      if (user !== null) {
        const passwordHash = await bcrypt.hash(input.newPassword, 12);
        await withTransaction(async (tx) => {
          await repo.updateUserPassword(tx, user.id, passwordHash);
          await repo.revokeAllUserSessions(tx, user.id, user.id, 'PASSWORD_RESET_ALL_SESSIONS');
        });
      }
    },

    async terminateSession(actor, sessionId) {
      const session = await repo.findSessionById(pool, sessionId);
      if (session === null) {
        throw new AppError('NOT_FOUND', { detail: 'Session not found.' });
      }

      await repo.revokeSession(pool, sessionId, actor.userId, 'TERMINATED_BY_SUPER_ADMIN');
    },

    async getMe(actor) {
      const user = await repo.findUserById(pool, actor.userId);
      if (user === null) {
        throw new AppError('UNAUTHENTICATED', { detail: 'User not found.' });
      }

      const roles = await repo.getUserRoles(pool, user.id);
      const permissions = await repo.getUserPermissions(pool, user.id);

      return {
        id: user.id,
        fullName: user.full_name,
        mobile: user.mobile,
        email: user.email,
        userType: user.user_type,
        preferredLocale: user.preferred_locale,
        roles: roles.map((r) => ({
          code: r.role_code,
          warehouseId: r.warehouse_id ?? undefined,
          warehouseName: r.warehouse_name ?? undefined,
          zoneId: r.zone_id ?? undefined,
          zoneName: r.zone_name ?? undefined,
        })),
        permissions,
      };
    },

    async loginWithOAuth(provider, input, ip, userAgent) {
      const providerCode = toProviderCode(provider);
      const profile =
        provider === 'google'
          ? await oauthClient.verifyGoogleToken(input.token)
          : await oauthClient.verifyFacebookToken(input.token);

      const identity = await repo.findOAuthIdentity(pool, providerCode, profile.subjectId);

      if (identity === null) {
        // BR-39: never create or activate an account from an OAuth token
        // alone. Mint a linkToken and hand back the verified profile; the
        // client runs the normal mobile+OTP flow and passes the linkToken to
        // `/auth/otp/verify` to complete the link.
        const linkToken = signOAuthLinkToken({
          provider: providerCode,
          providerSubjectId: profile.subjectId,
          email: profile.email,
          fullName: profile.fullName,
          photoUrl: profile.photoUrl,
        });

        return {
          status: 'NOT_LINKED' as const,
          profile: {
            fullName: profile.fullName,
            email: profile.email,
            photoUrl: profile.photoUrl,
          },
          linkToken,
        };
      }

      const user = await repo.findUserById(pool, identity.user_id);
      if (user === null || user.status === 'DISABLED') {
        throw new AppError('UNAUTHENTICATED', { detail: 'Account is inactive or disabled.' });
      }

      // From here down this mirrors `login`'s role-resolution and
      // session-issuance exactly (same multi-role-selection behaviour,
      // same token pair), just entered via a verified OAuth identity instead
      // of a password.
      const roles = await repo.getUserRoles(pool, user.id);
      const roleAssignments = roles.map((r) => ({
        code: r.role_code,
        warehouseId: r.warehouse_id ?? undefined,
        zoneId: r.zone_id ?? undefined,
      }));

      if (roleAssignments.length > 1 && input.roleCode === undefined) {
        return {
          requiresRoleSelection: true,
          availableRoles: roleAssignments,
        };
      }

      let effectiveRoles = roleAssignments;
      if (input.roleCode !== undefined) {
        const filtered = roleAssignments.filter((r) => r.code === input.roleCode);
        if (filtered.length > 0) {
          effectiveRoles = filtered;
        } else if (user.user_type === input.roleCode) {
          effectiveRoles = [
            {
              code: input.roleCode as RoleCode,
              warehouseId: undefined,
              zoneId: undefined,
            },
          ];
        } else {
          throw new AppError('UNAUTHENTICATED', {
            detail: `User does not hold the ${input.roleCode} role.`,
          });
        }
      } else if (effectiveRoles.length === 0) {
        effectiveRoles = [
          {
            code: (user.user_type === 'FARMER' ? 'FARMER' : 'CUSTOMER') as RoleCode,
            warehouseId: undefined,
            zoneId: undefined,
          },
        ];
      }

      let farmerId: string | null = null;
      let customerId: string | null = null;
      if (user.user_type === 'FARMER' || effectiveRoles.some((r) => r.code === 'FARMER')) {
        const farmerRes = await pool.query<{ id: string }>(
          `SELECT id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [user.id],
        );
        farmerId = farmerRes.rows[0]?.id ?? null;
      }
      if (user.user_type === 'CUSTOMER' || effectiveRoles.some((r) => r.code === 'CUSTOMER')) {
        const customerRes = await pool.query<{ id: string }>(
          `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
          [user.id],
        );
        customerId = customerRes.rows[0]?.id ?? null;
      }

      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const session = await repo.createSession(pool, {
        userId: user.id,
        deviceId: input.deviceId,
        platform: input.platform,
        ip,
        userAgent,
        expiresAt: sessionExpiresAt,
      });

      const tokenPair = signTokenPair(
        {
          sub: user.id,
          roles: effectiveRoles,
          farmerId,
          customerId,
        },
        {
          sub: user.id,
          jti: session.id,
        },
      );

      const refreshTokenHash = hashValue(tokenPair.refreshToken);
      await repo.createRefreshToken(pool, {
        sessionId: session.id,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: sessionExpiresAt,
      });

      await repo.updateUserLastLogin(pool, user.id);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        requiresRoleSelection: false,
        user: {
          id: user.id,
          fullName: user.full_name,
          userType: user.user_type,
          roles: effectiveRoles,
          preferredLocale: user.preferred_locale,
        },
      };
    },

    async linkOAuthIdentity(actor, input) {
      const providerCode = toProviderCode(input.provider);
      const profile =
        input.provider === 'google'
          ? await oauthClient.verifyGoogleToken(input.token)
          : await oauthClient.verifyFacebookToken(input.token);

      const existing = await repo.findOAuthIdentity(pool, providerCode, profile.subjectId);
      if (existing !== null && existing.user_id !== actor.userId) {
        throw new AppError('OAUTH_IDENTITY_ALREADY_LINKED', {
          detail: `This ${input.provider} account is already linked to a different TOHFA account.`,
        });
      }
      if (existing !== null) {
        // Idempotent: already linked to this same account, nothing to do.
        return {
          provider: input.provider,
          email: existing.email ?? undefined,
          linkedAt: existing.linked_at.toISOString(),
        };
      }

      const created = await withTransaction(async (tx) => {
        let row: OAuthIdentityRow;
        try {
          row = await repo.createOAuthIdentity(tx, {
            userId: actor.userId,
            provider: providerCode,
            providerSubjectId: profile.subjectId,
            email: profile.email,
          });
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new AppError('OAUTH_IDENTITY_ALREADY_LINKED', {
              detail: `This ${input.provider} account is already linked to a different TOHFA account.`,
            });
          }
          throw error;
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'auth.oauth.link',
          entityType: 'oauth_identity',
          entityId: row.id,
          after: { provider: providerCode, email: profile.email },
        });

        return row;
      });

      return {
        provider: input.provider,
        email: created.email ?? undefined,
        linkedAt: created.linked_at.toISOString(),
      };
    },

    async unlinkOAuthIdentity(actor, provider) {
      const providerCode = toProviderCode(provider);
      await withTransaction(async (tx) => {
        const deleted = await repo.deleteOAuthIdentity(tx, actor.userId, providerCode);
        if (deleted === null) {
          throw new AppError('NOT_FOUND', { detail: 'No linked identity for that provider.' });
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'auth.oauth.unlink',
          entityType: 'oauth_identity',
          entityId: deleted.id,
          before: { provider: providerCode },
        });
      });
    },
  };
}

export const authService = createAuthService();
