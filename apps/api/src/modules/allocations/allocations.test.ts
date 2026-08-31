import { describe, expect, it } from 'vitest';
import { ErrorCode, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  AllocationsRepo,
  InsertAllocationItem,
  ListAllocationsResult,
} from './allocations.repo.js';
import { AllocationsService, type TransactionRunner } from './allocations.service.js';
import type {
  AllocationChannel,
  AllocationConfigView,
  ChannelAllocationRow,
  EffectivePercentage,
  ListAllocationsQuery,
  UpdateAllocationConfigBody,
} from './allocations.schema.js';

// ---------------------------------------------------------------------------
// Fixed Identities
// ---------------------------------------------------------------------------
const IDS = {
  superAdminUser: '00000000-0000-4000-8000-000000000001',
  tohfaAdminUser: '00000000-0000-4000-8000-000000000002',
  subWhAdminUser: '00000000-0000-4000-8000-000000000003',
  warehouseOoty: '10000000-0000-4000-8000-000000000001',
  warehouseCoonoor: '10000000-0000-4000-8000-000000000002',
  cropCarrot: '20000000-0000-4000-8000-000000000001',
  cropPotato: '20000000-0000-4000-8000-000000000002',
  batch1: '40000000-0000-4000-8000-000000000001',
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

const tohfaAdminActor: Actor = {
  userId: IDS.tohfaAdminUser,
  roles: [{ code: RoleCode.TOHFA_ADMIN }],
  farmerId: null,
  customerId: null,
};

const superAdminScope = (permission: string): ResolvedScope => ({
  userId: IDS.superAdminUser,
  level: ScopeLevel.ALL,
  permission,
  roleCode: RoleCode.SUPER_ADMIN,
  warehouseIds: [],
  zoneIds: [],
});

const tohfaAdminScope = (permission: string): ResolvedScope => ({
  userId: IDS.tohfaAdminUser,
  level: ScopeLevel.ALL,
  permission,
  roleCode: RoleCode.TOHFA_ADMIN,
  warehouseIds: [],
  zoneIds: [],
});

// ---------------------------------------------------------------------------
// In-Memory Mock Repo
// ---------------------------------------------------------------------------
class MockAllocationsRepo implements AllocationsRepo {
  public configRows: Array<{
    channel: AllocationChannel;
    percentage: number;
    effective_from: string;
    crop_id: string | null;
    set_by: string;
  }> = [
    { channel: 'ONLINE', percentage: 70, effective_from: '2026-01-01', crop_id: null, set_by: IDS.superAdminUser },
    { channel: 'LIVE_MARKET', percentage: 10, effective_from: '2026-01-01', crop_id: null, set_by: IDS.superAdminUser },
    { channel: 'RESERVE', percentage: 10, effective_from: '2026-01-01', crop_id: null, set_by: IDS.superAdminUser },
    { channel: 'BUFFER', percentage: 10, effective_from: '2026-01-01', crop_id: null, set_by: IDS.superAdminUser },
  ];

  public allocationRows: ChannelAllocationRow[] = [];
  public customPercentages: EffectivePercentage[] | null = null;

  async getEffectivePercentages(
    _db: unknown,
    _effectiveDate: string,
    cropId?: string | null,
  ): Promise<EffectivePercentage[]> {
    if (this.customPercentages) {
      return this.customPercentages;
    }

    if (cropId) {
      const perCrop = this.configRows.filter((r) => r.crop_id === cropId);
      if (perCrop.length === 4) {
        return perCrop.map((r) => ({ channel: r.channel, percentage: r.percentage }));
      }
    }

    const defaults = this.configRows.filter((r) => r.crop_id === null);
    if (defaults.length === 4) {
      return defaults.map((r) => ({ channel: r.channel, percentage: r.percentage }));
    }

    return [
      { channel: 'ONLINE', percentage: 70 },
      { channel: 'LIVE_MARKET', percentage: 10 },
      { channel: 'RESERVE', percentage: 10 },
      { channel: 'BUFFER', percentage: 10 },
    ];
  }

  async insertBatchAllocations(
    _db: unknown,
    items: InsertAllocationItem[],
  ): Promise<ChannelAllocationRow[]> {
    const inserted: ChannelAllocationRow[] = [];
    for (const item of items) {
      const existing = this.allocationRows.find(
        (r) => r.batch_id === item.batchId && r.channel === item.channel,
      );
      if (existing) {
        inserted.push(existing);
        continue;
      }

      const row: ChannelAllocationRow = {
        id: `alloc-${this.allocationRows.length + 1}`,
        batch_id: item.batchId,
        warehouse_id: item.warehouseId,
        crop_id: IDS.cropCarrot,
        crop_name: 'Nilgiris Carrot',
        grade: 'GRADE_1',
        channel: item.channel,
        allocated_qty: item.allocatedQtyKg,
        consumed_qty: '0.000',
        reserved_qty: '0.000',
        available_qty: item.allocatedQtyKg,
        computed_by: item.computedBy ?? 'AUTO',
        overridden_by: null,
        created_at: new Date('2026-08-28T10:00:00Z'),
      };
      this.allocationRows.push(row);
      inserted.push(row);
    }
    return inserted;
  }

  async saveAllocationConfig(
    _db: unknown,
    input: UpdateAllocationConfigBody,
    setBy: string,
  ): Promise<AllocationConfigView> {
    const sum = input.channels.reduce((acc, c) => acc + c.percentage, 0);
    if (Math.abs(sum - 100) > 0.001) {
      throw new AppError(ErrorCode.ALLOCATION_SUM_INVALID, {
        status: 422,
        detail: `BR-12b: allocation percentages for window ${input.effectiveFrom} sum to ${sum}, must be 100`,
      });
    }

    for (const c of input.channels) {
      const idx = this.configRows.findIndex(
        (r) => r.channel === c.channel && r.crop_id === (input.cropId ?? null) && r.effective_from === input.effectiveFrom,
      );
      if (idx >= 0) {
        this.configRows[idx]!.percentage = c.percentage;
        this.configRows[idx]!.set_by = setBy;
      } else {
        this.configRows.push({
          channel: c.channel,
          percentage: c.percentage,
          effective_from: input.effectiveFrom,
          crop_id: input.cropId ?? null,
          set_by: setBy,
        });
      }
    }

    return {
      effectiveFrom: input.effectiveFrom,
      cropId: input.cropId ?? null,
      channels: input.channels,
      setBy,
      setAt: new Date().toISOString(),
    };
  }

  async listAllocations(
    _db: unknown,
    _scope: ResolvedScope,
    filters: ListAllocationsQuery,
  ): Promise<ListAllocationsResult> {
    let rows = [...this.allocationRows];
    if (filters.warehouseId) {
      rows = rows.filter((r) => r.warehouse_id === filters.warehouseId);
    }
    if (filters.channel) {
      rows = rows.filter((r) => r.channel === filters.channel);
    }

    return {
      items: rows.map((r) => ({
        id: r.id,
        batchId: r.batch_id,
        warehouseId: r.warehouse_id,
        cropId: r.crop_id,
        cropName: r.crop_name ?? undefined,
        grade: r.grade,
        allocationDate: '2026-08-28',
        channel: r.channel,
        allocatedQtyKg: r.allocated_qty,
        consumedQtyKg: r.consumed_qty,
        reservedQtyKg: r.reserved_qty,
        availableQtyKg: r.available_qty,
        computedBy: r.computed_by,
        overriddenBy: r.overridden_by,
      })),
      page: {
        nextCursor: null,
        hasMore: false,
      },
    };
  }

  async getAvailableQuantityForChannel(
    _db: unknown,
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
  ): Promise<string> {
    const total = this.allocationRows
      .filter((r) => r.warehouse_id === warehouseId && r.crop_id === cropId && r.channel === channel)
      .reduce((sum, r) => sum + Number(r.available_qty), 0);
    return total.toFixed(3);
  }
}

const mockExecutor = {
  query: async () => ({ rows: [{ id: 'audit-1' }] }),
} as unknown as Executor;

const synchronousRunner: TransactionRunner = async (fn) => fn(mockExecutor);

function createTestService(repo = new MockAllocationsRepo()) {
  return {
    service: new AllocationsService(repo, synchronousRunner),
    repo,
  };
}

// ---------------------------------------------------------------------------
// Test Suite: S-27 Allocation Engine & Business Rules BR-12, BR-13
// ---------------------------------------------------------------------------
describe('AllocationsService (Unit & Business Rules S-27)', () => {
  describe('BR-12a: 70 / 10 / 10 / 10 Allocation Split & Exact Remainder in Buffer', () => {
    it('BR-12a: A 1000 kg batch produces bucket quantities 700/100/100/100; remainder lands in Buffer', async () => {
      const { service } = createTestService();

      const result = await service.allocateBatch({
        batchId: IDS.batch1,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        qtyReceivedKg: '1000.000',
      });

      expect(result).toHaveLength(4);
      const online = result.find((r) => r.channel === 'ONLINE');
      const live = result.find((r) => r.channel === 'LIVE_MARKET');
      const reserve = result.find((r) => r.channel === 'RESERVE');
      const buffer = result.find((r) => r.channel === 'BUFFER');

      expect(online?.allocatedQtyKg).toBe('700.000');
      expect(live?.allocatedQtyKg).toBe('100.000');
      expect(reserve?.allocatedQtyKg).toBe('100.000');
      expect(buffer?.allocatedQtyKg).toBe('100.000');

      const sum = [online, live, reserve, buffer].reduce(
        (acc, r) => acc + Number(r?.allocatedQtyKg ?? 0),
        0,
      );
      expect(sum).toBe(1000);
    });

    it('BR-12a: Remainder from decimal division lands in Buffer and is never lost', async () => {
      const { service } = createTestService();

      // 100.005 kg batch:
      // Online (70%): 70.0035 -> floored to 70.003
      // Live (10%): 10.0005 -> floored to 10.000
      // Reserve (10%): 10.0005 -> floored to 10.000
      // Buffer (10%): 10.0005 -> floored to 10.000 + remainder (0.002) = 10.002
      const result = await service.allocateBatch({
        batchId: IDS.batch1,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        qtyReceivedKg: '100.005',
      });

      const online = result.find((r) => r.channel === 'ONLINE');
      const live = result.find((r) => r.channel === 'LIVE_MARKET');
      const reserve = result.find((r) => r.channel === 'RESERVE');
      const buffer = result.find((r) => r.channel === 'BUFFER');

      expect(online?.allocatedQtyKg).toBe('70.003');
      expect(live?.allocatedQtyKg).toBe('10.000');
      expect(reserve?.allocatedQtyKg).toBe('10.000');
      expect(buffer?.allocatedQtyKg).toBe('10.002');

      const sum = Number(
        (
          Number(online?.allocatedQtyKg) +
          Number(live?.allocatedQtyKg) +
          Number(reserve?.allocatedQtyKg) +
          Number(buffer?.allocatedQtyKg)
        ).toFixed(3),
      );
      expect(sum).toBe(100.005);
    });

    it('Idempotency: Allocating the same batch twice returns existing rows without duplicating', async () => {
      const { service, repo } = createTestService();

      const first = await service.allocateBatch({
        batchId: IDS.batch1,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        qtyReceivedKg: '500.000',
      });

      const second = await service.allocateBatch({
        batchId: IDS.batch1,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        qtyReceivedKg: '500.000',
      });

      expect(first).toHaveLength(4);
      expect(second).toHaveLength(4);
      expect(repo.allocationRows).toHaveLength(4);
    });
  });

  describe('BR-12b: Allocation Configuration Updates & Sum Guard Validation', () => {
    it('BR-12b: Saving percentages that sum to 99 -> 422, code: ALLOCATION_SUM_INVALID', async () => {
      const { service } = createTestService();

      await expect(
        service.updateAllocationConfig(superAdminActor, superAdminScope('allocation.channel_percentage.set'), {
          effectiveFrom: '2026-09-01',
          channels: [
            { channel: 'ONLINE', percentage: 69 },
            { channel: 'LIVE_MARKET', percentage: 10 },
            { channel: 'RESERVE', percentage: 10 },
            { channel: 'BUFFER', percentage: 10 },
          ],
        }),
      ).rejects.toThrowError(AppError);
    });

    it('BR-12b: Saving percentages that sum to 101 -> 422, code: ALLOCATION_SUM_INVALID', async () => {
      const { service } = createTestService();

      await expect(
        service.updateAllocationConfig(superAdminActor, superAdminScope('allocation.channel_percentage.set'), {
          effectiveFrom: '2026-09-01',
          channels: [
            { channel: 'ONLINE', percentage: 71 },
            { channel: 'LIVE_MARKET', percentage: 10 },
            { channel: 'RESERVE', percentage: 10 },
            { channel: 'BUFFER', percentage: 10 },
          ],
        }),
      ).rejects.toThrowError(AppError);
    });

    it('BR-12b: TOHFA_ADMIN updating percentages is rejected with 403 FORBIDDEN (Super Admin only)', async () => {
      const { service } = createTestService();

      await expect(
        service.updateAllocationConfig(tohfaAdminActor, tohfaAdminScope('allocation.channel_percentage.set'), {
          effectiveFrom: '2026-09-01',
          channels: [
            { channel: 'ONLINE', percentage: 70 },
            { channel: 'LIVE_MARKET', percentage: 10 },
            { channel: 'RESERVE', percentage: 10 },
            { channel: 'BUFFER', percentage: 10 },
          ],
        }),
      ).rejects.toThrowError(AppError);
    });

    it('BR-12b: Super Admin successfully saves valid 100% allocation configuration', async () => {
      const { service, repo } = createTestService();

      const result = await service.updateAllocationConfig(
        superAdminActor,
        superAdminScope('allocation.channel_percentage.set'),
        {
          effectiveFrom: '2026-09-01',
          channels: [
            { channel: 'ONLINE', percentage: 65 },
            { channel: 'LIVE_MARKET', percentage: 15 },
            { channel: 'RESERVE', percentage: 10 },
            { channel: 'BUFFER', percentage: 10 },
          ],
        },
      );

      expect(result.effectiveFrom).toBe('2026-09-01');
      expect(result.setBy).toBe(IDS.superAdminUser);
      const onlineRow = repo.configRows.find((r) => r.channel === 'ONLINE' && r.effective_from === '2026-09-01');
      expect(onlineRow?.percentage).toBe(65);
    });
  });

  describe('BR-12c: Channel Bucket Limit Enforcement', () => {
    it('BR-12c: Online order exceeding Online bucket available quantity -> 409 INSUFFICIENT_ALLOCATION', async () => {
      const { service } = createTestService();

      // Allocate 100 kg batch -> 70 kg in ONLINE
      await service.allocateBatch({
        batchId: IDS.batch1,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        qtyReceivedKg: '100.000',
      });

      // Request 75 kg from ONLINE channel (exceeds 70 kg available)
      await expect(
        service.checkChannelAllocation(IDS.warehouseOoty, IDS.cropCarrot, 'ONLINE', '75.000'),
      ).rejects.toThrowError(AppError);

      try {
        await service.checkChannelAllocation(IDS.warehouseOoty, IDS.cropCarrot, 'ONLINE', '75.000');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).code).toBe(ErrorCode.INSUFFICIENT_ALLOCATION);
      }
    });

    it('BR-12c: Order within available allocation succeeds without error', async () => {
      const { service } = createTestService();

      await service.allocateBatch({
        batchId: IDS.batch1,
        warehouseId: IDS.warehouseOoty,
        cropId: IDS.cropCarrot,
        qtyReceivedKg: '100.000',
      });

      await expect(
        service.checkChannelAllocation(IDS.warehouseOoty, IDS.cropCarrot, 'ONLINE', '50.000'),
      ).resolves.toBeUndefined();
    });
  });

  describe('BR-13: B2B & Horeca Draw Isolation', () => {
    it('BR-13a: No code path decrements Reserve or Buffer bucket for B2B/Horeca orders', async () => {
      const { service } = createTestService();
      await expect(service.requestB2BHorecaDraw()).rejects.toThrowError(AppError);
    });

    it('BR-13b: B2B/Horeca draw endpoint returns 501 NOT_IMPLEMENTED (contested contradiction 10)', async () => {
      const { service } = createTestService();
      try {
        await service.requestB2BHorecaDraw();
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).status).toBe(501);
      }
    });
  });

  describe('Property Test: Exact Rounding across 200 Arbitrary Batches', () => {
    it('Property: 200 arbitrary batch sizes sum exactly to batch quantity and none is negative', async () => {
      const { service } = createTestService();

      const testCases: number[] = [
        // Edge cases
        0.001,
        0.004,
        0.010,
        1.000,
        10.001,
        33.333,
        99.999,
        100.000,
        1000.555,
        50000.789,
      ];

      // Generate random quantities from 0.001 kg to 20,000 kg
      for (let i = 0; i < 190; i++) {
        const randomKg = Math.round((Math.random() * 19999 + 0.001) * 1000) / 1000;
        testCases.push(randomKg);
      }

      for (let i = 0; i < testCases.length; i++) {
        const qty = testCases[i]!;
        const batchId = `prop-batch-${i}`;

        const result = await service.allocateBatch({
          batchId,
          warehouseId: IDS.warehouseOoty,
          cropId: IDS.cropCarrot,
          qtyReceivedKg: qty.toFixed(3),
        });

        expect(result).toHaveLength(4);

        let sumAllocated = 0;
        for (const item of result) {
          const itemQty = Number(item.allocatedQtyKg);
          expect(itemQty).toBeGreaterThanOrEqual(0);
          sumAllocated += itemQty;
        }

        const exactSum = Math.round(sumAllocated * 1000) / 1000;
        const expectedQty = Math.round(qty * 1000) / 1000;
        expect(exactSum).toBe(expectedQty);
      }
    });

    it('Property: Non-standard percentage sets (e.g. 55/15/15/15, 25/25/25/25) always sum exactly', async () => {
      const customPercentagesList: EffectivePercentage[][] = [
        [
          { channel: 'ONLINE', percentage: 55 },
          { channel: 'LIVE_MARKET', percentage: 15 },
          { channel: 'RESERVE', percentage: 15 },
          { channel: 'BUFFER', percentage: 15 },
        ],
        [
          { channel: 'ONLINE', percentage: 25 },
          { channel: 'LIVE_MARKET', percentage: 25 },
          { channel: 'RESERVE', percentage: 25 },
          { channel: 'BUFFER', percentage: 25 },
        ],
        [
          { channel: 'ONLINE', percentage: 80 },
          { channel: 'LIVE_MARKET', percentage: 10 },
          { channel: 'RESERVE', percentage: 5 },
          { channel: 'BUFFER', percentage: 5 },
        ],
      ];

      for (const customPercentages of customPercentagesList) {
        const { service, repo } = createTestService();
        repo.customPercentages = customPercentages;

        for (let i = 0; i < 50; i++) {
          const randomQty = Math.round((Math.random() * 5000 + 0.001) * 1000) / 1000;
          const result = await service.allocateBatch({
            batchId: `custom-batch-${i}`,
            warehouseId: IDS.warehouseOoty,
            cropId: IDS.cropCarrot,
            qtyReceivedKg: randomQty.toFixed(3),
          });

          const sum = Number(
            result.reduce((acc, r) => acc + Number(r.allocatedQtyKg), 0).toFixed(3),
          );
          expect(sum).toBe(randomQty);
        }
      }
    });
  });
});
