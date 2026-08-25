import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { type RoleCode } from '@tohfa/shared-types';
import { signTokenPair, verifyRefreshToken } from '../../auth/jwt.js';
import type { Actor } from '../../auth/requireAuth.js';
import { config } from '../../config.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { authRepo, type AuthRepo } from './auth.repo.js';
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterCustomerBody,
  ResetPasswordBody,
  SendOtpBody,
  VerifyOtpBody,
} from './auth.schema.js';

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
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
}

export function createAuthService(repo: AuthRepo = authRepo): AuthService {
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
      };

      return {
        userId: user.id,
        status: 'PENDING_OTP',
        otpExpiresAt: otpRes.expiresAt,
        resendAvailableAt: otpRes.resendAvailableAt,
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

      // Find or activate user
      let user = challenge.user_id !== null ? await repo.findUserById(pool, challenge.user_id) : null;
      if (user === null) {
        user = await repo.findUserByMobile(pool, challenge.mobile);
      }

      if (user === null) {
        return {
          verified: true,
          mobile: challenge.mobile,
          purpose: challenge.purpose,
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
          roles: roleAssignments.length > 0 ? roleAssignments : [{ code: 'CUSTOMER' as RoleCode }],
          farmerId: null,
          customerId: user.id,
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

      const effectiveRoles =
        input.roleCode !== undefined
          ? roleAssignments.filter((r) => r.code === input.roleCode)
          : roleAssignments.length > 0
            ? roleAssignments
            : [{ code: 'CUSTOMER' as RoleCode }];

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
          farmerId: null,
          customerId: user.id,
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

      const newPair = signTokenPair(
        {
          sub: user.id,
          roles: roleAssignments.length > 0 ? roleAssignments : [{ code: 'CUSTOMER' as RoleCode }],
          farmerId: null,
          customerId: user.id,
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
  };
}

export const authService = createAuthService();
