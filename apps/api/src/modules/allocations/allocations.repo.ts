import { ErrorCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope, type ScopedWhere } from '../../rbac/requirePermission.js';
import type {
  AllocationChannel,
  AllocationConfigView,
  AllocationView,
  ChannelAllocationRow,
  EffectivePercentage,
  ListAllocationsQuery,
  UpdateAllocationConfigBody,
} from './allocations.schema.js';

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListAllocationsResult {
  items: AllocationView[];
  page: PageMeta;
}

export interface InsertAllocationItem {
  batchId: string;
  warehouseId: string;
  channel: AllocationChannel;
  allocatedQtyKg: string;
  computedBy?: 'AUTO' | 'MANUAL';
}

function toAllocationView(row: ChannelAllocationRow): AllocationView {
  const formatDate = (val: Date | string): string => {
    if (val instanceof Date) return val.toISOString().split('T')[0]!;
    return String(val).split('T')[0]!;
  };

  return {
    id: row.id,
    batchId: row.batch_id,
    warehouseId: row.warehouse_id,
    cropId: row.crop_id,
    cropName: row.crop_name ?? undefined,
    grade: row.grade,
    allocationDate: formatDate(row.created_at),
    channel: row.channel,
    allocatedQtyKg: row.allocated_qty,
    consumedQtyKg: row.consumed_qty,
    reservedQtyKg: row.reserved_qty,
    availableQtyKg: row.available_qty,
    computedBy: row.computed_by,
    overriddenBy: row.overridden_by,
  };
}

function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  let sql = scope.sql;
  scope.params.forEach((_, idx) => {
    const oldPlaceholder = `$${idx + 1}`;
    const newPlaceholder = `__PARAM_${idx}__`;
    sql = sql.split(oldPlaceholder).join(newPlaceholder);
  });
  scope.params.forEach((_, idx) => {
    const newPlaceholder = `__PARAM_${idx}__`;
    const targetPlaceholder = `$${startIndex + idx}`;
    sql = sql.split(newPlaceholder).join(targetPlaceholder);
  });
  return {
    sql,
    params: scope.params,
    nextIndex: startIndex + scope.params.length,
  };
}

export interface AllocationsRepo {
  getEffectivePercentages(
    db: Executor,
    effectiveDate: string,
    cropId?: string | null,
  ): Promise<EffectivePercentage[]>;
  insertBatchAllocations(
    db: Executor,
    items: InsertAllocationItem[],
  ): Promise<ChannelAllocationRow[]>;
  saveAllocationConfig(
    db: Executor,
    input: UpdateAllocationConfigBody,
    setBy: string,
  ): Promise<AllocationConfigView>;
  listAllocations(
    db: Executor,
    scope: ResolvedScope,
    filters: ListAllocationsQuery,
  ): Promise<ListAllocationsResult>;
  getAvailableQuantityForChannel(
    db: Executor,
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
  ): Promise<string>;
}

