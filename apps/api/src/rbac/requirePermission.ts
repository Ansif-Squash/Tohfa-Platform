/**
 * ===========================================================================
 * requirePermission — THE authorization primitive for the whole platform.
 * ===========================================================================
 *
 * READ THIS BEFORE WRITING ANY ROUTE. Every module copies this pattern; if you
 * find yourself writing `if (actor.role === 'SUPER_ADMIN')` inside a handler,
 * stop — that check belongs in docs/rbac.json.
 *
 * ---------------------------------------------------------------------------
 * The model
 * ---------------------------------------------------------------------------
 * docs/rbac.json maps (permission code, role code) -> scope level:
 *
 *   all          unrestricted across the system
 *   conditional  allowed EXCEPT where the permission's `predicate` forbids it
 *                (e.g. NOT_OWN_LISTING — a Farmer Admin may approve peer
 *                listings but never their own)
 *   own          only rows the actor owns / is assigned to; a server-side
 *                predicate is injected into the query
 *   view         read-only; any mutating verb is rejected
 *   none         denied
 *
 * An actor may hold several roles (a Farmer Admin who is also a Farmer). We
 * resolve the HIGHEST scope any of their roles grants for the permission, then
 * hand the handler a `req.scope` describing what it is allowed to touch.
 *
 * ---------------------------------------------------------------------------
 * The contract with handlers
 * ---------------------------------------------------------------------------
 * 1. `requirePermission(code)` rejects `none` with 403 and never reaches the
 *    handler. A missing/expired token is rejected as 401 by `requireAuth`.
 * 2. `view` scope rejects non-GET/HEAD requests with 403.
 * 3. On success `req.scope` is set. `scope.level === 'all'` means "no filter".
 *    ANY other level means the handler MUST narrow its query. Use
 *    `scopedWhere(req, { warehouseColumn, zoneColumn, farmerColumn, ... })`,
 *    which returns a SQL fragment plus positional params.
 * 4. Cross-scope reads return an EMPTY RESULT SET, not a 403 (docs/rbac.json
 *    `scopeFilters`: "Cross-warehouse rows return empty, never 403"). That is
 *    why the filter is a WHERE clause rather than a post-hoc check — a 403
 *    would leak the existence of the row.
 * 5. `conditional` scope means a predicate still has to be evaluated against
 *    the concrete target row inside the service, AFTER loading it. The
 *    middleware cannot do it — it does not know the row yet. It surfaces the
 *    predicate name on `req.scope.predicate` and the service must call
 *    `assertPredicate(...)` (see below) or throw the documented error.
 *
 * ---------------------------------------------------------------------------
 * Usage
 * ---------------------------------------------------------------------------
 * ```ts
 * router.get(
 *   '/',
 *   requireAuth,
 *   requirePermission('warehouse.all.view'),
 *   validate({ query: listQuery }),
 *   asyncHandler(async (req, res) => {
 *     const scope = requireScope(req.scope);
 *     res.json(await service.list(scope, getValidated(req, 'query', listQuery)));
 *   }),
 * );
 * ```
 */
import type { Request, RequestHandler } from 'express';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../http/problem.js';
import { assignedWarehouseIds, assignedZoneIds, type Actor } from '../auth/requireAuth.js';
import { loadRbac, type RbacPermission } from './loadRbac.js';

/** Everything a handler needs to know about how far its authority reaches. */
export interface ResolvedScope {
  /** The winning scope level. Never `none` — `none` is rejected upstream. */
  level: Exclude<ScopeLevel, 'none'>;
  /** The permission this scope was resolved for. */
  permission: string;
  /** The role that produced the winning level (highest wins, ties by rank). */
  roleCode: RoleCode;
  /** Warehouse ids the actor is confined to. Empty means "not warehouse-scoped". */
  warehouseIds: string[];
  /** Zone ids the actor is confined to. Empty means "not zone-scoped". */
  zoneIds: string[];
  /** Set when the actor is a farmer and the scope is `own`. */
  farmerId?: string;
  /** Set when the actor is a customer and the scope is `own`. */
  customerId?: string;
  /** The acting user, for self-approval and audit checks. */
  userId: string;
  /** Predicate that the SERVICE must still evaluate (conditional scope only). */
  predicate?: string;
}

