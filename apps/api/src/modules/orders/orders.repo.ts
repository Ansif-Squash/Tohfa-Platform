import { createHash } from 'node:crypto';
import type { Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type {
  DeliverySlot,
  FulfillmentType,
  ListOrdersQuery,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProduceGrade,
  SalesChannel,
} from './orders.schema.js';

export interface DeliveryConfig {
  deliveryFee: Money;
  freeDeliveryThreshold: Money;
  homeDeliveryEnabled: boolean;
}

export interface CartCheckoutItem {
  id: string;
  cartId: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: string;
  lineTotal: string;
  allocationId: string | null;
  batchId: string | null;
}

export interface CartCheckoutRecord {
  id: string;
  customerId: string;
  warehouseId: string | null;
  status: string;
  lockedAt: Date | null;
  lockedUntil: Date | null;
  items: CartCheckoutItem[];
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  warehouseId: string;
  cartId: string | null;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  deliveryAddressId: string | null;
  deliverySlot: DeliverySlot | null;
  deliveryDate: string | null;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  gstAmount: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryOtpHash: string | null;
  itemCount: number;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: string;
  lineTotal: string;
}

export interface OrdersRepo {
  getDeliveryConfig(db: Executor): Promise<DeliveryConfig>;

  findCartForCheckout(
    db: Executor,
    customerId: string,
  ): Promise<CartCheckoutRecord | null>;

  generateOrderNumber(db: Executor): Promise<string>;

  findOrderByCartId(
    db: Executor,
    cartId: string,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] } | null>;

  findOrderByCartOrIdempotencyKey(
    db: Executor,
    customerId: string,
    idempotencyKey: string,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] } | null>;

  findOrderById(
    db: Executor,
    orderId: string,
    customerId?: string | null,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] } | null>;

  listOrders(
    db: Executor,
    customerId: string,
    query: ListOrdersQuery,
  ): Promise<{ orders: OrderRecord[]; nextCursor: string | null; hasMore: boolean }>;

  checkAndBookDeliverySlot(
    db: Executor,
    warehouseId: string,
    slotDate: string,
    slot: DeliverySlot,
  ): Promise<void>;

  createOrder(
    db: Executor,
    params: {
      orderNumber: string;
      customerId: string;
      warehouseId: string;
      cartId: string;
      channel: SalesChannel;
      fulfillmentType: FulfillmentType;
      deliveryAddressId?: string | null | undefined;
      deliveryDate?: string | null | undefined;
      deliverySlot?: DeliverySlot | null | undefined;
      subtotal: Money;
      deliveryFee: Money;
      discount: Money;
      gstAmount: Money;
      totalAmount: Money;
      paymentMethod: PaymentMethod;
      deliveryOtpPlaintext: string;
      items: CartCheckoutItem[];
      actorUserId: string;
    },
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] }>;

  convertAllocationsAndAppendStockLedger(
    db: Executor,
    items: CartCheckoutItem[],
    orderId: string,
    warehouseId: string,
    actorUserId: string,
  ): Promise<void>;
}

