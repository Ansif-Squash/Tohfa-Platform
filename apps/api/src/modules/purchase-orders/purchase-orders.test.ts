import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, aSubWarehouseAdmin, anActor, IDS } from '../../test/factories.js';
import {
  calculateTotalAmountPaise,
  createPurchaseOrdersService,
  formatPoRowToResponse,
  type ListingForApproval,
} from './purchase-orders.service.js';
import type {
  InsertPurchaseOrderData,
  PurchaseOrdersRepo,
  PurchaseOrderRow,
} from './purchase-orders.repo.js';

describe('PurchaseOrdersService (Unit & Business Rules)', () => {
  const WH_OOTY = IDS.warehouseOoty;
  const WH_COONOOR = IDS.warehouseCoonoor;

  const mockActorAdmin: Actor = anActor({
    userId: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
  });

  const mockScopeAdmin: ResolvedScope = aScope({
    level: ScopeLevel.ALL,
    permission: 'purchase.order.view',
    roleCode: RoleCode.SUPER_ADMIN,
  });

  const mockActorSubWhOoty: Actor = aSubWarehouseAdmin(WH_OOTY);

  const mockScopeSubWhOoty: ResolvedScope = aScope({
    level: ScopeLevel.OWN,
    permission: 'purchase.order.view',
    roleCode: RoleCode.SUB_WH_ADMIN,
    warehouseIds: [WH_OOTY],
    userId: mockActorSubWhOoty.userId,
  });

  const samplePoRow: PurchaseOrderRow = {
    id: 'po-11111111-1111-1111-1111-111111111111',
    po_number: 'PO-2026-000001',
    farmer_id: IDS.farmer,
    listing_id: 'lst-11111111-1111-1111-1111-111111111111',
    warehouse_id: WH_OOTY,
    crop_id: 'crop-11111111-1111-1111-1111-111111111111',
    grade: 'GRADE_1',
    quantity_kg: '250.000',
    price_per_kg: '52.00',
    total_amount: '13000.00',
    status: 'ISSUED',
    issued_by: IDS.userSuperAdmin,
    issued_at: new Date('2026-08-28T10:00:00Z'),
    expected_delivery_date: '2026-08-30',
    cancelled_by: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: new Date('2026-08-28T10:00:00Z'),
    updated_at: null,
  };

  const createMockRepo = (overrides?: Partial<PurchaseOrdersRepo>): PurchaseOrdersRepo => ({
    nextPoNumber: async () => 'PO-2026-000001',
    insertPurchaseOrder: async (_tx, data: InsertPurchaseOrderData) => ({
      ...samplePoRow,
      farmer_id: data.farmerId,
      listing_id: data.listingId,
      warehouse_id: data.warehouseId,
      crop_id: data.cropId,
      grade: data.grade,
      quantity_kg: data.quantityKg,
      price_per_kg: data.pricePerKg,
      total_amount: data.totalAmount,
      issued_by: data.issuedBy,
      expected_delivery_date: data.expectedDeliveryDate ?? null,
    }),
    findPurchaseOrderById: async (_tx, id, scope) => {
      if (id !== samplePoRow.id) return null;
      if (scope.warehouseIds.length > 0 && !scope.warehouseIds.includes(samplePoRow.warehouse_id)) {
        return null;
      }
      return {
        id: samplePoRow.id,
        poNumber: samplePoRow.po_number,
        farmerId: samplePoRow.farmer_id,
        listingId: samplePoRow.listing_id,
        warehouseId: samplePoRow.warehouse_id,
        cropId: samplePoRow.crop_id,
        grade: samplePoRow.grade,
        quantityKg: samplePoRow.quantity_kg,
        pricePerKg: samplePoRow.price_per_kg,
        totalAmount: samplePoRow.total_amount,
        status: samplePoRow.status,
        expectedDeliveryDate: samplePoRow.expected_delivery_date,
        issuedAt: samplePoRow.issued_at.toISOString(),
        farmerName: 'Farmer Murugan',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
        goodsReceipts: [],
      };
    },
    findPurchaseOrderByListingId: async () => null,
    listPurchaseOrders: async () => ({
      items: [formatPoRowToResponse(samplePoRow)],
      nextCursor: null,
      hasMore: false,
    }),
    findGoodsReceiptsByPoId: async () => [],
    ...overrides,
  });

  const createTestService = (overrides?: Partial<PurchaseOrdersRepo>) =>
    createPurchaseOrdersService(createMockRepo(overrides));

  it('Calculates total amount in integer paise Money accurately', () => {
    // 250.000 kg @ Rs 52.00/kg = Rs 13,000.00
    expect(calculateTotalAmountPaise('52.00', '250.000')).toBe('13000.00');

    // 75.500 kg @ Rs 48.75/kg = Rs 3,680.63
    expect(calculateTotalAmountPaise('48.75', '75.500')).toBe('3680.63');
  });

  it('Negotiated terms: Adopts counter-offer final price and quantity over asking terms', async () => {
    let capturedInsert: InsertPurchaseOrderData | null = null;
    const service = createTestService({
      insertPurchaseOrder: async (_tx, data) => {
        capturedInsert = data;
        return {
          ...samplePoRow,
          farmer_id: data.farmerId,
          listing_id: data.listingId,
          warehouse_id: data.warehouseId,
          crop_id: data.cropId,
          grade: data.grade,
          price_per_kg: data.pricePerKg,
          quantity_kg: data.quantityKg,
          total_amount: data.totalAmount,
          issued_by: data.issuedBy,
          expected_delivery_date: data.expectedDeliveryDate ?? null,
          id: 'po-1',
          po_number: 'PO-2026-000001',
        };
      },
    });

    const negotiatedListing: ListingForApproval = {
      id: 'lst-1',
      farmerId: IDS.farmer,
      cropId: 'crop-1',
      grade: 'GRADE_1',
      askingPricePerKg: '100.00',
      quantityKg: '100.000',
      finalPricePerKg: '75.00', // Negotiated down
      finalQuantityKg: '75.000', // Negotiated down
    };

    const po = await service.createForListing(
      {} as any,
      mockActorAdmin,
      mockScopeAdmin,
      negotiatedListing,
      { warehouseId: WH_OOTY, expectedDeliveryDate: '2026-09-01' },
    );

    expect(capturedInsert).not.toBeNull();
    expect(capturedInsert!.pricePerKg).toBe('75.00');
    expect(capturedInsert!.quantityKg).toBe('75.000');
    expect(capturedInsert!.totalAmount).toBe('5625.00'); // 75.00 * 75 = 5625.00

    expect(po.pricePerKg).toBe('75.00');
    expect(po.quantityKg).toBe('75.000');
    expect(po.totalAmount).toBe('5625.00');
  });

  it('Unnegotiated terms: Falls back to asking price and quantity when no counter-offer was negotiated', async () => {
    let capturedInsert: InsertPurchaseOrderData | null = null;
    const service = createTestService({
      insertPurchaseOrder: async (_tx, data) => {
        capturedInsert = data;
        return {
          ...samplePoRow,
          farmer_id: data.farmerId,
          listing_id: data.listingId,
          warehouse_id: data.warehouseId,
          crop_id: data.cropId,
          grade: data.grade,
          price_per_kg: data.pricePerKg,
          quantity_kg: data.quantityKg,
          total_amount: data.totalAmount,
          issued_by: data.issuedBy,
          expected_delivery_date: data.expectedDeliveryDate ?? null,
          id: 'po-2',
          po_number: 'PO-2026-000002',
        };
      },
    });

    const directListing: ListingForApproval = {
      id: 'lst-2',
      farmerId: IDS.farmer,
      cropId: 'crop-1',
      grade: 'GRADE_1',
      askingPricePerKg: '52.00',
      quantityKg: '250.000',
      finalPricePerKg: null,
      finalQuantityKg: null,
    };

    const po = await service.createForListing(
      {} as any,
      mockActorAdmin,
      mockScopeAdmin,
      directListing,
      { warehouseId: WH_OOTY },
    );

    expect(capturedInsert).not.toBeNull();
    expect(capturedInsert!.pricePerKg).toBe('52.00');
    expect(capturedInsert!.quantityKg).toBe('250.000');
    expect(capturedInsert!.totalAmount).toBe('13000.00');
    expect(po.totalAmount).toBe('13000.00');
  });

  it('Idempotent: Calling create twice for the same listing returns the existing PO without renumbering', async () => {
    let insertCalls = 0;
    const existingPoRow: PurchaseOrderRow = {
      ...samplePoRow,
      id: 'existing-po-uuid',
      po_number: 'PO-2026-000042',
    };

    const service = createTestService({
      findPurchaseOrderByListingId: async (_tx, listingId) => {
        if (listingId === 'lst-idempotent') return existingPoRow;
        return null;
      },
      insertPurchaseOrder: async () => {
        insertCalls += 1;
        return samplePoRow;
      },
    });

    const listing: ListingForApproval = {
      id: 'lst-idempotent',
      farmerId: IDS.farmer,
      cropId: 'crop-1',
      grade: 'GRADE_1',
      askingPricePerKg: '50.00',
      quantityKg: '100.000',
    };

    const result = await service.createForListing(
      {} as any,
      mockActorAdmin,
      mockScopeAdmin,
      listing,
      { warehouseId: WH_OOTY },
    );

    expect(insertCalls).toBe(0); // Insert should be skipped
    expect(result.id).toBe('existing-po-uuid');
    expect(result.poNumber).toBe('PO-2026-000042');
  });

  it('BR-30a: Sub Warehouse Admin fetches their assigned warehouse PO successfully', async () => {
    const service = createTestService();
    const result = await service.getById(
      mockActorSubWhOoty,
      mockScopeSubWhOoty,
      samplePoRow.id,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(samplePoRow.id);
    expect(result.warehouseId).toBe(WH_OOTY);
  });

  it('BR-30b: Sub Warehouse Admin fetching another warehouse PO gets 404 NOT_FOUND (never 403)', async () => {
    const service = createTestService();

    // Scope restricted to Coonoor warehouse
    const mockScopeSubWhCoonoor: ResolvedScope = aScope({
      level: ScopeLevel.OWN,
      permission: 'purchase.order.view',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [WH_COONOOR],
      userId: IDS.userSubWhAdmin,
    });

    await expect(
      service.getById(mockActorSubWhOoty, mockScopeSubWhCoonoor, samplePoRow.id),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(404);
      expect(e.code).toBe('NOT_FOUND');
      return true;
    });
  });

  it('BR-30c: Super Admin / Main Warehouse Admin can fetch POs across all warehouses', async () => {
    const service = createTestService();
    const result = await service.getById(
      mockActorAdmin,
      mockScopeAdmin,
      samplePoRow.id,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(samplePoRow.id);
  });
});