/**
 * Ranking used to pick the "highest" scope across an actor's roles.
 *
 * `all` beats everything. `conditional` outranks `own` because it is broader:
 * conditional is "everything except a named exception", own is "only mine".
 * `view` is lowest above `none` because it cannot mutate anything.
 */
const SCOPE_RANK: Record<ScopeLevel, number> = {
  [ScopeLevel.NONE]: 0,
  [ScopeLevel.VIEW]: 1,
  [ScopeLevel.OWN]: 2,
  [ScopeLevel.CONDITIONAL]: 3,
  [ScopeLevel.ALL]: 4,
};

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Resolve the actor's effective scope for a permission. Exported separately
 * from the middleware so services, jobs and tests can ask the same question
 * without an HTTP request.
 */
export function resolveScope(actor: Actor, permissionCode: string): ResolvedScope | null {
  const rbac = loadRbac();
  const permission: RbacPermission = rbac.permission(permissionCode);

  let best: { level: ScopeLevel; role: RoleCode } | null = null;

  for (const assignment of actor.roles) {
    const level = permission.grants[assignment.code] ?? ScopeLevel.NONE;
    if (level === ScopeLevel.NONE) continue;
    if (best === null || SCOPE_RANK[level] > SCOPE_RANK[best.level]) {
      best = { level, role: assignment.code };
    }
  }

  if (best === null) return null;

  // `Exclude<..., 'none'>` is safe: we skipped every `none` grant above.
  const level = best.level as Exclude<ScopeLevel, 'none'>;

  const scope: ResolvedScope = {
    level,
    permission: permissionCode,
    roleCode: best.role,
    warehouseIds: assignedWarehouseIds(actor),
    zoneIds: assignedZoneIds(actor),
    userId: actor.userId,
    ...(actor.farmerId === null ? {} : { farmerId: actor.farmerId }),
    ...(actor.customerId === null ? {} : { customerId: actor.customerId }),
    ...(permission.predicate === undefined ? {} : { predicate: permission.predicate }),
  };

  return scope;
}

/**
 * Express middleware. Place it AFTER `requireAuth` and BEFORE `validate`.
 */
