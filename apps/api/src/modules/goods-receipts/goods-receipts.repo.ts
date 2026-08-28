import type { Executor } from '../../db/pool.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import type { ProduceGrade } from '../purchase-orders/purchase-orders.schema.js';
import type {
  CreateGoodsReceiptBody,
  GoodsReceiptResponse,
  GrnStatus,
  ListGoodsReceiptsQuery,
  QcOutcome,
  QualityCheckCreateBody,
  QualityCheckItemResponse,
  QualityCheckResponse,
} from './goods-receipts.schema.js';

export interface GoodsReceiptRow {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  warehouse_id: string;
  farmer_id: string;
  status: GrnStatus;
  gross_qty_kg: string;
  accepted_qty_kg: string;
  rejected_qty_kg: string;
  rejection_reason: string | null;
  vehicle_number: string | null;
  photo_keys: string[];
  received_by: string;
  received_at: Date;
  created_at: Date;
  updated_at: Date | null;
}

export interface QualityCheckRow {
  id: string;
  goods_receipt_id: string;
  warehouse_id: string;
  assigned_grade: ProduceGrade;
  listed_grade: ProduceGrade;
  outcome: QcOutcome;
  accepted_qty_kg: string;
  rejected_qty_kg: string;
  price_adjustment: string;
  defect_notes: string | null;
  photo_keys: string[];
  checked_by: string;
  checked_at: Date;
  created_at: Date;
  updated_at: Date | null;
}

export interface PurchaseOrderForReceipt {
  id: string;
  poNumber: string;
  farmerId: string;
  warehouseId: string;
  cropId: string;
  cropName: string;
  grade: ProduceGrade;
  quantityKg: string;
  pricePerKg: string;
  status: string;
}

export interface InsertCounterOfferData {
  goodsReceiptId: string;
  pricePerKg: string;
  quantityKg: string;
  message?: string | null | undefined;
  offeredByUserId: string;
  expiresAt: Date;
}

export interface GoodsReceiptsRepo {
  nextGrnNumber(tx: Executor): Promise<string>;
  insertGoodsReceipt(
    tx: Executor,
    data: CreateGoodsReceiptBody & { farmerId: string; receivedBy: string },
  ): Promise<GoodsReceiptRow>;
  findGoodsReceiptById(
    tx: Executor,
    id: string,
    scope: ResolvedScope,
  ): Promise<GoodsReceiptResponse | null>;
  findPurchaseOrderForReceipt(tx: Executor, poId: string): Promise<PurchaseOrderForReceipt | null>;
  insertQualityCheckWithItems(
    tx: Executor,
    data: QualityCheckCreateBody & {
      goodsReceiptId: string;
      warehouseId: string;
      listedGrade: ProduceGrade;
      checkedBy: string;
    },
  ): Promise<QualityCheckResponse>;
  findQualityCheckByGoodsReceiptId(
    tx: Executor,
    goodsReceiptId: string,
  ): Promise<QualityCheckResponse | null>;
  updateGoodsReceiptStatus(
    tx: Executor,
    id: string,
    status: GrnStatus,
    acceptedQtyKg: string,
    rejectedQtyKg: string,
    rejectionReason?: string | null,
  ): Promise<void>;
  insertQualityCounterOffer(tx: Executor, data: InsertCounterOfferData): Promise<unknown>;
  listGoodsReceipts(
    tx: Executor,
    scope: ResolvedScope,
    query: ListGoodsReceiptsQuery,
  ): Promise<{ items: GoodsReceiptResponse[]; nextCursor: string | null; hasMore: boolean }>;
}

