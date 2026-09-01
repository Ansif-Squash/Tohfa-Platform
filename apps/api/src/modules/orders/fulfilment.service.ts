import { createHash, timingSafeEqual } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { Response, Request } from 'express';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import {
  fulfilmentRepo,
  type FulfilmentRepo,
} from './fulfilment.repo.js';
import type {
  AdminOrdersQuery,
  AdminOrderSummary,
  AdminOrderDetail,
  AssignWarehouseRequest,
  PackOrderRequest,
  DispatchOrderRequest,
  VerifyOtpRequest,
  OrderTracking,
  OrderTrackingEvent,
} from './fulfilment.schema.js';
import type { OrderStatus } from './orders.schema.js';

export const orderEventsEmitter = new EventEmitter();

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'READY_FOR_PICKUP', 'CANCELLED'],
  PACKED: ['READY_FOR_PICKUP', 'DISPATCHED', 'PICKED_UP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  PICKED_UP: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
  COMPLETED: [],
};

export interface FulfilmentService {
  listAdminOrders(
    actor: Actor,
    scope: ResolvedScope,
    query: AdminOrdersQuery,
  ): Promise<{ items: AdminOrderSummary[]; page: { nextCursor: string | null; hasMore: boolean } }>;

  getAdminOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
  ): Promise<AdminOrderDetail>;

  assignWarehouse(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: AssignWarehouseRequest,
  ): Promise<AdminOrderDetail>;

  packOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: PackOrderRequest,
  ): Promise<AdminOrderDetail>;

  dispatchOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: DispatchOrderRequest,
  ): Promise<AdminOrderDetail>;

  verifyOtp(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: VerifyOtpRequest,
  ): Promise<AdminOrderDetail>;

  getOrderTracking(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
  ): Promise<OrderTracking>;

  streamOrderEvents(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    req: Request,
    res: Response,
  ): Promise<void>;
}

