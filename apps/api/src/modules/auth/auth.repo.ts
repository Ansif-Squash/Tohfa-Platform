import type { Executor } from '../../db/pool.js';
import type { RoleCode } from '@tohfa/shared-types';

export interface UserRow {
  id: string;
  mobile: string;
  email: string | null;
  password_hash: string | null;
  full_name: string;
  preferred_locale: 'en' | 'ta';
  user_type: 'FARMER' | 'CUSTOMER' | 'ADMIN' | 'DELIVERY_PARTNER';
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  mfa_enabled: boolean;
  last_login_at: Date | null;
  created_at: Date;
}

export interface UserRoleRow {
  role_code: RoleCode;
  warehouse_id: string | null;
  warehouse_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
}

export interface SessionRow {
  id: string;
  user_id: string;
  device_id: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  fcm_token: string | null;
  user_agent: string | null;
  last_seen_ip: string | null;
  issued_at: Date;
  expires_at: Date;
  last_seen_at: Date | null;
  revoked_at: Date | null;
  revoked_by: string | null;
  revoke_reason: string | null;
}

export interface RefreshTokenRow {
  id: string;
  session_id: string;
  user_id: string;
  token_hash: string;
  issued_at: Date;
  expires_at: Date;
  used_at: Date | null;
  revoked_at: Date | null;
  replaced_by: string | null;
}

export interface OtpVerificationRow {
  id: string;
  user_id: string | null;
  mobile: string;
  purpose: string;
  code_hash: string;
  attempts: number;
  max_attempts: number;
  locked_at: Date | null;
  expires_at: Date;
  consumed_at: Date | null;
  resend_count: number;
  last_sent_at: Date;
  created_at: Date;
}

