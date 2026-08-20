/**
 * Authentication middleware.
 *
 * Populates `req.actor`. It does NOT authorise anything — that is
 * `requirePermission`'s job. Keeping the two separate is what stops role checks
 * leaking into handlers.
 */
import type { RequestHandler } from 'express';
import { type RoleCode } from '@tohfa/shared-types';
import { AppError } from '../http/problem.js';
import { currentContext } from '../logger.js';
import { verifyAccessToken, type RoleAssignment } from './jwt.js';

/** The authenticated caller for the lifetime of one request. */
export interface Actor {
  userId: string;
  roles: RoleAssignment[];
  /** Present when the user is a farmer; used by `own`-scope predicates. */
  farmerId: string | null;
  /** Present when the user is a customer; used by `own`-scope predicates. */
  customerId: string | null;
}

export function hasRole(actor: Actor, code: RoleCode): boolean {
  return actor.roles.some((role) => role.code === code);
}

/** Every warehouse id this actor is assigned to (Sub Warehouse Admins). */
export function assignedWarehouseIds(actor: Actor): string[] {
  return actor.roles
    .map((role) => role.warehouseId)
    .filter((id): id is string => typeof id === 'string');
}

/** Every zone id this actor is assigned to (Farmer Admins). */
export function assignedZoneIds(actor: Actor): string[] {
  return actor.roles
    .map((role) => role.zoneId)
    .filter((id): id is string => typeof id === 'string');
}

function bearerToken(header: string | undefined): string {
  if (header === undefined || !header.startsWith('Bearer ')) {
    throw new AppError('UNAUTHENTICATED', {
      detail: 'Expected an `Authorization: Bearer <token>` header.',
    });
  }
  const token = header.slice('Bearer '.length).trim();
  if (token.length === 0) {
    throw new AppError('UNAUTHENTICATED', { detail: 'Bearer token is empty.' });
  }
  return token;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    const payload = verifyAccessToken(bearerToken(req.header('authorization')));

    req.actor = {
      userId: payload.sub,
      roles: payload.roles,
      farmerId: payload.farmerId,
      customerId: payload.customerId,
    };

    // Attach the user to the ambient log context so every subsequent line in
    // this request is attributable.
    const context = currentContext();
    if (context !== undefined) context.userId = payload.sub;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attach `req.actor` when a token is present, but do not fail when it is not.
 * Used by endpoints that are public but richer when authenticated (catalog).
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (header === undefined) {
    next();
    return;
  }
  requireAuth(req, _res, next);
};

/** Narrow `req.actor` for handlers that ran behind `requireAuth`. */
export function requireActor(actor: Actor | undefined): Actor {
  if (actor === undefined) {
    throw new AppError('UNAUTHENTICATED', {
      detail: 'Route is missing the requireAuth middleware.',
      status: 500,
    });
  }
  return actor;
}
