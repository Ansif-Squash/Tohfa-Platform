import type { Executor } from '../../db/pool.js';
import type {
  AdminOrdersQuery,
  AdminOrderSummary,
  AdminOrderDetail,
  OrderTracking,
  OrderTrackingEvent,
} from './fulfilment.schema.js';
import type { OrderStatus, ProduceGrade, SalesChannel, FulfillmentType } from './orders.schema.js';
import type { Money } from '@tohfa/shared-types';

export interface FulfilmentRepo {
  listAdminOrders(
    db: Executor,
    warehouseScope: string | null,
    query: AdminOrdersQuery,
  ): Promise<{ items: AdminOrderSummary[]; nextCursor: string | null; hasMore: boolean }>;

  findOrderForFulfilment(
    db: Executor,
    orderId: string,
    warehouseScope?: string | null,
  ): Promise<AdminOrderDetail | null>;

  getOrderDeliveryOtpHolder(
    db: Executor,
    orderId: string,
  ): Promise<{
    id: string;
    status: OrderStatus;
    fulfilmentType: FulfillmentType;
    deliveryOtpHash: string | null;
    otpAttempts: number;
    customerId: string;
    warehouseId: string;
  } | null>;

  updateOrderStatus(
    db: Executor,
    params: {
      orderId: string;
      fromStatus: OrderStatus;
      toStatus: OrderStatus;
      actorUserId: string;
      note?: string | null;
      warehouseId?: string;
      packedAt?: Date;
      completedAt?: Date;
      otpVerifiedAt?: Date;
      otpVerifiedBy?: string;
      cancellationReason?: string;
    },
  ): Promise<void>;

  incrementOtpAttempts(db: Executor, orderId: string): Promise<number>;

  getOrderTracking(
    db: Executor,
    orderId: string,
    customerScope?: string | null,
  ): Promise<OrderTracking | null>;

  getMaxOtpAttempts(db: Executor): Promise<number>;
}

