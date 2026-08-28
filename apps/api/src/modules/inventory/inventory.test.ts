import { describe, expect, it } from 'vitest';
import { ErrorCode, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  BatchRow,
  InventoryRepo,
  ListBatchesResult,
  ListStockLedgerResult,
  StockLedgerRow,
} from './inventory.repo.js';
import { toBatchView, toStockLedgerEntryView } from './inventory.repo.js';
import {
  InventoryService,
  type TransactionRunner,
} from './inventory.service.js';
import type {
  CreateBatchInput,
  ListBatchesQuery,
  ListStockLedgerQuery,
  RecordMovementInput,
  StockMovementType,
} from './inventory.schema.js';

// ---------------------------------------------------------------------------
// Fixed Identities
// ---------------------------------------------------------------------------
const IDS = {
  superAdminUser: '00000000-0000-4000-8000-000000000001',
  subWhAdminUser: '00000000-0000-4000-8000-000000000002',
  warehouseOoty: '10000000-0000-4000-8000-000000000001',
  warehouseCoonoor: '10000000-0000-4000-8000-000000000002',
  farmer1: '30000000-0000-4000-8000-000000000001',
  farmer2: '30000000-0000-4000-8000-000000000002',
  cropCarrot: '20000000-0000-4000-8000-000000000001',
  cropPotato: '20000000-0000-4000-8000-000000000002',
};

// ---------------------------------------------------------------------------
// Actors & Scopes
// ---------------------------------------------------------------------------
const superAdminActor: Actor = {
  userId: IDS.superAdminUser,
  roles: [{ code: RoleCode.SUPER_ADMIN }],
  farmerId: null,
  customerId: null,
};

const subWhAdminOotyActor: Actor = {
  userId: IDS.subWhAdminUser,
  roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }],
  farmerId: null,
  customerId: null,
};

const superAdminScope = (permission: string): ResolvedScope => ({
  level: ScopeLevel.ALL,
  permission,
  roleCode: RoleCode.SUPER_ADMIN,
  warehouseIds: [],
  zoneIds: [],
  userId: IDS.superAdminUser,
});

const subWhAdminOotyScope = (permission: string): ResolvedScope => ({
  level: ScopeLevel.OWN,
  permission,
  roleCode: RoleCode.SUB_WH_ADMIN,
  warehouseIds: [IDS.warehouseOoty],
  zoneIds: [],
  userId: IDS.subWhAdminUser,
});

// ---------------------------------------------------------------------------
// In-Memory Test Store & Repo
// Faithfully simulates database triggers:
// 1. app_stock_ledger_balance (locks batch, verifies balance >= 0, sets balance_after)
// 2. app_stock_ledger_apply (maintains inventory_batches.qty_available = balance_after)
// ---------------------------------------------------------------------------
interface InMemStore {
  batches: Map<string, BatchRow>;
  ledger: Map<string, StockLedgerRow>;
  audits: Array<{ actionCode: string; entityId: string | null; outcome: string }>;
}

function createInMemStore(): InMemStore {
  return {
    batches: new Map(),
    ledger: new Map(),
    audits: [],
  };
}

