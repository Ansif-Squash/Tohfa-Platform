/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * Two layers of test, always:
 *
 *  1. SERVICE tests with a fake repo. Fast, no I/O, and they are where the
 *     business rules and the scope behaviour are actually asserted. Assert on
 *     the SQL fragment the service hands the repo — that fragment IS the
 *     security boundary, so it deserves a direct assertion.
 *
 *  2. ONE integration test against a real pool. It proves the SQL parses and
 *     the column names match the migrations. It soft-skips when there is no
 *     reachable database or the table has not been migrated yet, so the suite
 *     is green on a laptop with Docker stopped.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import { createWarehousesService } from './warehouses.service.js';
import type { ListArgs, ListResult, WarehousesRepo } from './warehouses.repo.js';
import type { ListWarehousesQuery } from './warehouses.schema.js';
import type { WarehouseResponse } from './warehouses.schema.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import {
  IDS,
  aScope,
  aWarehouse,
  databaseReady,
  describeIfDatabase,
} from '../../test/factories.js';

interface RecordingRepo extends WarehousesRepo {
  lastList: ListArgs | null;
  lastFindScope: ScopedWhere | null;
}

/** Records what the service asked for, so the test can assert on the filter. */
function fakeRepo(rows: WarehouseResponse[]): RecordingRepo {
  const repo: RecordingRepo = {
    lastList: null,
    lastFindScope: null,
    async list(_db: Executor, args: ListArgs): Promise<ListResult> {
      repo.lastList = args;
      return { items: rows, total: rows.length };
    },
    async findById(
      _db: Executor,
      id: string,
      scope: ScopedWhere,
    ): Promise<WarehouseResponse | null> {
      repo.lastFindScope = scope;
      return rows.find((row) => row.id === id) ?? null;
    },
  };
  return repo;
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

const baseFilters: ListWarehousesQuery = { page: 1, pageSize: 20 };

describe('warehousesService.list', () => {
  it('returns a paginated envelope built from the repo result', async () => {
    const repo = fakeRepo([aWarehouse(), aWarehouse({ id: IDS.warehouseCoonoor, code: 'WH-COON' })]);
    const service = createWarehousesService({ repo, db: noopDb });

    const result = await service.list(aScope(), baseFilters);

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items.map((w) => w.code)).toEqual(['WH-OOTY', 'WH-COON']);
  });

  it('applies no SQL restriction for an "all" scope', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.list(aScope({ level: ScopeLevel.ALL }), baseFilters);

    expect(repo.lastList?.scope.sql).toBe('TRUE');
    expect(repo.lastList?.scope.params).toEqual([]);
  });

  it('confines a Sub Warehouse Admin to their assigned warehouse ids', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.list(
      aScope({
        level: ScopeLevel.OWN,
        roleCode: RoleCode.SUB_WH_ADMIN,
        warehouseIds: [IDS.warehouseOoty],
      }),
      baseFilters,
    );

    expect(repo.lastList?.scope.sql).toContain('w.id = ANY($1::uuid[])');
    expect(repo.lastList?.scope.params).toEqual([[IDS.warehouseOoty]]);
  });

  it('fails closed when a restricted scope produces no usable filter', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    // `own` scope with nothing to scope BY must not read every row.
    await service.list(
      aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [] }),
      baseFilters,
    );

    expect(repo.lastList?.scope.sql).toBe('FALSE');
  });
});

describe('warehousesService.getById', () => {
  it('returns the warehouse when it is visible', async () => {
    const repo = fakeRepo([aWarehouse()]);
    const service = createWarehousesService({ repo, db: noopDb });

    const warehouse = await service.getById(aScope(), IDS.warehouseOoty);

    expect(warehouse.code).toBe('WH-OOTY');
  });

  it('raises NOT_FOUND — not FORBIDDEN — for a row outside the scope', async () => {
    const repo = fakeRepo([aWarehouse()]);
    const service = createWarehousesService({ repo, db: noopDb });

    await expect(service.getById(aScope(), IDS.warehouseCoonoor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    // Explicitly: leaking 403 here would confirm the row exists.
    const error = await service.getById(aScope(), IDS.warehouseCoonoor).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
  });

  it('numbers the scope placeholders after the id parameter', async () => {
    const repo = fakeRepo([aWarehouse()]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.getById(
      aScope({
        level: ScopeLevel.OWN,
        roleCode: RoleCode.SUB_WH_ADMIN,
        warehouseIds: [IDS.warehouseOoty],
      }),
      IDS.warehouseOoty,
    );

    // $1 is the id, so the scope fragment must start at $2.
    expect(repo.lastFindScope?.sql).toContain('$2');
  });
});

describeIfDatabase('warehousesService (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('warehouses');
    if (!ready) {
      console.warn(
        '[skip] no reachable `warehouses` table — run `docker compose up -d && pnpm db:migrate`',
      );
    }
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the real list query against Postgres', async () => {
    if (!ready) return;

    const { pool } = await import('../../db/pool.js');
    const service = createWarehousesService({ db: pool });

    const result = await service.list(aScope(), baseFilters);

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});