export const goodsReceiptsRepo: GoodsReceiptsRepo = {
  async nextGrnNumber(tx: Executor): Promise<string> {
    const year = new Date().getFullYear();
    const result = await tx.query<{ seq: string }>(
      `SELECT nextval('goods_receipt_number_seq')::text AS seq`,
    );
    const num = (result.rows[0]?.seq ?? '1').padStart(6, '0');
    return `GRN-${year}-${num}`;
  },

  async insertGoodsReceipt(
    tx: Executor,
    data: CreateGoodsReceiptBody & { farmerId: string; receivedBy: string },
  ): Promise<GoodsReceiptRow> {
    const grnNumber = await this.nextGrnNumber(tx);
    const sql = `
      INSERT INTO goods_receipts (
        grn_number,
        purchase_order_id,
        warehouse_id,
        farmer_id,
        gross_qty_kg,
        vehicle_number,
        photo_keys,
        received_by,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'AWAITING_QC')
      RETURNING
        id,
        grn_number,
        purchase_order_id,
        warehouse_id,
        farmer_id,
        status,
        gross_qty_kg::text,
        accepted_qty_kg::text,
        rejected_qty_kg::text,
        rejection_reason,
        vehicle_number,
        photo_keys,
        received_by,
        received_at,
        created_at,
        updated_at
    `;

    const values = [
      grnNumber,
      data.purchaseOrderId,
      data.warehouseId,
      data.farmerId,
      data.grossQtyKg,
      data.vehicleNumber ?? null,
      data.photos,
      data.receivedBy,
    ];

    const result = await tx.query<GoodsReceiptRow>(sql, values);
    return result.rows[0]!;
  },

  async findPurchaseOrderForReceipt(
    tx: Executor,
    poId: string,
  ): Promise<PurchaseOrderForReceipt | null> {
    const sql = `
      SELECT
        po.id,
        po.po_number AS "poNumber",
        po.farmer_id AS "farmerId",
        po.warehouse_id AS "warehouseId",
        po.crop_id AS "cropId",
        c.name AS "cropName",
        po.grade,
        po.quantity_kg::text AS "quantityKg",
        po.price_per_kg::text AS "pricePerKg",
        po.status
      FROM purchase_orders po
      JOIN crop_master c ON c.id = po.crop_id
      WHERE po.id = $1
    `;
    const result = await tx.query<PurchaseOrderForReceipt>(sql, [poId]);
    return result.rows[0] ?? null;
  },

  async findGoodsReceiptById(
    tx: Executor,
    id: string,
    scope: ResolvedScope,
  ): Promise<GoodsReceiptResponse | null> {
    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'gr.warehouse_id',
      startIndex: 2,
    });

    const sql = `
      SELECT
        gr.id,
        gr.grn_number AS "grnNumber",
        gr.purchase_order_id AS "purchaseOrderId",
        gr.warehouse_id AS "warehouseId",
        gr.farmer_id AS "farmerId",
        gr.gross_qty_kg::text AS "grossQtyKg",
        gr.accepted_qty_kg::text AS "acceptedQtyKg",
        gr.rejected_qty_kg::text AS "rejectedQtyKg",
        gr.rejection_reason AS "rejectionReason",
        gr.vehicle_number AS "vehicleNumber",
        COALESCE(gr.photo_keys, '{}') AS "photos",
        gr.status,
        gr.received_by AS "receivedBy",
        gr.received_at::text AS "receivedAt",
        po.po_number AS "poNumber",
        c.name AS "cropName",
        po.grade
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      JOIN crop_master c ON c.id = po.crop_id
      WHERE gr.id = $1 AND ${scopeFilter.sql}
    `;

    const result = await tx.query<GoodsReceiptResponse>(sql, [id, ...scopeFilter.params]);
    return result.rows[0] ?? null;
  },

  async insertQualityCheckWithItems(
    tx: Executor,
    data: QualityCheckCreateBody & {
      goodsReceiptId: string;
      warehouseId: string;
      listedGrade: ProduceGrade;
      checkedBy: string;
    },
  ): Promise<QualityCheckResponse> {
    const qcSql = `
      INSERT INTO quality_checks (
        goods_receipt_id,
        warehouse_id,
        assigned_grade,
        listed_grade,
        outcome,
        accepted_qty_kg,
        rejected_qty_kg,
        price_adjustment,
        defect_notes,
        photo_keys,
        checked_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        goods_receipt_id AS "goodsReceiptId",
        warehouse_id AS "warehouseId",
        assigned_grade AS "assignedGrade",
        listed_grade AS "listedGrade",
        outcome,
        accepted_qty_kg::text AS "acceptedQtyKg",
        rejected_qty_kg::text AS "rejectedQtyKg",
        price_adjustment::text AS "priceAdjustment",
        defect_notes AS "defectNotes",
        COALESCE(photo_keys, '{}') AS "photos",
        checked_by AS "checkedBy",
        checked_at::text AS "checkedAt"
    `;

    const qcValues = [
      data.goodsReceiptId,
      data.warehouseId,
      data.assignedGrade,
      data.listedGrade,
      data.outcome,
      data.acceptedQtyKg,
      data.rejectedQtyKg ?? '0.000',
      data.priceAdjustment ?? '0.00',
      data.defectNotes ?? null,
      data.photos,
      data.checkedBy,
    ];

    const qcResult = await tx.query<QualityCheckResponse>(qcSql, qcValues);
    const qcRow = qcResult.rows[0]!;

    const itemResponses: QualityCheckItemResponse[] = [];
    for (const item of data.items) {
      const itemSql = `
        INSERT INTO quality_check_items (
          quality_check_id,
          parameter,
          score,
          passed,
          measured_value,
          remarks,
          photo_keys
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          quality_check_id AS "qualityCheckId",
          parameter,
          score,
          passed,
          measured_value AS "measuredValue",
          remarks,
          COALESCE(photo_keys, '{}') AS "photoKeys"
      `;

      const itemValues = [
        qcRow.id,
        item.parameter,
        item.score ?? null,
        item.passed,
        item.measuredValue ?? null,
        item.remarks ?? null,
        item.photoKeys,
      ];

      const itemRes = await tx.query<QualityCheckItemResponse>(itemSql, itemValues);
      itemResponses.push(itemRes.rows[0]!);
    }

    return {
      ...qcRow,
      items: itemResponses,
    };
  },

  async findQualityCheckByGoodsReceiptId(
    tx: Executor,
    goodsReceiptId: string,
  ): Promise<QualityCheckResponse | null> {
    const sql = `
      SELECT
        qc.id,
        qc.goods_receipt_id AS "goodsReceiptId",
        qc.warehouse_id AS "warehouseId",
        qc.assigned_grade AS "assignedGrade",
        qc.listed_grade AS "listedGrade",
        qc.outcome,
        qc.accepted_qty_kg::text AS "acceptedQtyKg",
        qc.rejected_qty_kg::text AS "rejectedQtyKg",
        qc.price_adjustment::text AS "priceAdjustment",
        qc.defect_notes AS "defectNotes",
        COALESCE(qc.photo_keys, '{}') AS "photos",
        qc.checked_by AS "checkedBy",
        qc.checked_at::text AS "checkedAt"
      FROM quality_checks qc
      WHERE qc.goods_receipt_id = $1
    `;
    const result = await tx.query<QualityCheckResponse>(sql, [goodsReceiptId]);
    const qc = result.rows[0];
    if (!qc) return null;

    const itemsSql = `
      SELECT
        id,
        quality_check_id AS "qualityCheckId",
        parameter,
        score,
        passed,
        measured_value AS "measuredValue",
        remarks,
        COALESCE(photo_keys, '{}') AS "photoKeys"
      FROM quality_check_items
      WHERE quality_check_id = $1
    `;
    const itemsRes = await tx.query<QualityCheckItemResponse>(itemsSql, [qc.id]);
    return {
      ...qc,
      items: itemsRes.rows,
    };
  },

  async updateGoodsReceiptStatus(
    tx: Executor,
    id: string,
    status: GrnStatus,
    acceptedQtyKg: string,
    rejectedQtyKg: string,
    rejectionReason?: string | null,
  ): Promise<void> {
    const sql = `
      UPDATE goods_receipts
      SET
        status = $2,
        accepted_qty_kg = $3,
        rejected_qty_kg = $4,
        rejection_reason = $5,
        updated_at = now()
      WHERE id = $1
    `;
    await tx.query(sql, [
      id,
      status,
      acceptedQtyKg,
      rejectedQtyKg,
      rejectionReason ?? null,
    ]);
  },

  async insertQualityCounterOffer(
    tx: Executor,
    data: InsertCounterOfferData,
  ): Promise<unknown> {
    const sql = `
      INSERT INTO counter_offers (
        goods_receipt_id,
        round,
        offered_by,
        offered_by_user_id,
        price_per_kg,
        quantity_kg,
        message,
        status,
        expires_at
      )
      VALUES ($1, 1, 'ADMIN', $2, $3, $4, $5, 'PENDING', $6)
      RETURNING
        id,
        goods_receipt_id AS "goodsReceiptId",
        round,
        offered_by AS "offeredBy",
        price_per_kg::text AS "pricePerKg",
        quantity_kg::text AS "quantityKg",
        message,
        status,
        expires_at::text AS "expiresAt"
    `;

    const values = [
      data.goodsReceiptId,
      data.offeredByUserId,
      data.pricePerKg,
      data.quantityKg,
      data.message ?? null,
      data.expiresAt,
    ];

    const result = await tx.query(sql, values);
    return result.rows[0];
  },

  async listGoodsReceipts(
    tx: Executor,
    scope: ResolvedScope,
    query: ListGoodsReceiptsQuery,
  ): Promise<{ items: GoodsReceiptResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (query.status) {
      conditions.push(`gr.status = $${index}`);
      params.push(query.status);
      index += 1;
    }

    if (query.warehouseId) {
      conditions.push(`gr.warehouse_id = $${index}`);
      params.push(query.warehouseId);
      index += 1;
    }

    if (query.purchaseOrderId) {
      conditions.push(`gr.purchase_order_id = $${index}`);
      params.push(query.purchaseOrderId);
      index += 1;
    }

    if (query.cursor) {
      conditions.push(`gr.received_at < $${index}::timestamptz`);
      params.push(query.cursor);
      index += 1;
    }

    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'gr.warehouse_id',
      startIndex: index,
    });
    conditions.push(scopeFilter.sql);
    params.push(...scopeFilter.params);
    index = scopeFilter.nextIndex;

    const limit = query.limit;
    params.push(limit + 1);
    const limitClause = `LIMIT $${index}`;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        gr.id,
        gr.grn_number AS "grnNumber",
        gr.purchase_order_id AS "purchaseOrderId",
        gr.warehouse_id AS "warehouseId",
        gr.farmer_id AS "farmerId",
        gr.gross_qty_kg::text AS "grossQtyKg",
        gr.accepted_qty_kg::text AS "acceptedQtyKg",
        gr.rejected_qty_kg::text AS "rejectedQtyKg",
        gr.rejection_reason AS "rejectionReason",
        gr.vehicle_number AS "vehicleNumber",
        COALESCE(gr.photo_keys, '{}') AS "photos",
        gr.status,
        gr.received_by AS "receivedBy",
        gr.received_at::text AS "receivedAt",
        po.po_number AS "poNumber",
        c.name AS "cropName",
        po.grade
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      JOIN crop_master c ON c.id = po.crop_id
      ${whereClause}
      ORDER BY gr.received_at DESC
      ${limitClause}
    `;

    const result = await tx.query<GoodsReceiptResponse>(sql, params);
    const hasMore = result.rows.length > limit;
    const items = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.receivedAt : null;

    return { items, nextCursor, hasMore };
  },
};
