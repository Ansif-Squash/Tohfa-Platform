/**
 * Audit trail (BR-35).
 *
 * RULE: the audit row is written with the SAME client as the business change,
 * inside the same transaction. If the change rolls back, so does its audit
 * entry — an audit log that records things that never happened is worse than
 * no audit log. That is why `writeAuditLog` takes an `Executor` and never
 * reaches for the pool itself.
 *
 * `audit_log` is APPEND ONLY: db/migrations/0008_platform.sql blocks
 * UPDATE/DELETE/TRUNCATE with a trigger and revokes them from the app role.
 * Do not attempt to "correct" a row — write a compensating one.
 *
 * BR-35b: a DENIED request also writes a row. Use `outcome: 'DENIED'` from the
 * error path rather than skipping the write.
 *
 * ```ts
 * await withTransaction(async (tx) => {
 *   const updated = await repo.approve(tx, listingId);
 *   await writeAuditLog(tx, {
 *     actorId: scope.userId,
 *     actorRole: scope.roleCode,
 *     actionCode: 'listing.approve',
 *     entityType: 'listing',
 *     entityId: listingId,
 *     before: previous,
 *     after: updated,
 *   });
 *   return updated;
 * });
 * ```
 */
import type { Executor } from '../db/pool.js';
import { currentTraceId } from '../logger.js';

/** Mirrors the `audit_actor_type` enum in db/migrations/0008_platform.sql. */
export type AuditActorType = 'USER' | 'SYSTEM' | 'JOB' | 'INTEGRATION';

export type AuditOutcome = 'ALLOWED' | 'DENIED' | 'ERROR';

export interface AuditEntry {
  /** users.id of the actor. Null for SYSTEM/JOB actors. */
  actorId: string | null;
  /** Defaults to USER; background jobs must pass 'JOB'. */
  actorType?: AuditActorType;
  /** Role code the actor was acting under, when known. */
  actorRole?: string;
  /** Permission code or domain verb, e.g. `listing.approve`. */
  actionCode: string;
  /** Table/aggregate name, e.g. `listing`, `payout`, `stock_batch`. */
  entityType: string;
  /** Primary key of the affected row. Null for actions with no single target. */
  entityId: string | null;
  /** Warehouse the action touched, for warehouse-scoped audit queries. */
  warehouseId?: string;
  /** Defaults to ALLOWED. Denials must be recorded too (BR-35b). */
  outcome?: AuditOutcome;
  /** Row state before the change. Omit for creates. */
  before?: unknown;
  /** Row state after the change. Omit for deletes. */
  after?: unknown;
  /** Names of the fields that changed; lets the UI diff without parsing jsonb. */
  changedFields?: string[];
  ip?: string;
  userAgent?: string;
}

const INSERT_SQL = `
  INSERT INTO audit_log (
    actor_id, actor_type, actor_role, action_code, entity_type, entity_id,
    warehouse_id, outcome, before, after, changed_fields, ip, user_agent,
    correlation_id
  )
  VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9::jsonb, $10::jsonb, $11::text[], $12::inet, $13,
    $14::uuid
  )
  RETURNING id
`;

export async function writeAuditLog(tx: Executor, entry: AuditEntry): Promise<string> {
  // correlation_id is a uuid column; a client-supplied non-uuid trace id would
  // fail the cast, so only pass it through when it really is one.
  const traceId = currentTraceId();
  const correlationId =
    traceId !== undefined && /^[0-9a-f-]{36}$/i.test(traceId) ? traceId : null;

  const result = await tx.query<{ id: string }>(INSERT_SQL, [
    entry.actorId,
    entry.actorType ?? 'USER',
    entry.actorRole ?? null,
    entry.actionCode,
    entry.entityType,
    entry.entityId,
    entry.warehouseId ?? null,
    entry.outcome ?? 'ALLOWED',
    entry.before === undefined ? null : JSON.stringify(entry.before),
    entry.after === undefined ? null : JSON.stringify(entry.after),
    entry.changedFields ?? null,
    entry.ip ?? null,
    entry.userAgent ?? null,
    correlationId,
  ]);

  const row = result.rows[0];
  if (row === undefined) {
    throw new Error('audit_log insert returned no row');
  }
  return row.id;
}

/** Shallow diff helper for `changedFields`. Ignores keys added or removed. */
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  return Object.keys(after).filter(
    (key) => key in before && JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
}
