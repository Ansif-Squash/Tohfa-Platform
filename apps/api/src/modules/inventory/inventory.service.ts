import { GenericProblemCode, RoleCode } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  inventoryRepo,
  toBatchView,
  toStockLedgerEntryView,
  type BatchRow,
  type InventoryRepo,
  type ListBatchesResult,
  type ListStockLedgerResult,
  type StockLedgerRow,
} from './inventory.repo.js';
import type {
  BatchView,
  CreateBatchInput,
  ListBatchesQuery,
  ListStockLedgerQuery,
  ProduceGrade,
  RecordMovementInput,
  StockLedgerEntryView,
} from './inventory.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export class InventoryService {
  constructor(
    private readonly repo: InventoryRepo = inventoryRepo,
    private readonly runTx: TransactionRunner = withTransaction,
  ) {}

  /**
   * On quality-check accept: assigns batch and appends exactly one RECEIPT
   * movement row to stock_ledger.
   */
  async createBatchWithReceipt(
    actor: Actor,
    scope: ResolvedScope,
    input: CreateBatchInput,
    tx?: Executor,
  ): Promise<{ batch: BatchView; ledgerEntry: StockLedgerEntryView }> {
    const execute = async (client: Executor) => {
      // 1. Create the inventory batch
      const batchRow: BatchRow = await this.repo.createBatch(client, input);

      // 2. Insert ONE RECEIPT ledger movement for the accepted quantity
      const ledgerRow: StockLedgerRow = await this.repo.insertLedgerMovement(client, {
        batchId: batchRow.id,
        warehouseId: batchRow.warehouse_id,
        movementType: 'RECEIPT',
        qtyDeltaKg: input.qtyReceivedKg,
        refType: input.goodsReceiptId ? 'goods_receipt' : null,
        refId: input.goodsReceiptId ?? null,
        remarks: 'Batch intake from accepted goods receipt',
        performedBy: actor.userId,
      });

      // 3. Write audit log in the same transaction
      await writeAuditLog(client, {
        actorId: actor.userId,
        actorRole: scope.roleCode,
        actionCode: 'inventory.batch.assign',
        entityType: 'batch',
        entityId: batchRow.id,
        outcome: 'ALLOWED',
        after: {
          batchCode: batchRow.batch_code,
          warehouseId: batchRow.warehouse_id,
          qtyReceived: input.qtyReceivedKg,
        },
      });

      return {
        batch: toBatchView(batchRow),
        ledgerEntry: toStockLedgerEntryView(ledgerRow),
      };
    };

    if (tx !== undefined) {
      return execute(tx);
    }
    return this.runTx(execute);
  }

  /**
   * Records a stock movement (SALE, WASTAGE, ADJUSTMENT, RESERVATION, RELEASE, etc.).
   * The append-only ledger insert is the only mechanism that changes available stock.
   */
  async recordMovement(
    actor: Actor,
    scope: ResolvedScope,
    input: RecordMovementInput,
    tx?: Executor,
  ): Promise<StockLedgerEntryView> {
    // BR-37: SUB_WH_ADMIN cannot approve adjustments
    if (
      input.movementType === 'ADJUSTMENT' &&
      scope.roleCode === RoleCode.SUB_WH_ADMIN &&
      scope.permission === 'inventory.stock_adjustment.approve'
    ) {
      throw new AppError('SELF_APPROVAL_FORBIDDEN', {
        detail: 'Sub Warehouse Admin cannot approve stock adjustments (BR-37).',
      });
    }

    const execute = async (client: Executor) => {
      const ledgerRow = await this.repo.insertLedgerMovement(client, {
        ...input,
        performedBy: actor.userId,
      });

      await writeAuditLog(client, {
        actorId: actor.userId,
        actorRole: scope.roleCode,
        actionCode: 'inventory.stock_movement',
        entityType: 'stock_ledger',
        entityId: ledgerRow.id,
        outcome: 'ALLOWED',
        after: {
          batchId: input.batchId,
          movementType: input.movementType,
          qtyDelta: input.qtyDeltaKg,
          balanceAfter: ledgerRow.balance_after,
        },
      });

      return toStockLedgerEntryView(ledgerRow);
    };

    if (tx !== undefined) {
      return execute(tx);
    }
    return this.runTx(execute);
  }

  async listBatches(
    scope: ResolvedScope,
    filters: ListBatchesQuery,
    db: Executor = pool,
  ): Promise<ListBatchesResult> {
    return this.repo.listBatches(db, scope, filters);
  }

  async getBatch(scope: ResolvedScope, id: string, db: Executor = pool): Promise<BatchView> {
    const batch = await this.repo.getBatchById(db, scope, id);
    if (batch === null) {
      throw new AppError(GenericProblemCode.NOT_FOUND, {
        detail: `Batch ${id} not found`,
      });
    }
    return batch;
  }

  async listStockLedger(
    scope: ResolvedScope,
    filters: ListStockLedgerQuery,
    db: Executor = pool,
  ): Promise<ListStockLedgerResult> {
    return this.repo.listStockLedger(db, scope, filters);
  }

  /**
   * BR-24a: Availability is pooled by warehouse, crop and grade across all farmers.
   */
  async getPooledAvailability(
    scope: ResolvedScope,
    warehouseId: string,
    cropId: string,
    grade: ProduceGrade,
    db: Executor = pool,
  ): Promise<string> {
    return this.repo.getPooledAvailability(db, warehouseId, cropId, grade);
  }

  /**
   * BR-24b: Traceability resolves from ledger entry through batch to source farmer.
   */
  async resolveLedgerFarmer(
    scope: ResolvedScope,
    ledgerEntryId: string,
    db: Executor = pool,
  ): Promise<{ ledgerId: string; batchId: string; sourceFarmerId: string } | null> {
    return this.repo.resolveLedgerFarmer(db, ledgerEntryId);
  }
}

export const inventoryService = new InventoryService();