export const ordersRepo: OrdersRepo = {
  async getDeliveryConfig(db) {
    const res = await db.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM system_config
        WHERE key IN ('delivery_fee', 'free_delivery_threshold', 'home_delivery_enabled')`,
    );

    let deliveryFee = '40.00' as Money;
    let freeDeliveryThreshold = '500.00' as Money;
    let homeDeliveryEnabled = true;

    for (const row of res.rows) {
      if (row.key === 'delivery_fee' && (typeof row.value === 'number' || typeof row.value === 'string')) {
        deliveryFee = String(row.value) as Money;
      } else if (row.key === 'free_delivery_threshold' && (typeof row.value === 'number' || typeof row.value === 'string')) {
        freeDeliveryThreshold = String(row.value) as Money;
      } else if (row.key === 'home_delivery_enabled' && typeof row.value === 'boolean') {
        homeDeliveryEnabled = row.value;
      }
    }

    return { deliveryFee, freeDeliveryThreshold, homeDeliveryEnabled };
  },

  async findCartForCheckout(db, customerId) {
    const cartRes = await db.query<{
      id: string;
      customer_id: string;
      warehouse_id: string | null;
      status: string;
      locked_at: Date | null;
      locked_until: Date | null;
    }>(
      `SELECT id, customer_id, warehouse_id, status, locked_at, locked_until
         FROM carts
        WHERE customer_id = $1
          AND status IN ('ACTIVE', 'LOCKED')
        ORDER BY created_at DESC
        LIMIT 1`,
      [customerId],
    );

    const cart = cartRes.rows[0];
    if (!cart) return null;

    const itemsRes = await db.query<{
      id: string;
      cartId: string;
      productId: string;
      name: string;
      grade: ProduceGrade;
      qtyKg: string;
      unitPrice: string;
      lineTotal: string;
      allocationId: string | null;
      batchId: string | null;
    }>(
      `SELECT ci.id, ci.cart_id AS "cartId", ci.crop_id AS "productId", cm.name, ci.grade,
              ci.qty_kg::text AS "qtyKg", ci.unit_price::text AS "unitPrice",
              ci.line_total::text AS "lineTotal", ci.allocation_id AS "allocationId",
              a.batch_id AS "batchId"
         FROM cart_items ci
         JOIN crop_master cm ON cm.id = ci.crop_id
    LEFT JOIN allocations a ON a.id = ci.allocation_id
        WHERE ci.cart_id = $1
          AND ci.status = 'HELD'
        ORDER BY ci.created_at ASC`,
      [cart.id],
    );

    return {
      id: cart.id,
      customerId: cart.customer_id,
      warehouseId: cart.warehouse_id,
      status: cart.status,
      lockedAt: cart.locked_at,
      lockedUntil: cart.locked_until,
      items: itemsRes.rows,
    };
  },

  async generateOrderNumber(db) {
    await db.query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1`);
    const res = await db.query<{ yr: string; num: string }>(
      `SELECT to_char(CURRENT_DATE, 'YYYY') AS yr,
              LPAD(nextval('order_number_seq')::text, 6, '0') AS num`,
    );
    const { yr, num } = res.rows[0]!;
    return `TOH-${yr}-${num}`;
  },

  async findOrderByCartId(db, cartId) {
    const res = await db.query<OrderRecord>(
      `SELECT o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
              o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
              o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
              o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
              (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
              o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt"
         FROM orders o
        WHERE o.cart_id = $1
        LIMIT 1`,
      [cartId],
    );

    const order = res.rows[0];
    if (!order) return null;

    const itemsRes = await db.query<OrderItemRecord>(
      `SELECT oi.id, oi.order_id AS "orderId", oi.crop_id AS "productId",
              cm.name, oi.grade, oi.qty_kg::text AS "qtyKg",
              oi.unit_price::text AS "unitPrice", oi.line_total::text AS "lineTotal"
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC`,
      [order.id],
    );

    return { order, items: itemsRes.rows };
  },

  async findOrderByCartOrIdempotencyKey(db, customerId, idempotencyKey) {
    const txRes = await db.query<{ ref_id: string }>(
      `SELECT ref_id FROM wallet_transactions
        WHERE idempotency_key = $1`,
      [`order_debit_${idempotencyKey}`],
    );
    if (txRes.rows.length > 0 && txRes.rows[0]?.ref_id) {
      const cartId = txRes.rows[0].ref_id;
      return this.findOrderByCartId(db, cartId);
    }
    return null;
  },

  async findOrderById(db, orderId, customerId = null) {
    const params: unknown[] = [orderId];
    let whereClause = `WHERE o.id = $1`;
    if (customerId) {
      params.push(customerId);
      whereClause += ` AND o.customer_id = $2`;
    }

    const res = await db.query<OrderRecord>(
      `SELECT o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
              o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
              o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
              o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
              (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
              o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt"
         FROM orders o
        ${whereClause}
        LIMIT 1`,
      params,
    );

    const order = res.rows[0];
    if (!order) return null;

    const itemsRes = await db.query<OrderItemRecord>(
      `SELECT oi.id, oi.order_id AS "orderId", oi.crop_id AS "productId",
              cm.name, oi.grade, oi.qty_kg::text AS "qtyKg",
              oi.unit_price::text AS "unitPrice", oi.line_total::text AS "lineTotal"
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC`,
      [order.id],
    );

    return { order, items: itemsRes.rows };
  },

  async listOrders(db, customerId, query) {
    const params: unknown[] = [customerId];
    let paramIndex = 2;
    let whereClause = `WHERE o.customer_id = $1`;

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND o.status = $${paramIndex++}`;
    }

    if (query.cursor) {
      params.push(query.cursor);
      whereClause += ` AND o.placed_at < $${paramIndex++}::timestamptz`;
    }

    const limit = query.limit ?? 20;
    params.push(limit + 1);
    const limitParam = paramIndex;

    const res = await db.query<OrderRecord>(
      `SELECT o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
              o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
              o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
              o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
              (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
              o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt"
         FROM orders o
        ${whereClause}
        ORDER BY o.placed_at DESC
        LIMIT $${limitParam}`,
      params,
    );

    const hasMore = res.rows.length > limit;
    const orders = res.rows.slice(0, limit);
    const nextCursor = hasMore && orders.length > 0
      ? orders[orders.length - 1]!.placedAt.toISOString()
      : null;

    return { orders, nextCursor, hasMore };
  },

  async checkAndBookDeliverySlot(db, warehouseId, slotDate, slot) {
    const res = await db.query<{ id: string; capacity_orders: number; booked_orders: number }>(
      `SELECT id, capacity_orders, booked_orders
         FROM delivery_slots
        WHERE warehouse_id = $1 AND slot_date = $2 AND slot = $3
        FOR UPDATE`,
      [warehouseId, slotDate, slot],
    );

    if (res.rows.length > 0) {
      const slotRow = res.rows[0]!;
      if (slotRow.booked_orders >= slotRow.capacity_orders) {
        throw new Error('SLOT_CAPACITY_EXCEEDED');
      }
      await db.query(
        `UPDATE delivery_slots
            SET booked_orders = booked_orders + 1, updated_at = now()
          WHERE id = $1`,
        [slotRow.id],
      );
    }
  },

  async createOrder(db, params) {
    const otpHash = createHash('sha256')
      .update(params.deliveryOtpPlaintext)
      .digest('hex');

    const dbFulfillmentType =
      params.fulfillmentType === 'HOME_DELIVERY' || params.fulfillmentType === 'DELIVERY'
        ? 'DELIVERY'
        : 'PICKUP';

    const orderRes = await db.query<OrderRecord>(
      `INSERT INTO orders (
         order_number, customer_id, warehouse_id, cart_id, channel,
         fulfilment_type, delivery_address_id, delivery_date, delivery_slot,
         subtotal, delivery_fee, discount, gst_amount, total_amount,
         payment_method, payment_status, status, delivery_otp_hash, placed_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10::numeric, $11::numeric, $12::numeric, $13::numeric, $14::numeric,
         $15, 'PAID', 'CONFIRMED', $16, now()
       )
       RETURNING id, order_number AS "orderNumber", customer_id AS "customerId",
                 warehouse_id AS "warehouseId", cart_id AS "cartId", channel,
                 fulfilment_type AS "fulfillmentType", delivery_address_id AS "deliveryAddressId",
                 delivery_slot AS "deliverySlot", delivery_date::text AS "deliveryDate",
                 subtotal::text AS subtotal, delivery_fee::text AS "deliveryFee",
                 discount::text AS discount, gst_amount::text AS "gstAmount",
                 total_amount::text AS "totalAmount", payment_method AS "paymentMethod",
                 payment_status AS "paymentStatus", status, delivery_otp_hash AS "deliveryOtpHash",
                 $17::int AS "itemCount", placed_at AS "placedAt",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        params.orderNumber,
        params.customerId,
        params.warehouseId,
        params.cartId,
        params.channel,
        dbFulfillmentType,
        params.deliveryAddressId ?? null,
        params.deliveryDate ?? null,
        params.deliverySlot ?? null,
        params.subtotal,
        params.deliveryFee,
        params.discount,
        params.gstAmount,
        params.totalAmount,
        params.paymentMethod,
        otpHash,
        params.items.length,
      ],
    );
    const order = orderRes.rows[0]!;

    const insertedItems: OrderItemRecord[] = [];
    for (const item of params.items) {
      const itemRes = await db.query<OrderItemRecord>(
        `INSERT INTO order_items (
           order_id, crop_id, grade, qty_kg, unit_price, gst_rate, gst_amount, line_total
         )
         VALUES ($1, $2, $3, $4::numeric, $5::numeric, 0, 0, $6::numeric)
         RETURNING id, order_id AS "orderId", crop_id AS "productId",
                   $7::text AS "name", grade, qty_kg::text AS "qtyKg",
                   unit_price::text AS "unitPrice", line_total::text AS "lineTotal"`,
        [
          order.id,
          item.productId,
          item.grade,
          item.qtyKg,
          item.unitPrice,
          item.lineTotal,
          item.name,
        ],
      );
      insertedItems.push(itemRes.rows[0]!);
    }

    // Record status history
    await db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, NULL, 'CONFIRMED', $2, 'Order placed via wallet checkout')`,
      [order.id, params.actorUserId],
    );

    // Mark cart and cart_items as CONVERTED
    await db.query(
      `UPDATE cart_items SET status = 'CONVERTED', updated_at = now() WHERE cart_id = $1 AND status = 'HELD'`,
      [params.cartId],
    );
    await db.query(
      `UPDATE carts SET status = 'CONVERTED', updated_at = now() WHERE id = $1`,
      [params.cartId],
    );

    return { order, items: insertedItems };
  },

  async convertAllocationsAndAppendStockLedger(
    db,
    items,
    orderId,
    warehouseId,
    actorUserId,
  ) {
    for (const item of items) {
      if (item.allocationId) {
        await db.query(
          `UPDATE allocations
              SET reserved_qty = GREATEST(0, reserved_qty - $1::numeric),
                  consumed_qty = consumed_qty + $1::numeric,
                  updated_at = now()
            WHERE id = $2`,
          [item.qtyKg, item.allocationId],
        );
      }

      if (item.batchId) {
        await db.query(
          `INSERT INTO stock_ledger (
             batch_id, warehouse_id, movement_type, qty_delta, balance_after,
             ref_type, ref_id, remarks, created_by
           )
           VALUES ($1, $2, 'SALE', -$3::numeric, 0, 'ORDER', $4, 'Customer order checkout', $5)`,
          [
            item.batchId,
            warehouseId,
            item.qtyKg,
            orderId,
            actorUserId,
          ],
        );
      }
    }
  },
};