export interface AuthRepo {
  findUserByMobile(db: Executor, mobile: string): Promise<UserRow | null>;
  findUserByEmail(db: Executor, email: string): Promise<UserRow | null>;
  findUserById(db: Executor, id: string): Promise<UserRow | null>;
  getUserRoles(db: Executor, userId: string): Promise<UserRoleRow[]>;
  getUserPermissions(db: Executor, userId: string): Promise<string[]>;
  createCustomerUser(
    db: Executor,
    params: {
      mobile: string;
      fullName: string;
      email?: string | undefined;
      passwordHash: string;
      preferredLocale: 'en' | 'ta';
      status?: 'PENDING' | 'ACTIVE' | undefined;
    },
  ): Promise<UserRow>;
  updateUserPassword(db: Executor, userId: string, passwordHash: string): Promise<void>;
  updateUserStatus(db: Executor, userId: string, status: 'PENDING' | 'ACTIVE' | 'DISABLED'): Promise<void>;
  updateUserLastLogin(db: Executor, userId: string): Promise<void>;
  createSession(
    db: Executor,
    params: {
      userId: string;
      deviceId?: string | undefined;
      platform?: 'ios' | 'android' | 'web' | undefined;
      userAgent?: string | undefined;
      ip?: string | undefined;
      expiresAt: Date;
    },
  ): Promise<SessionRow>;
  findSessionById(db: Executor, sessionId: string): Promise<SessionRow | null>;
  revokeSession(db: Executor, sessionId: string, revokedBy?: string | undefined, reason?: string | undefined): Promise<void>;
  revokeAllUserSessions(db: Executor, userId: string, revokedBy?: string | undefined, reason?: string | undefined): Promise<void>;
  createRefreshToken(
    db: Executor,
    params: {
      sessionId: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
  ): Promise<RefreshTokenRow>;
  findRefreshTokenByHash(db: Executor, tokenHash: string): Promise<RefreshTokenRow | null>;
  rotateRefreshToken(
    db: Executor,
    oldTokenId: string,
    params: {
      sessionId: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
  ): Promise<RefreshTokenRow>;
  revokeSessionTokenFamily(db: Executor, sessionId: string, reason: string): Promise<void>;
  createOtpVerification(
    db: Executor,
    params: {
      userId?: string | undefined;
      mobile: string;
      purpose: string;
      codeHash: string;
      maxAttempts: number;
      expiresAt: Date;
    },
  ): Promise<OtpVerificationRow>;
  findLatestOtp(db: Executor, mobile: string, purpose: string): Promise<OtpVerificationRow | null>;
  findOtpById(db: Executor, id: string): Promise<OtpVerificationRow | null>;
  incrementOtpAttempts(db: Executor, id: string, lock: boolean): Promise<OtpVerificationRow | null>;
  consumeOtp(db: Executor, id: string): Promise<void>;
}

export const authRepo: AuthRepo = {
  async findUserByMobile(db, mobile) {
    const result = await db.query<UserRow>(
      `SELECT id, mobile, email, password_hash, full_name, preferred_locale,
              user_type, status, mfa_enabled, last_login_at, created_at
         FROM users
        WHERE mobile = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [mobile],
    );
    return result.rows[0] ?? null;
  },

  async findUserByEmail(db, email) {
    const result = await db.query<UserRow>(
      `SELECT id, mobile, email, password_hash, full_name, preferred_locale,
              user_type, status, mfa_enabled, last_login_at, created_at
         FROM users
        WHERE lower(email) = lower($1) AND deleted_at IS NULL
        LIMIT 1`,
      [email],
    );
    return result.rows[0] ?? null;
  },

  async findUserById(db, id) {
    const result = await db.query<UserRow>(
      `SELECT id, mobile, email, password_hash, full_name, preferred_locale,
              user_type, status, mfa_enabled, last_login_at, created_at
         FROM users
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async getUserRoles(db, userId) {
    const result = await db.query<UserRoleRow>(
      `SELECT ur.role_code, ur.warehouse_id, w.name AS warehouse_name,
              ur.zone_id, z.name AS zone_name
         FROM user_roles ur
    LEFT JOIN warehouses w ON w.id = ur.warehouse_id
    LEFT JOIN zones z ON z.id = ur.zone_id
        WHERE ur.user_id = $1
          AND (ur.valid_to IS NULL OR ur.valid_to > now())`,
      [userId],
    );
    return result.rows;
  },

  async getUserPermissions(db, userId) {
    const result = await db.query<{ code: string }>(
      `SELECT DISTINCT p.code
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1
          AND (ur.valid_to IS NULL OR ur.valid_to > now())
          AND rp.scope <> 'none'`,
      [userId],
    );
    return result.rows.map((row) => row.code);
  },

  async createCustomerUser(db, params) {
    const userResult = await db.query<UserRow>(
      `INSERT INTO users (mobile, full_name, email, password_hash, preferred_locale, user_type, status)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', $6)
       RETURNING id, mobile, email, password_hash, full_name, preferred_locale,
                 user_type, status, mfa_enabled, last_login_at, created_at`,
      [
        params.mobile,
        params.fullName,
        params.email ?? null,
        params.passwordHash,
        params.preferredLocale,
        params.status ?? 'ACTIVE',
      ],
    );
    const user = userResult.rows[0]!;

    // Assign CUSTOMER role
    const roleResult = await db.query<{ id: string }>(
      `SELECT id FROM roles WHERE code = 'CUSTOMER' LIMIT 1`,
    );
    if (roleResult.rows[0] !== undefined) {
      await db.query(
        `INSERT INTO user_roles (user_id, role_id, role_code)
         VALUES ($1, $2, 'CUSTOMER')`,
        [user.id, roleResult.rows[0].id],
      );
    }

    return user;
  },

  async updateUserPassword(db, userId, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [passwordHash, userId],
    );
  },

  async updateUserStatus(db, userId, status) {
    await db.query(
      `UPDATE users SET status = $1, updated_at = now() WHERE id = $2`,
      [status, userId],
    );
  },

  async updateUserLastLogin(db, userId) {
    await db.query(
      `UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
      [userId],
    );
  },

  async createSession(db, params) {
    const result = await db.query<SessionRow>(
      `INSERT INTO sessions (user_id, device_id, platform, user_agent, last_seen_ip, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, device_id, platform, fcm_token, user_agent,
                 last_seen_ip, issued_at, expires_at, last_seen_at, revoked_at,
                 revoked_by, revoke_reason`,
      [
        params.userId,
        params.deviceId ?? null,
        params.platform ?? null,
        params.userAgent ?? null,
        params.ip ?? null,
        params.expiresAt,
      ],
    );
    return result.rows[0]!;
  },

  async findSessionById(db, sessionId) {
    const result = await db.query<SessionRow>(
      `SELECT id, user_id, device_id, platform, fcm_token, user_agent,
              last_seen_ip, issued_at, expires_at, last_seen_at, revoked_at,
              revoked_by, revoke_reason
         FROM sessions
        WHERE id = $1
        LIMIT 1`,
      [sessionId],
    );
    return result.rows[0] ?? null;
  },

  async revokeSession(db, sessionId, revokedBy, reason) {
    await db.query(
      `UPDATE sessions
          SET revoked_at = now(),
              revoked_by = $2,
              revoke_reason = $3,
              updated_at = now()
        WHERE id = $1 AND revoked_at IS NULL`,
      [sessionId, revokedBy ?? null, reason ?? 'REVOKED'],
    );
  },

  async revokeAllUserSessions(db, userId, revokedBy, reason) {
    await db.query(
      `UPDATE sessions
          SET revoked_at = now(),
              revoked_by = $2,
              revoke_reason = $3,
              updated_at = now()
        WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId, revokedBy ?? null, reason ?? 'ALL_SESSIONS_REVOKED'],
    );
  },

  async createRefreshToken(db, params) {
    const result = await db.query<RefreshTokenRow>(
      `INSERT INTO refresh_tokens (session_id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, session_id, user_id, token_hash, issued_at, expires_at,
                 used_at, revoked_at, replaced_by`,
      [params.sessionId, params.userId, params.tokenHash, params.expiresAt],
    );
    return result.rows[0]!;
  },

  async findRefreshTokenByHash(db, tokenHash) {
    const result = await db.query<RefreshTokenRow>(
      `SELECT id, session_id, user_id, token_hash, issued_at, expires_at,
              used_at, revoked_at, replaced_by
         FROM refresh_tokens
        WHERE token_hash = $1
        LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  },

  async rotateRefreshToken(db, oldTokenId, params) {
    const newRow = await this.createRefreshToken(db, params);
    await db.query(
      `UPDATE refresh_tokens
          SET used_at = now(),
              replaced_by = $2,
              updated_at = now()
        WHERE id = $1`,
      [oldTokenId, newRow.id],
    );
    return newRow;
  },

  async revokeSessionTokenFamily(db, sessionId, reason) {
    await db.query(
      `UPDATE refresh_tokens
          SET revoked_at = now(),
              updated_at = now()
        WHERE session_id = $1 AND revoked_at IS NULL`,
      [sessionId],
    );
    await this.revokeSession(db, sessionId, undefined, reason);
  },

  async createOtpVerification(db, params) {
    const result = await db.query<OtpVerificationRow>(
      `INSERT INTO otp_verifications (user_id, mobile, purpose, code_hash, max_attempts, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, mobile, purpose, code_hash, attempts, max_attempts,
                 locked_at, expires_at, consumed_at, resend_count, last_sent_at, created_at`,
      [
        params.userId ?? null,
        params.mobile,
        params.purpose,
        params.codeHash,
        params.maxAttempts,
        params.expiresAt,
      ],
    );
    return result.rows[0]!;
  },

  async findLatestOtp(db, mobile, purpose) {
    const result = await db.query<OtpVerificationRow>(
      `SELECT id, user_id, mobile, purpose, code_hash, attempts, max_attempts,
              locked_at, expires_at, consumed_at, resend_count, last_sent_at, created_at
         FROM otp_verifications
        WHERE mobile = $1 AND purpose = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [mobile, purpose],
    );
    return result.rows[0] ?? null;
  },

  async findOtpById(db, id) {
    const result = await db.query<OtpVerificationRow>(
      `SELECT id, user_id, mobile, purpose, code_hash, attempts, max_attempts,
              locked_at, expires_at, consumed_at, resend_count, last_sent_at, created_at
         FROM otp_verifications
        WHERE id = $1
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async incrementOtpAttempts(db, id, lock) {
    const result = await db.query<OtpVerificationRow>(
      `UPDATE otp_verifications
          SET attempts = attempts + 1,
              locked_at = CASE WHEN $2 = true THEN now() ELSE locked_at END,
              updated_at = now()
        WHERE id = $1
        RETURNING id, user_id, mobile, purpose, code_hash, attempts, max_attempts,
                  locked_at, expires_at, consumed_at, resend_count, last_sent_at, created_at`,
      [id, lock],
    );
    return result.rows[0] ?? null;
  },

  async consumeOtp(db, id) {
    await db.query(
      `UPDATE otp_verifications
          SET consumed_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [id],
    );
  },
};