export function requirePermission(permissionCode: string): RequestHandler {
  // Fail fast at wiring time, not at first request: loadRbac throws on an
  // unknown code, which surfaces the typo when the router module is imported.
  loadRbac().permission(permissionCode);

  return (req, _res, next) => {
    try {
      const actor = req.actor;
      if (actor === undefined) {
        throw new AppError('UNAUTHENTICATED', {
          detail: 'requirePermission was used without requireAuth in front of it.',
        });
      }

      const scope = resolveScope(actor, permissionCode);

      if (scope === null) {
        throw new AppError('FORBIDDEN', {
          detail: `Your roles do not grant "${permissionCode}".`,
          meta: { permission: permissionCode, roles: actor.roles.map((r) => r.code) },
        });
      }

      // `view` is read-only by definition. Rejecting here rather than relying
      // on each handler is what makes the guarantee real.
      if (scope.level === ScopeLevel.VIEW && !READ_ONLY_METHODS.has(req.method)) {
        throw new AppError('FORBIDDEN', {
          detail: `"${permissionCode}" is read-only for your role.`,
          meta: { permission: permissionCode, scope: scope.level },
        });
      }

      // A warehouse-dimension role with no warehouse assigned can see nothing;
      // that is a provisioning bug, so say so explicitly instead of returning
      // an empty list that looks like "no data".
      if (
        scope.roleCode === RoleCode.SUB_WH_ADMIN &&
        scope.level !== ScopeLevel.ALL &&
        scope.warehouseIds.length === 0
      ) {
        throw new AppError('WAREHOUSE_SCOPE_VIOLATION', {
          detail: 'Your account has no warehouse assigned. Ask an admin to assign one.',
          meta: { permission: permissionCode },
        });
      }

      if (
        scope.roleCode === RoleCode.FARMER_ADMIN &&
        scope.level !== ScopeLevel.ALL &&
        scope.zoneIds.length === 0
      ) {
        throw new AppError('WAREHOUSE_SCOPE_VIOLATION', {
          detail: 'Your account has no zone assigned. Ask an admin to assign one.',
          meta: { permission: permissionCode },
        });
      }

      req.scope = scope;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Narrow `req.scope` inside a handler. Throws 500 if the middleware is absent. */
export function requireScope(scope: ResolvedScope | undefined): ResolvedScope {
  if (scope === undefined) {
    throw new AppError('FORBIDDEN', {
      status: 500,
      detail: 'Route is missing the requirePermission middleware.',
    });
  }
  return scope;
}

/* ==========================================================================
 * scopedWhere — turn a ResolvedScope into SQL
 * ==========================================================================
 * Returns a fragment you AND into your WHERE clause plus the positional
 * params. Pass `startIndex` when the query already has parameters.
 *
 * ```ts
 * const filter = scopedWhere(scope, {
 *   warehouseColumn: 'w.id',
 *   startIndex: params.length + 1,
 * });
 * const sql = `SELECT ... FROM warehouses w WHERE w.is_active = $1 AND ${filter.sql}`;
 * const rows = await tx.query(sql, [...params, ...filter.params]);
 * ```
 *
 * When the scope imposes no restriction the fragment is the literal `TRUE`,
 * so callers can always interpolate it without branching.
 */
export interface ScopedWhereOptions {
  /** SQL column holding the row's warehouse id, e.g. `'b.warehouse_id'`. */
  warehouseColumn?: string;
  /** SQL column holding the row's zone id, e.g. `'f.zone_id'`. */
  zoneColumn?: string;
  /** SQL column holding the row's owning farmer id. */
  farmerColumn?: string;
  /** SQL column holding the row's owning customer id. */
  customerColumn?: string;
  /** First positional parameter index to use. Default 1. */
  startIndex?: number;
}

export interface ScopedWhere {
  /** SQL boolean expression, never empty. `TRUE` when unrestricted. */
  sql: string;
  /** Values for the placeholders in `sql`, in order. */
  params: unknown[];
  /** Next free positional index, so callers can keep numbering. */
  nextIndex: number;
}

export function scopedWhere(
  scope: ResolvedScope,
  options: ScopedWhereOptions = {},
): ScopedWhere {
  const params: unknown[] = [];
  const clauses: string[] = [];
  let index = options.startIndex ?? 1;

  // `all` sees everything. `conditional` is also unrestricted at the SQL level:
  // its restriction is a row-level predicate the service applies after load.
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) {
    // ...except that a zone-dimension role still only ever sees its own zones,
    // even at `conditional`. See docs/rbac.json scopeFilters[FARMER_ADMIN].
    if (
      scope.roleCode === RoleCode.FARMER_ADMIN &&
      options.zoneColumn !== undefined &&
      scope.zoneIds.length > 0
    ) {
      clauses.push(`${options.zoneColumn} = ANY($${index}::uuid[])`);
      params.push(scope.zoneIds);
      index += 1;
    }
    return finish(clauses, params, index);
  }

  if (options.warehouseColumn !== undefined && scope.warehouseIds.length > 0) {
    clauses.push(`${options.warehouseColumn} = ANY($${index}::uuid[])`);
    params.push(scope.warehouseIds);
    index += 1;
  }

  if (options.zoneColumn !== undefined && scope.zoneIds.length > 0) {
    clauses.push(`${options.zoneColumn} = ANY($${index}::uuid[])`);
    params.push(scope.zoneIds);
    index += 1;
  }

  if (options.farmerColumn !== undefined && scope.farmerId !== undefined) {
    clauses.push(`${options.farmerColumn} = $${index}::uuid`);
    params.push(scope.farmerId);
    index += 1;
  }

  if (options.customerColumn !== undefined && scope.customerId !== undefined) {
    clauses.push(`${options.customerColumn} = $${index}::uuid`);
    params.push(scope.customerId);
    index += 1;
  }

  // A restricted scope that produced no clause would silently read everything.
  // Fail closed instead: emit FALSE so the query returns nothing, and let the
  // (loud) empty result plus this comment lead the developer back here.
  if (clauses.length === 0) {
    return { sql: 'FALSE', params: [], nextIndex: index };
  }

  return finish(clauses, params, index);
}

function finish(clauses: string[], params: unknown[], nextIndex: number): ScopedWhere {
  return {
    sql: clauses.length === 0 ? 'TRUE' : clauses.map((c) => `(${c})`).join(' AND '),
    params,
    nextIndex,
  };
}

/**
 * Evaluate a `conditional` predicate against a concrete row.
 *
 * The middleware cannot do this — it has not loaded the row yet. Services call
 * this immediately after fetching the target, before any state change.
 *
 * Only NOT_OWN_LISTING and OWN_ZONE_ONLY are implemented here because they are
 * the two the base platform needs; the others land with their own stories.
 */
export interface PredicateSubject {
  /** User id that created/owns the target row. */
  ownerUserId?: string | undefined;
  /** Farmer id that owns the target row. */
  ownerFarmerId?: string | undefined;
  /** Zone the target row belongs to. */
  zoneId?: string | undefined;
  /** Role level of the target admin (for LOWER_ROLES_ONLY). */
  targetRoleLevel?: number | undefined;
  /** Role level of the acting admin (for LOWER_ROLES_ONLY). */
  actorRoleLevel?: number | undefined;
}

export function assertPredicate(scope: ResolvedScope, subject: PredicateSubject): void {
  if (scope.level !== ScopeLevel.CONDITIONAL || scope.predicate === undefined) return;

  switch (scope.predicate) {
    case 'NOT_OWN_LISTING': {
      const isOwn =
        (subject.ownerUserId !== undefined && subject.ownerUserId === scope.userId) ||
        (subject.ownerFarmerId !== undefined && subject.ownerFarmerId === scope.farmerId);
      if (isOwn) {
        // docs/rbac.json says onViolation = auto_route_to_other_admin. The
        // routing itself is the caller's job; this guarantees the state change
        // cannot happen here.
        throw new AppError('SELF_APPROVAL_FORBIDDEN', {
          detail: 'This listing is your own; it has been routed to another admin.',
          meta: { predicate: scope.predicate },
        });
      }
      return;
    }

    case 'OWN_ZONE_ONLY': {
      if (subject.zoneId === undefined || !scope.zoneIds.includes(subject.zoneId)) {
        throw new AppError('WAREHOUSE_SCOPE_VIOLATION', {
          detail: 'The target belongs to a zone you are not assigned to.',
          meta: { predicate: scope.predicate },
        });
      }
      return;
    }

    case 'LOWER_ROLES_ONLY': {
      const { actorRoleLevel, targetRoleLevel } = subject;
      if (
        actorRoleLevel === undefined ||
        targetRoleLevel === undefined ||
        targetRoleLevel <= actorRoleLevel
      ) {
        throw new AppError('FORBIDDEN', {
          detail: 'You may only act on accounts below your own role level.',
          meta: { predicate: scope.predicate },
        });
      }
      return;
    }

    default:
      // TODO(STORY-AUTH-07): implement SUPPORT_ONLY once the audit module lands.
      throw new AppError('FORBIDDEN', {
        status: 501,
        detail: `Predicate "${scope.predicate}" is not implemented yet.`,
        meta: { predicate: scope.predicate },
      });
  }
}

/** Convenience for reading the scope off a Request in a service boundary test. */
export function scopeOf(req: Request): ResolvedScope {
  return requireScope(req.scope);
}