export const allocationsRepo: AllocationsRepo = {
  async getEffectivePercentages(
    db: Executor,
    effectiveDate: string,
    cropId?: string | null,
  ): Promise<EffectivePercentage[]> {
    // 1. Try per-crop override first if cropId is provided
    if (cropId) {
      const cropRes = await db.query<{ channel: AllocationChannel; percentage: string }>(
        `WITH latest_window AS (
           SELECT effective_from
             FROM allocation_config
            WHERE crop_id = $1
              AND effective_from <= $2::date
            ORDER BY effective_from DESC
            LIMIT 1
         )
         SELECT channel, percentage
           FROM allocation_config
          WHERE crop_id = $1
            AND effective_from = (SELECT effective_from FROM latest_window)`,
        [cropId, effectiveDate],
      );

      if (cropRes.rows.length === 4) {
        return cropRes.rows.map((r) => ({
          channel: r.channel,
          percentage: Number(r.percentage),
        }));
      }
    }

    // 2. Fall back to default config (crop_id IS NULL)
    const defaultRes = await db.query<{ channel: AllocationChannel; percentage: string }>(
      `WITH latest_window AS (
         SELECT effective_from
           FROM allocation_config
          WHERE crop_id IS NULL
            AND effective_from <= $1::date
          ORDER BY effective_from DESC
          LIMIT 1
       )
       SELECT channel, percentage
         FROM allocation_config
        WHERE crop_id IS NULL
          AND effective_from = (SELECT effective_from FROM latest_window)`,
      [effectiveDate],
    );

    if (defaultRes.rows.length === 4) {
      return defaultRes.rows.map((r) => ({
        channel: r.channel,
        percentage: Number(r.percentage),
      }));
    }

    // Fallback if no window found in DB (safety seed values: 70/10/10/10)
    return [
      { channel: 'ONLINE', percentage: 70 },
      { channel: 'LIVE_MARKET', percentage: 10 },
      { channel: 'RESERVE', percentage: 10 },
      { channel: 'BUFFER', percentage: 10 },
    ];
  },

  async insertBatchAllocations(
    db: Executor,
    items: InsertAllocationItem[],
  ): Promise<ChannelAllocationRow[]> {
    const inserted: ChannelAllocationRow[] = [];

    for (const item of items) {
      const res = await db.query<ChannelAllocationRow>(
        `INSERT INTO allocations (
           batch_id,
           warehouse_id,
           channel,
           allocated_qty,
           computed_by
         ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (batch_id, channel) DO NOTHING
         RETURNING *`,
        [
          item.batchId,
          item.warehouseId,
          item.channel,
          item.allocatedQtyKg,
          item.computedBy ?? 'AUTO',
        ],
      );
      if (res.rows.length > 0) {
        inserted.push(res.rows[0]!);
      }
    }

    return inserted;
  },

  async saveAllocationConfig(
    db: Executor,
    input: UpdateAllocationConfigBody,
    setBy: string,
  ): Promise<AllocationConfigView> {
    try {
      for (const item of input.channels) {
        if (input.cropId) {
          await db.query(
            `INSERT INTO allocation_config (
               channel,
               percentage,
               effective_from,
               crop_id,
               set_by
             ) VALUES ($1, $2, $3::date, $4, $5)
             ON CONFLICT (channel, crop_id, effective_from) WHERE crop_id IS NOT NULL
             DO UPDATE SET
               percentage = EXCLUDED.percentage,
               set_by = EXCLUDED.set_by,
               updated_at = now()`,
            [item.channel, item.percentage, input.effectiveFrom, input.cropId, setBy],
          );
        } else {
          await db.query(
            `INSERT INTO allocation_config (
               channel,
               percentage,
               effective_from,
               crop_id,
               set_by
             ) VALUES ($1, $2, $3::date, NULL, $4)
             ON CONFLICT (channel, effective_from) WHERE crop_id IS NULL
             DO UPDATE SET
               percentage = EXCLUDED.percentage,
               set_by = EXCLUDED.set_by,
               updated_at = now()`,
            [item.channel, item.percentage, input.effectiveFrom, setBy],
          );
        }
      }

      return {
        effectiveFrom: input.effectiveFrom,
        cropId: input.cropId ?? null,
        channels: input.channels,
        setBy,
        setAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const errObj = err as { code?: string; hint?: string; message?: string };
      if (
        errObj.code === '23514' ||
        errObj.hint?.includes('ALLOCATION_SUM_INVALID') ||
        errObj.message?.includes('ALLOCATION_SUM_INVALID')
      ) {
        throw new AppError(ErrorCode.ALLOCATION_SUM_INVALID, {
          status: 422,
          detail: 'Allocation percentages must sum to exactly 100',
          cause: err,
        });
      }
      throw err;
    }
  },

  async listAllocations(
    db: Executor,
    scope: ResolvedScope,
    filters: ListAllocationsQuery,
  ): Promise<ListAllocationsResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    const baseScope = scopedWhere(scope, { warehouseColumn: 'a.warehouse_id' });
    const scoped = renumber(baseScope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    if (filters.warehouseId !== undefined) {
      params.push(filters.warehouseId);
      conditions.push(`a.warehouse_id = $${params.length}`);
    }
    if (filters.channel !== undefined) {
      params.push(filters.channel);
      conditions.push(`a.channel = $${params.length}`);
    }
    if (filters.allocationDate !== undefined) {
      params.push(filters.allocationDate);
      conditions.push(`b.received_on = $${params.length}::date`);
    }
    if (filters.cursor !== undefined && filters.cursor.length > 0) {
      params.push(filters.cursor);
      conditions.push(`a.id < $${params.length}`);
    }

    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');
    const limit = filters.limit;
    params.push(limit + 1);

    const querySql = `
      SELECT a.*, b.crop_id, cm.name AS crop_name, b.grade
        FROM allocations a
        JOIN inventory_batches b ON b.id = a.batch_id
        LEFT JOIN crop_master cm ON cm.id = b.crop_id
       WHERE ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT $${params.length}
    `;

    const res = await db.query<ChannelAllocationRow>(querySql, params);
    const rows = res.rows;
    const hasMore = rows.length > limit;
    const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && itemsToReturn.length > 0 ? itemsToReturn[itemsToReturn.length - 1]!.id : null;

    return {
      items: itemsToReturn.map(toAllocationView),
      page: {
        nextCursor,
        hasMore,
      },
    };
  },

  async getAvailableQuantityForChannel(
    db: Executor,
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
  ): Promise<string> {
    const res = await db.query<{ available_qty: string }>(
      `SELECT COALESCE(SUM(a.available_qty), 0)::text AS available_qty
         FROM allocations a
         JOIN inventory_batches b ON b.id = a.batch_id
        WHERE a.warehouse_id = $1
          AND b.crop_id = $2
          AND a.channel = $3
          AND b.status = 'ACTIVE'`,
      [warehouseId, cropId, channel],
    );
    return res.rows[0]?.available_qty ?? '0.000';
  },
};