export function createFulfilmentService(opts: {
  repo?: FulfilmentRepo;
  db?: Executor;
  emitter?: EventEmitter;
} = {}): FulfilmentService {
  const repo = opts.repo ?? fulfilmentRepo;
  const db = opts.db ?? pool;
  const emitter = opts.emitter ?? orderEventsEmitter;

  function validateTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new AppError('INVALID_STATE_TRANSITION', {
        status: 409,
        detail: `Cannot transition order from status ${from} to ${to}.`,
      });
    }
  }

  function getWarehouseScope(actor: Actor): string | null {
    // If actor has a SUB_WH_ADMIN role or specific assigned warehouse in claims/actor
    const hasOnlySubWh =
      actor.roles.some((r) => r.code === 'SUB_WH_ADMIN') &&
      !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN' || r.code === 'MAIN_WH_ADMIN');

    if (hasOnlySubWh) {
      // Find assigned warehouse from actor roles
      const subWhRole = actor.roles.find((r) => r.code === 'SUB_WH_ADMIN');
      return subWhRole?.warehouseId ?? (actor as any).warehouseId ?? null;
    }
    return null;
  }

  return {
    async listAdminOrders(actor, scope, query) {
      const warehouseScope = getWarehouseScope(actor);
      if (warehouseScope && query.warehouseId && query.warehouseId !== warehouseScope) {
        throw new AppError('WAREHOUSE_SCOPE_VIOLATION', {
          status: 403,
          detail: 'You may not query orders outside your assigned warehouse.',
        });
      }

      const { items, nextCursor, hasMore } = await repo.listAdminOrders(
        db,
        warehouseScope,
        query,
      );

      return { items, page: { nextCursor, hasMore } };
    },

    async getAdminOrder(actor, scope, orderId) {
      const warehouseScope = getWarehouseScope(actor);
      const order = await repo.findOrderForFulfilment(db, orderId, warehouseScope);
      if (!order) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }
      return order;
    },

    async assignWarehouse(actor, scope, orderId, input) {
      const warehouseScope = getWarehouseScope(actor);
      if (warehouseScope) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Sub Warehouse Admins cannot reassign orders.',
        });
      }

      const order = await repo.findOrderForFulfilment(db, orderId);
      if (!order) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      if (order.status !== 'CONFIRMED' && order.status !== 'PENDING_PAYMENT') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 409,
          detail: `Cannot reassign warehouse for order in status ${order.status}.`,
        });
      }

      await withTransaction(async (tx) => {
        await repo.updateOrderStatus(tx, {
          orderId,
          fromStatus: order.status,
          toStatus: order.status,
          actorUserId: actor.userId,
          warehouseId: input.warehouseId,
          note: `Reassigned to warehouse: ${input.warehouseId}${input.reason ? ` - ${input.reason}` : ''}`,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.warehouse.assign',
          entityType: 'orders',
          entityId: orderId,
          after: { newWarehouseId: input.warehouseId, reason: input.reason },
        });
      });

      const updated = await repo.findOrderForFulfilment(db, orderId);
      return updated!;
    },

    async packOrder(actor, scope, orderId, _input) {
      const warehouseScope = getWarehouseScope(actor);
      const order = await repo.findOrderForFulfilment(db, orderId, warehouseScope);
      if (!order) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      validateTransition(order.status, 'PACKED');

      await withTransaction(async (tx) => {
        await repo.updateOrderStatus(tx, {
          orderId,
          fromStatus: order.status,
          toStatus: 'PACKED',
          actorUserId: actor.userId,
          packedAt: new Date(),
          note: `Packed at warehouse ${order.warehouseId}`,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.mark_packed',
          entityType: 'orders',
          entityId: orderId,
          after: { previousStatus: order.status, newStatus: 'PACKED' },
        });
      });

      const eventPayload: OrderTrackingEvent = {
        status: 'PACKED',
        at: new Date().toISOString(),
        note: `Packed at warehouse ${order.warehouseId}`,
      };
      emitter.emit(`order:${orderId}`, eventPayload);

      const updated = await repo.findOrderForFulfilment(db, orderId);
      return updated!;
    },

    async dispatchOrder(actor, scope, orderId, input) {
      const warehouseScope = getWarehouseScope(actor);
      const order = await repo.findOrderForFulfilment(db, orderId, warehouseScope);
      if (!order) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      const targetStatus: OrderStatus =
        order.fulfillmentType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'DISPATCHED';

      validateTransition(order.status, targetStatus);

      const note = input.vehicleNumber
        ? `Dispatched via vehicle ${input.vehicleNumber}`
        : order.fulfillmentType === 'PICKUP'
          ? 'Ready for customer pickup'
          : 'Dispatched for delivery';

      await withTransaction(async (tx) => {
        await repo.updateOrderStatus(tx, {
          orderId,
          fromStatus: order.status,
          toStatus: targetStatus,
          actorUserId: actor.userId,
          note,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.dispatch',
          entityType: 'orders',
          entityId: orderId,
          after: {
            previousStatus: order.status,
            newStatus: targetStatus,
            vehicleNumber: input.vehicleNumber,
            deliveryPartnerId: input.deliveryPartnerId,
          },
        });
      });

      const eventPayload: OrderTrackingEvent = {
        status: targetStatus,
        at: new Date().toISOString(),
        note,
      };
      emitter.emit(`order:${orderId}`, eventPayload);

      const updated = await repo.findOrderForFulfilment(db, orderId);
      return updated!;
    },

    async verifyOtp(actor, scope, orderId, input) {
      const otpHolder = await repo.getOrderDeliveryOtpHolder(db, orderId);
      if (!otpHolder) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      const warehouseScope = getWarehouseScope(actor);
      if (warehouseScope && otpHolder.warehouseId !== warehouseScope) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      const maxAttempts = await repo.getMaxOtpAttempts(db);
      if (otpHolder.otpAttempts >= maxAttempts) {
        throw new AppError('OTP_LOCKED', {
          status: 429,
          detail: 'Maximum OTP verification attempts exceeded. OTP is locked.',
        });
      }

      if (!otpHolder.deliveryOtpHash) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 409,
          detail: 'Order has no delivery OTP configured.',
        });
      }

      // Hash input OTP and compare in constant time
      const inputHash = createHash('sha256').update(input.otp).digest('hex');
      const bufA = Buffer.from(inputHash, 'utf8');
      const bufB = Buffer.from(otpHolder.deliveryOtpHash, 'utf8');
      const isMatch = bufA.length === bufB.length && timingSafeEqual(bufA, bufB);

      if (!isMatch) {
        const attempts = await repo.incrementOtpAttempts(db, orderId);
        const remaining = Math.max(0, maxAttempts - attempts);
        throw new AppError('OTP_INVALID', {
          status: 422,
          detail: `${remaining} attempts remaining before this OTP is locked.`,
          meta: { remainingAttempts: remaining },
        });
      }

      const targetStatus: OrderStatus =
        otpHolder.fulfilmentType === 'PICKUP' ? 'PICKED_UP' : 'DELIVERED';

      validateTransition(otpHolder.status, targetStatus);

      await withTransaction(async (tx) => {
        await repo.updateOrderStatus(tx, {
          orderId,
          fromStatus: otpHolder.status,
          toStatus: targetStatus,
          actorUserId: actor.userId,
          completedAt: new Date(),
          otpVerifiedAt: new Date(),
          otpVerifiedBy: actor.userId,
          note: 'Handover verified via OTP',
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.pickup_otp.verify',
          entityType: 'orders',
          entityId: orderId,
          after: {
            previousStatus: otpHolder.status,
            newStatus: targetStatus,
          },
        });
      });

      const eventPayload: OrderTrackingEvent = {
        status: targetStatus,
        at: new Date().toISOString(),
        note: 'Handover verified via OTP',
      };
      emitter.emit(`order:${orderId}`, eventPayload);

      const updated = await repo.findOrderForFulfilment(db, orderId);
      return updated!;
    },

    async getOrderTracking(actor, scope, orderId) {
      const customerScope = actor.customerId ?? null;
      const tracking = await repo.getOrderTracking(db, orderId, customerScope);
      if (!tracking) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order tracking for ${orderId} not found.`,
        });
      }
      return tracking;
    },

    async streamOrderEvents(actor, scope, orderId, req, res) {
      const customerScope = actor.customerId ?? null;
      const tracking = await repo.getOrderTracking(db, orderId, customerScope);
      if (!tracking) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Send initial tracking status frame
      const initialEvent: OrderTrackingEvent = {
        status: tracking.status,
        at: new Date().toISOString(),
        note: 'Connected to order event stream',
      };
      res.write(`event: order.status\ndata: ${JSON.stringify(initialEvent)}\n\n`);

      // Heartbeat keepalive every 20 seconds
      const heartbeatInterval = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 20000);

      // Event listener
      const onStatusChange = (event: OrderTrackingEvent) => {
        res.write(`event: order.status\ndata: ${JSON.stringify(event)}\n\n`);
        if (
          event.status === 'DELIVERED' ||
          event.status === 'PICKED_UP' ||
          event.status === 'CANCELLED'
        ) {
          cleanup();
          res.end();
        }
      };

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        emitter.removeListener(`order:${orderId}`, onStatusChange);
      };

      emitter.on(`order:${orderId}`, onStatusChange);
      req.on('close', cleanup);
    },
  };
}

export const fulfilmentService = createFulfilmentService();