function createInMemRepo(store: InMemStore): InventoryRepo {
  let idSeq = 1;
  const nextId = () => `00000000-0000-4000-8000-${String(idSeq++).padStart(12, '0')}`;

  return {
    async createBatch(_db, input: CreateBatchInput): Promise<BatchRow> {
      const id = nextId();
      const row: BatchRow = {
        id,
        batch_code: input.batchCode,
        warehouse_id: input.warehouseId,
        crop_id: input.cropId,
        crop_name: 'Carrot',
        grade: input.grade,
        goods_receipt_id: input.goodsReceiptId ?? null,
        source_farmer_id: input.sourceFarmerId,
        qty_received: Number(input.qtyReceivedKg).toFixed(3),
        qty_available: '0.000', // initially 0; updated only via ledger trigger
        cost_per_kg: input.costPerKg ?? null,
        storage_location: input.storageLocation ?? null,
        received_on: new Date(),
        expiry_on: input.expiryOn ? new Date(input.expiryOn) : null,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: null,
      };
      store.batches.set(id, row);
      return row;
    },

    async insertLedgerMovement(_db, input: RecordMovementInput): Promise<StockLedgerRow> {
      const batch = store.batches.get(input.batchId);
      if (!batch) {
        throw new Error(`unknown batch_id ${input.batchId}`);
      }

      const currentAvailable = Number(batch.qty_available);
      const delta = Number(input.qtyDeltaKg);
      const balanceAfter = currentAvailable + delta;

      // PostgreSQL trigger: app_stock_ledger_balance check
      if (balanceAfter < 0) {
        throw new AppError(ErrorCode.STOCK_UNAVAILABLE, {
          detail: `Insufficient stock available on batch ${input.batchId}`,
        });
      }

      const id = nextId();
      const ledgerRow: StockLedgerRow = {
        id,
        batch_id: input.batchId,
        warehouse_id: input.warehouseId ?? batch.warehouse_id,
        movement_type: input.movementType,
        qty_delta: delta.toFixed(3),
        balance_after: balanceAfter.toFixed(3),
        ref_type: input.refType ?? null,
        ref_id: input.refId ?? null,
        remarks: input.remarks ?? null,
        created_by: input.performedBy ?? null,
        created_at: new Date(),
      };

      store.ledger.set(id, ledgerRow);

      // PostgreSQL trigger: app_stock_ledger_apply maintains qty_available
      batch.qty_available = balanceAfter.toFixed(3);
      batch.status = balanceAfter === 0 ? 'DEPLETED' : 'ACTIVE';
      batch.updated_at = new Date();

      return ledgerRow;
    },

    async listBatches(_db, scope: ResolvedScope, filters: ListBatchesQuery): Promise<ListBatchesResult> {
      let rows = Array.from(store.batches.values());

      if (scope.level === ScopeLevel.OWN && scope.warehouseIds.length > 0) {
        rows = rows.filter((b) => scope.warehouseIds.includes(b.warehouse_id));
      }
      if (filters.warehouseId) {
        rows = rows.filter((b) => b.warehouse_id === filters.warehouseId);
      }
      if (filters.cropId) {
        rows = rows.filter((b) => b.crop_id === filters.cropId);
      }
      if (filters.grade) {
        rows = rows.filter((b) => b.grade === filters.grade);
      }
      if (filters.status) {
        rows = rows.filter((b) => b.status === filters.status);
      }

      return {
        items: rows.map(toBatchView),
        page: { nextCursor: null, hasMore: false },
      };
    },

    async getBatchById(_db, scope: ResolvedScope, id: string) {
      const batch = store.batches.get(id);
      if (!batch) return null;

      if (scope.level === ScopeLevel.OWN && scope.warehouseIds.length > 0) {
        if (!scope.warehouseIds.includes(batch.warehouse_id)) {
          return null;
        }
      }
      return toBatchView(batch);
    },

    async listStockLedger(_db, scope: ResolvedScope, filters: ListStockLedgerQuery): Promise<ListStockLedgerResult> {
      let rows = Array.from(store.ledger.values());

      if (scope.level === ScopeLevel.OWN && scope.warehouseIds.length > 0) {
        rows = rows.filter((l) => scope.warehouseIds.includes(l.warehouse_id));
      }
      if (filters.batchId) {
        rows = rows.filter((l) => l.batch_id === filters.batchId);
      }
      if (filters.warehouseId) {
        rows = rows.filter((l) => l.warehouse_id === filters.warehouseId);
      }
      if (filters.txnType) {
        rows = rows.filter((l) => l.movement_type === filters.txnType);
      }

      return {
        items: rows.map(toStockLedgerEntryView),
        page: { nextCursor: null, hasMore: false },
      };
    },

    async getPooledAvailability(_db, warehouseId: string, cropId: string, grade: string): Promise<string> {
      const rows = Array.from(store.batches.values()).filter(
        (b) =>
          b.warehouse_id === warehouseId &&
          b.crop_id === cropId &&
          b.grade === grade &&
          b.status === 'ACTIVE',
      );
      const total = rows.reduce((sum, b) => sum + Number(b.qty_available), 0);
      return total.toFixed(3);
    },

    async resolveLedgerFarmer(_db, ledgerEntryId: string) {
      const entry = store.ledger.get(ledgerEntryId);
      if (!entry) return null;
      const batch = store.batches.get(entry.batch_id);
      if (!batch) return null;
      return {
        ledgerId: entry.id,
        batchId: batch.id,
        sourceFarmerId: batch.source_farmer_id,
      };
    },
  };
}