export const fulfilmentRepo: FulfilmentRepo = {
  async listAdminOrders(db, warehouseScope, query) {
    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let idx = 1;

    // Warehouse isolation
    if (warehouseScope) {
      conditions.push(`o.warehouse_id = $${idx++}`);
      values.push(warehouseScope);
    } else if (query.warehouseId) {
      conditions.push(`o.warehouse_id = $${idx++}`);
      values.push(query.warehouseId);
    }

    if (query.status) {
      conditions.push(`o.status = $${idx++}`);
      values.push(query.status);
    }

    if (query.channel) {
      conditions.push(`o.channel = $${idx++}`);
      values.push(query.channel);
    }

    if (query.deliveryDate) {
      conditions.push(`o.delivery_date = $${idx++}`);
      values.push(query.deliveryDate);
    }

    if (query.cursor) {
      try {
        const decoded = Buffer.from(query.cursor, 'base64').toString('utf8');
        const [placedAt, id] = decoded.split('|');
        if (placedAt && id) {
          conditions.push(`(o.placed_at, o.id) < ($${idx++}, $${idx++})`);
          values.push(new Date(placedAt), id);
        }
      } catch {
        // Invalid cursor ignored
      }
    }

    const limit = query.limit || 20;
    values.push(limit + 1);

    const sql = `
      SELECT o.id, o.order_number AS "orderNumber", o.status, o.channel,
             o.fulfilment_type AS "fulfillmentType", o.warehouse_id AS "warehouseId",
             o.total_amount::text AS "totalAmount", o.payment_status AS "paymentStatus",
             o.delivery_date::text AS "deliveryDate", o.placed_at AS "placedAt",
             (SELECT count(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount"
        FROM orders o
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.placed_at DESC, o.id DESC
       LIMIT $${idx}
    `;

    const res = await db.query<any>(sql, values);
    const hasMore = res.rows.length > limit;
    const items = res.rows.slice(0, limit).map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status as OrderStatus,
      channel: r.channel as SalesChannel,
      fulfillmentType: r.fulfillmentType as FulfillmentType,
      warehouseId: r.warehouseId,
      itemCount: r.itemCount,
      totalAmount: r.totalAmount as Money,
      paymentStatus: r.paymentStatus,
      deliveryDate: r.deliveryDate,
      placedAt: new Date(r.placedAt).toISOString(),
    }));

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = res.rows[limit - 1]!;
      nextCursor = Buffer.from(
        `${new Date(last.placedAt).toISOString()}|${last.id}`,
      ).toString('base64');
    }

    return { items, nextCursor, hasMore };
  },

  async findOrderForFulfilment(db, orderId, warehouseScope) {
    const conditions = ['o.id = $1'];
    const values: unknown[] = [orderId];

    if (warehouseScope) {
      conditions.push('o.warehouse_id = $2');
      values.push(warehouseScope);
    }

    const orderRes = await db.query<any>(
      `SELECT o.id, o.order_number AS "orderNumber", o.status, o.channel,
              o.fulfilment_type AS "fulfillmentType", o.warehouse_id AS "warehouseId",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_status AS "paymentStatus",
              o.delivery_date::text AS "deliveryDate", o.delivery_slot AS "deliverySlot",
              o.delivery_address_id AS "deliveryAddressId",
              (o.delivery_otp_hash IS NOT NULL) AS "otpRequired",
              o.cancellation_reason AS "cancellationReason",
              o.completed_at AS "deliveredAt",
              o.placed_at AS "placedAt"
         FROM orders o
        WHERE ${conditions.join(' AND ')}`,
      values,
    );

    const order = orderRes.rows[0];
    if (!order) return null;

    const itemsRes = await db.query<any>(
      `SELECT oi.id, oi.crop_id AS "productId", cm.name, oi.grade,
              oi.qty_kg::text AS "qtyKg", oi.fulfilled_qty_kg::text AS "fulfilledQtyKg",
              oi.unit_price::text AS "unitPrice", oi.gst_rate AS "gstRate",
              oi.gst_amount::text AS "gstAmount", oi.line_total::text AS "lineTotal"
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC`,
      [order.id],
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      channel: order.channel as SalesChannel,
      fulfillmentType: order.fulfillmentType as FulfillmentType,
      warehouseId: order.warehouseId,
      itemCount: itemsRes.rows.length,
      totalAmount: order.totalAmount as Money,
      paymentStatus: order.paymentStatus,
      deliveryDate: order.deliveryDate,
      placedAt: new Date(order.placedAt).toISOString(),
      subtotal: order.subtotal as Money,
      deliveryFee: order.deliveryFee as Money,
      discount: order.discount as Money,
      gstAmount: order.gstAmount as Money,
      deliverySlot: order.deliverySlot,
      deliveryAddressId: order.deliveryAddressId,
      otpRequired: order.otpRequired,
      cancellationReason: order.cancellationReason,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
      items: itemsRes.rows.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        grade: it.grade as ProduceGrade,
        qtyKg: it.qtyKg,
        fulfilledQtyKg: it.fulfilledQtyKg,
        unitPrice: it.unitPrice as Money,
        gstRate: Number(it.gstRate),
        gstAmount: it.gstAmount as Money,
        lineTotal: it.lineTotal as Money,
      })),
    };
  },

  async getOrderDeliveryOtpHolder(db, orderId) {
    const res = await db.query<{
      id: string;
      status: OrderStatus;
      fulfilment_type: FulfillmentType;
      delivery_otp_hash: string | null;
      otp_attempts: number;
      customer_id: string;
      warehouse_id: string;
    }>(
      `SELECT id, status, fulfilment_type, delivery_otp_hash, otp_attempts,
              customer_id, warehouse_id
         FROM orders
        WHERE id = $1`,
      [orderId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      fulfilmentType: row.fulfilment_type,
      deliveryOtpHash: row.delivery_otp_hash,
      otpAttempts: row.otp_attempts,
      customerId: row.customer_id,
      warehouseId: row.warehouse_id,
    };
  },

  async updateOrderStatus(db, params) {
    // 1. Update orders table
    await db.query(
      `UPDATE orders
          SET status = $1,
              warehouse_id = COALESCE($2, warehouse_id),
              packed_at = COALESCE($3, packed_at),
              completed_at = COALESCE($4, completed_at),
              otp_verified_at = COALESCE($5, otp_verified_at),
              otp_verified_by = COALESCE($6, otp_verified_by),
              cancellation_reason = COALESCE($7, cancellation_reason),
              updated_at = now()
        WHERE id = $8 AND status = $9`,
      [
        params.toStatus,
        params.warehouseId ?? null,
        params.packedAt ?? null,
        params.completedAt ?? null,
        params.otpVerifiedAt ?? null,
        params.otpVerifiedBy ?? null,
        params.cancellationReason ?? null,
        params.orderId,
        params.fromStatus,
      ],
    );

    // 2. Append to order_status_history
    await db.query(
      `INSERT INTO order_status_history (
         order_id, from_status, to_status, changed_by, note, created_at
       )
       VALUES ($1, $2, $3, $4, $5, now())`,
      [
        params.orderId,
        params.fromStatus,
        params.toStatus,
        params.actorUserId,
        params.note ?? null,
      ],
    );
  },

  async incrementOtpAttempts(db, orderId) {
    const res = await db.query<{ otp_attempts: number }>(
      `UPDATE orders
          SET otp_attempts = otp_attempts + 1,
              updated_at = now()
        WHERE id = $1
        RETURNING otp_attempts`,
      [orderId],
    );
    return res.rows[0]?.otp_attempts ?? 0;
  },

  async getOrderTracking(db, orderId, customerScope) {
    const conditions = ['o.id = $1'];
    const values: unknown[] = [orderId];

    if (customerScope) {
      conditions.push('o.customer_id = $2');
      values.push(customerScope);
    }

    const orderRes = await db.query<{
      id: string;
      status: OrderStatus;
      delivery_otp_hash: string | null;
      otp_verified_at: Date | null;
      delivery_date: string | null;
    }>(
      `SELECT id, status, delivery_otp_hash, otp_verified_at, delivery_date::text
         FROM orders o
        WHERE ${conditions.join(' AND ')}`,
      values,
    );

    const order = orderRes.rows[0];
    if (!order) return null;

    const historyRes = await db.query<{
      id: string;
      to_status: OrderStatus;
      created_at: Date;
      note: string | null;
    }>(
      `SELECT id, to_status, created_at, note
         FROM order_status_history
        WHERE order_id = $1
        ORDER BY created_at ASC`,
      [order.id],
    );

    const events: OrderTrackingEvent[] = historyRes.rows.map((r) => ({
      id: r.id,
      status: r.to_status,
      at: r.created_at.toISOString(),
      note: r.note,
    }));

    return {
      orderId: order.id,
      status: order.status,
      otpRequired: Boolean(order.delivery_otp_hash && !order.otp_verified_at),
      estimatedArrival: order.delivery_date,
      events,
    };
  },

  async getMaxOtpAttempts(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'otp_max_attempts'`,
    );
    const row = res.rows[0];
    if (row && (typeof row.value === 'number' || typeof row.value === 'string')) {
      return Number(row.value);
    }
    return 3;
  },
};
