import { ErrorCode, GenericProblemCode, RoleCode } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  allocationsRepo,
  type AllocationsRepo,
  type InsertAllocationItem,
  type ListAllocationsResult,
} from './allocations.repo.js';
import type {
  AllocationChannel,
  AllocationConfigView,
  AllocationView,
  ListAllocationsQuery,
  UpdateAllocationConfigBody,
} from './allocations.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AllocateBatchInput {
  batchId: string;
  warehouseId: string;
  cropId: string;
  qtyReceivedKg: string;
  receivedOn?: string;
}

export class AllocationsService {
  constructor(
    private readonly repo: AllocationsRepo = allocationsRepo,
    private readonly runTx: TransactionRunner = withTransaction,
  ) {}

  /**
   * BR-12: Splits an inventory batch across ONLINE, LIVE_MARKET, RESERVE, BUFFER
   * using the effective configuration percentages and exact rounding to 3 decimal places.
   * Remainder is always given to BUFFER (BR-12a).
   */
  async allocateBatch(
    input: AllocateBatchInput,
    tx?: Executor,
  ): Promise<AllocationView[]> {
    const execute = async (client: Executor) => {
      const effectiveDate =
        input.receivedOn ?? new Date().toISOString().split('T')[0]!;

      // 1. Read percentages dynamically from config — no hardcoded constants
      const percentages = await this.repo.getEffectivePercentages(
        client,
        effectiveDate,
        input.cropId,
      );

      const batchQty = Number(input.qtyReceivedKg);
      const flooredItems: Array<{ channel: AllocationChannel; qty: number }> = [];
      let sumFloored = 0;

      for (const p of percentages) {
        const raw = batchQty * (p.percentage / 100);
        // Floor to 3 decimal places
        const floored = Math.floor(raw * 1000) / 1000;
        flooredItems.push({ channel: p.channel, qty: floored });
        sumFloored += floored;
      }

      // Exact remainder goes to BUFFER (BR-12a)
      const remainder = Math.round((batchQty - sumFloored) * 1000) / 1000;

      const itemsToInsert: InsertAllocationItem[] = flooredItems.map((item) => {
        let finalQty = item.qty;
        if (item.channel === 'BUFFER') {
          finalQty = Math.round((item.qty + remainder) * 1000) / 1000;
        }
        return {
          batchId: input.batchId,
          warehouseId: input.warehouseId,
          channel: item.channel,
          allocatedQtyKg: finalQty.toFixed(3),
          computedBy: 'AUTO',
        };
      });

      const rows = await this.repo.insertBatchAllocations(client, itemsToInsert);
      return rows.map((r) => ({
        id: r.id,
        batchId: r.batch_id,
        warehouseId: r.warehouse_id,
        cropId: r.crop_id,
        grade: r.grade,
        allocationDate: effectiveDate,
        channel: r.channel,
        allocatedQtyKg: r.allocated_qty,
        consumedQtyKg: r.consumed_qty,
        reservedQtyKg: r.reserved_qty,
        availableQtyKg: r.available_qty,
        computedBy: r.computed_by,
        overriddenBy: r.overridden_by,
      }));
    };

    if (tx !== undefined) {
      return execute(tx);
    }
    return this.runTx(execute);
  }

  /**
   * Sets channel percentages (Super Admin only).
   */
  async updateAllocationConfig(
    actor: Actor,
    scope: ResolvedScope,
    input: UpdateAllocationConfigBody,
  ): Promise<AllocationConfigView> {
    // Only SUPER_ADMIN may change percentages; TOHFA_ADMIN gets 403
    if (scope.roleCode !== RoleCode.SUPER_ADMIN) {
      throw new AppError(GenericProblemCode.FORBIDDEN, {
        detail: 'Only Super Admin can update channel allocation percentages.',
      });
    }

    return this.runTx(async (tx) => {
      const result = await this.repo.saveAllocationConfig(tx, input, actor.userId);

      await writeAuditLog(tx, {
        actorId: actor.userId,
        actorRole: scope.roleCode,
        actionCode: 'allocation.channel_percentage.set',
        entityType: 'allocation_config',
        entityId: null,
        outcome: 'ALLOWED',
        after: {
          effectiveFrom: input.effectiveFrom,
          cropId: input.cropId ?? null,
          channels: input.channels,
        },
      });

      return result;
    });
  }

  async listAllocations(
    scope: ResolvedScope,
    filters: ListAllocationsQuery,
    db: Executor = pool,
  ): Promise<ListAllocationsResult> {
    return this.repo.listAllocations(db, scope, filters);
  }

  /**
   * BR-12c: Online order exceeding the Online bucket returns 409 INSUFFICIENT_ALLOCATION.
   * Does not draw from Reserve or Buffer.
   */
  async checkChannelAllocation(
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
    requestedQtyKg: string,
    db: Executor = pool,
  ): Promise<void> {
    const available = await this.repo.getAvailableQuantityForChannel(
      db,
      warehouseId,
      cropId,
      channel,
    );

    if (Number(available) < Number(requestedQtyKg)) {
      throw new AppError(ErrorCode.INSUFFICIENT_ALLOCATION, {
        status: 409,
        detail: `Requested ${requestedQtyKg} kg exceeds available ${available} kg in ${channel} allocation.`,
      });
    }
  }

  /**
   * BR-13a & BR-13b: B2B/Horeca draw from Reserve/Buffer is deferred and blocked on contradiction 10.
   */
  async requestB2BHorecaDraw(): Promise<never> {
    throw new AppError(GenericProblemCode.BAD_REQUEST, {
      status: 501,
      detail:
        'BR-13: B2B/Horeca automatic allocation is deferred and contested (contradiction 10).',
    });
  }
}

export const allocationsService = new AllocationsService();