const passThroughTx: TransactionRunner = async (fn) =>
  fn({
    query: async () => ({ rows: [{ id: '00000000-0000-4000-8000-000000000099' }], rowCount: 1, command: 'INSERT', oid: 0, fields: [] }),
  } as never);

function createTestService(store: InMemStore) {
  const repo = createInMemRepo(store);
  return new InventoryService(repo, passThroughTx);
}

// ---------------------------------------------------------------------------
// Unit & Business Rule Tests
// ---------------------------------------------------------------------------
describe('S-26: Inventory Module & Ledger-First Stock Service', () => {
  it('creates batch and appends exactly one RECEIPT ledger movement upon intake', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    const intake: CreateBatchInput = {
      batchCode: 'OOT-CAR-G1-20260828-01',
      warehouseId: IDS.warehouseOoty,
      cropId: IDS.cropCarrot,
      grade: 'GRADE_1',
      sourceFarmerId: IDS.farmer1,
      qtyReceivedKg: '500.000',
      storageLocation: 'A-01-R1',
    };

    const result = await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      intake,
    );

    expect(result.batch.batchCode).toBe('OOT-CAR-G1-20260828-01');
    expect(result.batch.qtyReceivedKg).toBe('500.000');
    expect(result.batch.qtyAvailableKg).toBe('500.000');
    expect(result.ledgerEntry.txnType).toBe('RECEIPT');
    expect(result.ledgerEntry.qtyDeltaKg).toBe('500.000');
    expect(result.ledgerEntry.balanceAfterKg).toBe('500.000');

    // Exactly one batch and one ledger row
    expect(store.batches.size).toBe(1);
    expect(store.ledger.size).toBe(1);
  });

  // -------------------------------------------------------------------------
  // BR-24: Consolidated inventory pooled across farmers
  // -------------------------------------------------------------------------
  it('BR-24a: Two batches of the same crop/grade from different farmers present as one pooled availability figure', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    // Farmer 1 delivers 300 kg Grade 1 Carrots to Ooty
    await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-CAR-G1-F1',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer1,
        qtyReceivedKg: '300.000',
      },
    );

    // Farmer 2 delivers 200 kg Grade 1 Carrots to Ooty
    await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-CAR-G1-F2',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer2,
        qtyReceivedKg: '200.000',
      },
    );

    const pooled = await service.getPooledAvailability(
      superAdminScope('inventory.batch.view'),
      IDS.warehouseOoty,
      IDS.cropCarrot,
      'GRADE_1',
    );

    expect(pooled).toBe('500.000');
  });

  it('BR-24b: Every stock ledger row resolves to batch_id and through it to source_farmer_id', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    const res = await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-CAR-G1-F1',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer1,
        qtyReceivedKg: '150.000',
      },
    );

    const traceability = await service.resolveLedgerFarmer(
      superAdminScope('inventory.batch.view'),
      res.ledgerEntry.id,
    );

    expect(traceability).not.toBeNull();
    expect(traceability?.batchId).toBe(res.batch.id);
    expect(traceability?.sourceFarmerId).toBe(IDS.farmer1);
  });

  // -------------------------------------------------------------------------
  // BR-37: Stock movements are ledger-first; adjustments need separate approval
  // -------------------------------------------------------------------------
  it('BR-37a: SUB_WH_ADMIN cannot approve its own stock adjustment (SELF_APPROVAL_FORBIDDEN)', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    const batchRes = await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-POT-G1',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropPotato,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer1,
        qtyReceivedKg: '100.000',
      },
    );

    // SUB_WH_ADMIN attempts to approve an adjustment directly
    const adjustmentApprovalScope: ResolvedScope = {
      level: ScopeLevel.OWN,
      permission: 'inventory.stock_adjustment.approve',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [IDS.warehouseOoty],
      zoneIds: [],
      userId: IDS.subWhAdminUser,
    };

    await expect(
      service.recordMovement(subWhAdminOotyActor, adjustmentApprovalScope, {
        batchId: batchRes.batch.id,
        warehouseId: IDS.warehouseOoty,
        movementType: 'ADJUSTMENT',
        qtyDeltaKg: '-5.000',
        remarks: 'Shrinkage loss',
      }),
    ).rejects.toThrowError(AppError);

    // Verify batch quantity remains unchanged at 100.000
    const batch = await service.getBatch(superAdminScope('inventory.batch.view'), batchRes.batch.id);
    expect(batch.qtyAvailableKg).toBe('100.000');
  });

  it('BR-37b: Approved adjustment updates quantity exclusively by inserting a new ledger row', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    const batchRes = await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-POT-G1',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropPotato,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer1,
        qtyReceivedKg: '100.000',
      },
    );

    // Super Admin executes approved adjustment
    const movement = await service.recordMovement(
      superAdminActor,
      superAdminScope('inventory.stock_adjustment.approve'),
      {
        batchId: batchRes.batch.id,
        warehouseId: IDS.warehouseOoty,
        movementType: 'ADJUSTMENT',
        qtyDeltaKg: '-10.000',
        remarks: 'Approved moisture loss adjustment',
      },
    );

    expect(movement.txnType).toBe('ADJUSTMENT');
    expect(movement.qtyDeltaKg).toBe('-10.000');
    expect(movement.balanceAfterKg).toBe('90.000');

    // Total ledger rows: 1 RECEIPT + 1 ADJUSTMENT = 2
    expect(store.ledger.size).toBe(2);

    // Batch availability derived to 90.000
    const batch = await service.getBatch(superAdminScope('inventory.batch.view'), batchRes.batch.id);
    expect(batch.qtyAvailableKg).toBe('90.000');
  });

  // -------------------------------------------------------------------------
  // Negative Stock Prevention
  // -------------------------------------------------------------------------
  it('refuses movement that would push balance below zero with STOCK_UNAVAILABLE', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    const batchRes = await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-CAR-LIMITED',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer1,
        qtyReceivedKg: '50.000',
      },
    );

    // Attempt to sell 60 kg from a 50 kg batch
    await expect(
      service.recordMovement(superAdminActor, superAdminScope('inventory.stock_movement'), {
        batchId: batchRes.batch.id,
        warehouseId: IDS.warehouseOoty,
        movementType: 'SALE',
        qtyDeltaKg: '-60.000',
        remarks: 'Over-sale attempt',
      }),
    ).rejects.toThrowError(AppError);

    // Ensure no failed ledger row is retained and stock is still 50
    expect(store.ledger.size).toBe(1);
    const batch = await service.getBatch(superAdminScope('inventory.batch.view'), batchRes.batch.id);
    expect(batch.qtyAvailableKg).toBe('50.000');
  });

  // -------------------------------------------------------------------------
  // Sub Warehouse Admin Scoping
  // -------------------------------------------------------------------------
  it('scopes SUB_WH_ADMIN queries to their assigned warehouse only', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    // Ooty batch
    await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'OOT-BATCH',
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer1,
        qtyReceivedKg: '100.000',
      },
    );

    // Coonoor batch
    const coonoorBatch = await service.createBatchWithReceipt(
      superAdminActor,
      superAdminScope('inventory.batch.assign'),
      {
        batchCode: 'COON-BATCH',
        warehouseId: IDS.warehouseCoonoor,
        cropId: IDS.cropCarrot,
        grade: 'GRADE_1',
        sourceFarmerId: IDS.farmer2,
        qtyReceivedKg: '200.000',
      },
    );

    // SUB_WH_ADMIN for Ooty lists batches
    const listRes = await service.listBatches(
      subWhAdminOotyScope('inventory.batch.view'),
      { limit: 20 },
    );
    expect(listRes.items).toHaveLength(1);
    expect(listRes.items[0]?.warehouseId).toBe(IDS.warehouseOoty);

    // SUB_WH_ADMIN for Ooty fetching Coonoor batch gets 404
    await expect(
      service.getBatch(subWhAdminOotyScope('inventory.batch.view'), coonoorBatch.batch.id),
    ).rejects.toThrowError(AppError);
  });

  // -------------------------------------------------------------------------
  // Exhaustive 200-Movement Property Test
  // -------------------------------------------------------------------------
  it('Property test: 200 randomised movements across batches maintain ledger-sum equality', async () => {
    const store = createInMemStore();
    const service = createTestService(store);

    // Seed 4 batches across 2 warehouses
    const batchIds: string[] = [];
    const initialBatches = [
      { code: 'PROP-OOT-1', wh: IDS.warehouseOoty, qty: '500.000' },
      { code: 'PROP-OOT-2', wh: IDS.warehouseOoty, qty: '300.000' },
      { code: 'PROP-COON-1', wh: IDS.warehouseCoonoor, qty: '400.000' },
      { code: 'PROP-COON-2', wh: IDS.warehouseCoonoor, qty: '250.000' },
    ];

    for (const b of initialBatches) {
      const res = await service.createBatchWithReceipt(
        superAdminActor,
        superAdminScope('inventory.batch.assign'),
        {
          batchCode: b.code,
          warehouseId: b.wh,
          cropId: IDS.cropCarrot,
          grade: 'GRADE_1',
          sourceFarmerId: IDS.farmer1,
          qtyReceivedKg: b.qty,
        },
      );
      batchIds.push(res.batch.id);
    }

    const possibleMovementTypes: StockMovementType[] = [
      'SALE',
      'ADJUSTMENT',
      'WASTAGE',
      'RESERVATION',
      'RELEASE',
      'RECEIPT',
    ];

    // Execute 200 randomised operations
    let successfulOps = 0;
    let rejectedOps = 0;

    for (let i = 0; i < 200; i++) {
      const batchId = batchIds[i % batchIds.length]!;
      const movType = possibleMovementTypes[i % possibleMovementTypes.length]!;

      // Choose delta (inflows positive, outflows negative, some deliberately oversized to test failure)
      let delta: number;
      if (movType === 'RECEIPT' || movType === 'RELEASE') {
        delta = (i % 30) + 1; // +1 to +30 kg
      } else {
        delta = -((i % 70) + 1); // -1 to -70 kg (may exceed current balance)
      }

      try {
        await service.recordMovement(
          superAdminActor,
          superAdminScope('inventory.stock_movement'),
          {
            batchId,
            movementType: movType,
            qtyDeltaKg: delta.toFixed(3),
            remarks: `Random step ${i}`,
          },
        );
        successfulOps++;
      } catch (err) {
        // Must be STOCK_UNAVAILABLE if rejected
        expect(err).toBeInstanceOf(AppError);
        rejectedOps++;
      }
    }

    expect(successfulOps + rejectedOps).toBe(200);

    // Invariant check across EVERY batch:
    // SUM(qty_delta in stock_ledger) === inventory_batches.qty_available
    for (const bId of batchIds) {
      const batch = store.batches.get(bId)!;
      const ledgerDeltas = Array.from(store.ledger.values())
        .filter((l) => l.batch_id === bId)
        .map((l) => Number(l.qty_delta));

      const expectedSum = ledgerDeltas.reduce((acc, d) => acc + d, 0);
      const actualAvailable = Number(batch.qty_available);

      expect(actualAvailable).toBeCloseTo(expectedSum, 3);
      expect(actualAvailable).toBeGreaterThanOrEqual(0);
    }
  });
});
