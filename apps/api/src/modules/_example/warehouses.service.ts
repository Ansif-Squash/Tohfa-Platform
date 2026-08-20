/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.service.ts holds the business logic and is the ONLY layer that makes
 * authorization decisions beyond "does the actor hold this permission".
 * Rules:
 *  - Take the `ResolvedScope` produced by `requirePermission`, never a Request.
 *    That keeps the service callable from a job, a script or a test.
 *  - Translate the scope into a SQL filter with `scopedWhere` and hand it to
 *    the repo. Cross-scope rows come back EMPTY, never 403 — see
 *    requirePermission.ts for why.
 *  - Evaluate `conditional` predicates with `assertPredicate` after loading the
 *    target row and before any state change.
 *  - Wrap multi-statement writes in `withTransaction` and write the audit row
 *    with the same client.
 *  - Throw `AppError` with a domain `ErrorCode`; never return an error shape.
 */
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import { warehousesRepo, type WarehousesRepo } from './warehouses.repo.js';
import type {
  ListWarehousesQuery,
  ListWarehousesResponse,
  WarehouseResponse,
} from './warehouses.schema.js';

export interface WarehousesServiceDeps {
  repo: WarehousesRepo;
  db: Executor;
}

/**
 * Dependencies are injected with defaults. Production code calls
 * `warehousesService`; tests call `createWarehousesService({ repo: fake })`.
 */
export function createWarehousesService(
  deps: Partial<WarehousesServiceDeps> = {},
): WarehousesService {
  const repo = deps.repo ?? warehousesRepo;
  const db = deps.db ?? pool;

  return {
    async list(scope, filters): Promise<ListWarehousesResponse> {
      // `w.id` is the warehouse column for this table; a Sub Warehouse Admin is
      // therefore confined to the row for their own warehouse.
      const scopeFilter = scopedWhere(scope, { warehouseColumn: 'w.id', startIndex: 1 });

      const { items, total } = await repo.list(db, { filters, scope: scopeFilter });

      return {
        items,
        page: filters.page,
        pageSize: filters.pageSize,
        total,
      };
    },

    async getById(scope, id): Promise<WarehouseResponse> {
      const scopeFilter = scopedWhere(scope, { warehouseColumn: 'w.id', startIndex: 2 });
      const warehouse = await repo.findById(db, id, scopeFilter);

      if (warehouse === null) {
        // NOTE: 404 rather than 403 when the row exists but is out of scope.
        // Returning 403 would confirm the row's existence to an actor who is
        // not allowed to know about it.
        throw new AppError('NOT_FOUND', { detail: `No warehouse with id ${id} is visible to you.` });
      }

      return warehouse;
    },
  };
}

export interface WarehousesService {
  list(scope: ResolvedScope, filters: ListWarehousesQuery): Promise<ListWarehousesResponse>;
  getById(scope: ResolvedScope, id: string): Promise<WarehouseResponse>;
}

/** The production instance. */
export const warehousesService: WarehousesService = createWarehousesService();
