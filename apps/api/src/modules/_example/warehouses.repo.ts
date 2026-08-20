/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.repo.ts is the ONLY place that writes SQL for this module.
 * Rules:
 *  - Every function takes an `Executor` first so the service can compose calls
 *    inside one transaction (`withTransaction`).
 *  - Values are always positional params (`$1`), never string-interpolated.
 *    The ONE exception is a pre-built scope fragment from `scopedWhere`, whose
 *    column names come from our own code and whose values are still params.
 *  - Rows are mapped to the domain shape HERE, so snake_case never escapes
 *    this file.
 *  - No authorization decisions live here — the repo applies the filter it is
 *    handed; deciding what that filter is, is the service's job.
 */
import type { Executor } from '../../db/pool.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import type { ListWarehousesQuery, WarehouseResponse, WarehouseType } from './warehouses.schema.js';

/** Raw row shape as it comes out of Postgres. Never leaves this file. */
interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  type: string;
  city: string | null;
  capacity_kg: string | null;
  is_active: boolean;
  created_at: Date;
}

function toWarehouse(row: WarehouseRow): WarehouseResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type as WarehouseType,
    city: row.city,
    // capacity_kg is NUMERIC, which pg hands us as a string on purpose.
    capacityKg: row.capacity_kg === null ? null : Number(row.capacity_kg),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

export interface ListArgs {
  filters: ListWarehousesQuery;
  /** Scope fragment produced by `scopedWhere(scope, { warehouseColumn: 'w.id' })`. */
  scope: ScopedWhere;
}

export interface ListResult {
  items: WarehouseResponse[];
  total: number;
}

/**
 * The repository interface. The service depends on THIS, not on the concrete
 * implementation, which is what makes `warehouses.test.ts` able to run with a
 * plain object stub and no database.
 */
export interface WarehousesRepo {
  list(db: Executor, args: ListArgs): Promise<ListResult>;
  findById(db: Executor, id: string, scope: ScopedWhere): Promise<WarehouseResponse | null>;
}

const SELECT_COLUMNS = `
  w.id, w.code, w.name, w.type, w.city, w.capacity_kg, w.is_active, w.created_at
`;

export const warehousesRepo: WarehousesRepo = {
  async list(db, { filters, scope }): Promise<ListResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.q !== undefined) {
      params.push(`%${filters.q}%`);
      conditions.push(`(w.name ILIKE $${params.length} OR w.code ILIKE $${params.length})`);
    }
    if (filters.type !== undefined) {
      params.push(filters.type);
      conditions.push(`w.type = $${params.length}`);
    }
    if (filters.isActive !== undefined) {
      params.push(filters.isActive);
      conditions.push(`w.is_active = $${params.length}`);
    }

    // Every table in db/migrations carries `deleted_at`; soft-deleted rows are
    // invisible to the API unless a story explicitly asks for them.
    conditions.push('w.deleted_at IS NULL');

    // Re-number the scope fragment so it continues this query's placeholders.
    const scoped = renumber(scope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');

    const countResult = await db.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM warehouses w WHERE ${where}`,
      params,
    );

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const rows = await db.query<WarehouseRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM warehouses w
        WHERE ${where}
        ORDER BY w.code ASC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
    );

    return {
      items: rows.rows.map(toWarehouse),
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  },

  async findById(db, id, scope): Promise<WarehouseResponse | null> {
    const params: unknown[] = [id];
    const scoped = renumber(scope, 2);
    params.push(...scoped.params);

    const result = await db.query<WarehouseRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM warehouses w
        WHERE w.id = $1 AND w.deleted_at IS NULL AND ${scoped.sql}
        LIMIT 1`,
      params,
    );

    const row = result.rows[0];
    return row === undefined ? null : toWarehouse(row);
  },
};

/**
 * `scopedWhere` numbers its placeholders from a chosen start index. When a
 * query builds its own filters first, the fragment has to be shifted. Building
 * it with the right `startIndex` up front is preferred; this exists for the
 * cases where the count is only known later.
 */
function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  if (scope.params.length === 0) return scope;

  let next = startIndex;
  const sql = scope.sql.replace(/\$(\d+)/g, () => `$${next++}`);
  return { sql, params: scope.params, nextIndex: next };
}
