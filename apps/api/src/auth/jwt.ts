/**
 * JWT issue + verify.
 *
 * Access tokens are short-lived and carry the actor's role assignments so that
 * `requirePermission` can resolve scope without a DB round-trip on every
 * request. Refresh tokens carry nothing but the subject and a token id — the
 * roles are re-read from the database at refresh time, so a revoked role stops
 * working within one access-token lifetime (default 15 minutes).
 */
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { RoleCode } from '@tohfa/shared-types';
import { config } from '../config.js';
import { AppError } from '../http/problem.js';

export const ISSUER = 'tohfa-api';
export const AUDIENCE = 'tohfa-clients';

/** One role assignment. Warehouse/zone are present only for scoped roles. */
export const roleAssignmentSchema = z.object({
  code: z.enum([
    RoleCode.SUPER_ADMIN,
    RoleCode.TOHFA_ADMIN,
    RoleCode.FARMER_ADMIN,
    RoleCode.MAIN_WH_ADMIN,
    RoleCode.SUB_WH_ADMIN,
    RoleCode.FARMER,
    RoleCode.CUSTOMER,
  ]),
  warehouseId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
});
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;

const accessPayloadSchema = z.object({
  sub: z.string().min(1),
  typ: z.literal('access'),
  roles: z.array(roleAssignmentSchema).min(1),
  /** Denormalised for convenience; `null` for admin users with no farmer row. */
  farmerId: z.string().uuid().nullable().default(null),
  customerId: z.string().uuid().nullable().default(null),
});
export type AccessPayload = z.infer<typeof accessPayloadSchema>;

const refreshPayloadSchema = z.object({
  sub: z.string().min(1),
  typ: z.literal('refresh'),
  /** Opaque id of the stored refresh-token row, so it can be revoked. */
  jti: z.string().min(1),
});
export type RefreshPayload = z.infer<typeof refreshPayloadSchema>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function sign(payload: object, ttl: string): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ttl,
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
}

export function signAccessToken(payload: Omit<AccessPayload, 'typ'>): string {
  return sign({ ...payload, typ: 'access' }, config.JWT_ACCESS_TTL);
}

export function signRefreshToken(payload: Omit<RefreshPayload, 'typ'>): string {
  return sign({ ...payload, typ: 'refresh' }, config.JWT_REFRESH_TTL);
}

export function signTokenPair(
  access: Omit<AccessPayload, 'typ'>,
  refresh: Omit<RefreshPayload, 'typ'>,
): TokenPair {
  return {
    accessToken: signAccessToken(access),
    refreshToken: signRefreshToken(refresh),
  };
}

function verifyRaw(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string') {
      throw new AppError('UNAUTHENTICATED', { detail: 'Token payload is not an object.' });
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('UNAUTHENTICATED', {
      detail: 'Token is invalid or has expired.',
      cause: error,
    });
  }
}

export function verifyAccessToken(token: string): AccessPayload {
  const parsed = accessPayloadSchema.safeParse(verifyRaw(token));
  if (!parsed.success) {
    throw new AppError('UNAUTHENTICATED', { detail: 'Access token payload is malformed.' });
  }
  return parsed.data;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const parsed = refreshPayloadSchema.safeParse(verifyRaw(token));
  if (!parsed.success) {
    throw new AppError('UNAUTHENTICATED', { detail: 'Refresh token payload is malformed.' });
  }
  return parsed.data;
}
