import type { Money } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import {
  ordersRepo,
  type OrdersRepo,
  type OrderRecord,
  type OrderItemRecord,
} from './orders.repo.js';
import type {
  CheckoutRequest,
  ListOrdersQuery,
  OrderResponse,
  OrderSummaryResponse,
} from './orders.schema.js';

export interface OrdersService {
  checkout(
    actor: Actor,
    scope: ResolvedScope,
    input: CheckoutRequest,
    idempotencyKey?: string,
  ): Promise<OrderResponse>;

  getOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
  ): Promise<OrderResponse>;

  listOrders(
    actor: Actor,
    scope: ResolvedScope,
    query: ListOrdersQuery,
  ): Promise<{ items: OrderSummaryResponse[]; page: { nextCursor: string | null; hasMore: boolean } }>;
}

function mapOrderResponse(
  order: OrderRecord,
  items: OrderItemRecord[],
): OrderResponse {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    channel: order.channel,
    fulfillmentType: order.fulfillmentType,
    warehouseId: order.warehouseId,
    itemCount: items.length,
    totalAmount: order.totalAmount as Money,
    paymentStatus: order.paymentStatus,
    deliveryDate: order.deliveryDate,
    placedAt: order.placedAt.toISOString(),
    subtotal: order.subtotal as Money,
    deliveryFee: order.deliveryFee as Money,
    discount: order.discount as Money,
    gstAmount: order.gstAmount as Money,
    deliveryAddressId: order.deliveryAddressId,
    deliverySlot: order.deliverySlot,
    items: items.map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.name,
      grade: it.grade,
      qtyKg: it.qtyKg,
      unitPrice: it.unitPrice as Money,
      lineTotal: it.lineTotal as Money,
    })),
  };
}

export function createOrdersService(opts: {
  repo?: OrdersRepo;
  walletSvc?: WalletService;
  db?: Executor;
} = {}): OrdersService {
  const repo = opts.repo ?? ordersRepo;
  const walletSvc = opts.walletSvc ?? walletService;
  const db = opts.db ?? pool;

  return {
    async checkout(actor, scope, input, idempotencyKey) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Orders can only be placed by customers.',
        });
      }

      if (input.paymentMethod === 'CASH') {
        throw new AppError('INTERNAL', {
          status: 501,
          detail: 'Cash on delivery is disabled in Track 1 (BR-17).',
        });
      }

      if (input.paymentMethod !== 'WALLET') {
        throw new AppError('INTERNAL', {
          status: 501,
          detail: 'Only WALLET payment method is supported in Track 1.',
        });
      }

      // Check idempotency replay before cart lookup
      if (idempotencyKey) {
        const existing = await repo.findOrderByCartOrIdempotencyKey(
          db,
          actor.customerId,
          idempotencyKey,
        );
        if (existing) {
          return mapOrderResponse(existing.order, existing.items);
        }
      }

      const cart = await repo.findCartForCheckout(db, actor.customerId);
      if (!cart || cart.items.length === 0) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: 'No active cart found for checkout.',
        });
      }

      if (
        cart.status !== 'LOCKED' ||
        !cart.lockedUntil ||
        new Date(cart.lockedUntil) <= new Date()
      ) {
        throw new AppError('CART_LOCK_EXPIRED', {
          status: 409,
          detail: 'Cart reservation lock has expired (BR-22). Please re-add items.',
        });
      }

      const deliveryConfig = await repo.getDeliveryConfig(db);

      if (input.fulfillmentType === 'HOME_DELIVERY') {
        if (!deliveryConfig.homeDeliveryEnabled) {
          throw new AppError('INTERNAL', {
            status: 501,
            detail: 'Home delivery is currently disabled.',
          });
        }
        if (!input.deliveryAddressId) {
          throw new AppError('VALIDATION_FAILED', {
            status: 422,
            detail: 'Delivery address is required for home delivery.',
          });
        }
        if (!input.deliveryDate || !input.deliverySlot) {
          throw new AppError('VALIDATION_FAILED', {
            status: 422,
            detail: 'Delivery date and slot are required for home delivery.',
          });
        }
      }

      // Calculate totals
      const subtotalNum = cart.items.reduce(
        (acc, it) => acc + Number(it.lineTotal),
        0,
      );
      const subtotal = subtotalNum.toFixed(2) as Money;

      let deliveryFee = '0.00' as Money;
      if (input.fulfillmentType === 'HOME_DELIVERY') {
        deliveryFee =
          subtotalNum >= Number(deliveryConfig.freeDeliveryThreshold)
            ? ('0.00' as Money)
            : deliveryConfig.deliveryFee;
      }

      const discount = '0.00' as Money;
      const gstAmount = '0.00' as Money;
      const totalAmountNum = subtotalNum + Number(deliveryFee) - Number(discount);
      const totalAmount = totalAmountNum.toFixed(2) as Money;

      // Check wallet balance
      const wallet = await walletSvc.getWalletForActor(actor);
      if (Number(wallet.balance) < totalAmountNum) {
        const shortfall = (totalAmountNum - Number(wallet.balance)).toFixed(2) as Money;
        throw new AppError('WALLET_INSUFFICIENT', {
          status: 402,
          detail: `Wallet balance INR ${wallet.balance} is insufficient for order total INR ${totalAmount}.`,
          meta: { shortfall },
        });
      }

      return await withTransaction(async (tx) => {
        if (
          input.fulfillmentType === 'HOME_DELIVERY' &&
          input.deliveryDate &&
          input.deliverySlot
        ) {
          try {
            await repo.checkAndBookDeliverySlot(
              tx,
              input.warehouseId,
              input.deliveryDate,
              input.deliverySlot,
            );
          } catch (err: any) {
            if (err.message === 'SLOT_CAPACITY_EXCEEDED') {
              throw new AppError('CONFLICT', {
                status: 409,
                detail: 'Selected delivery slot is fully booked.',
              });
            }
            throw err;
          }
        }

        const orderNumber = await repo.generateOrderNumber(tx);
        const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

        // Debit wallet via walletService
        await walletSvc.move(
          scope,
          {
            walletId: wallet.id,
            direction: 'DEBIT',
            type: 'ORDER_DEBIT',
            amount: totalAmount,
            refType: 'ORDER',
            refId: cart.id,
            idempotencyKey: idempotencyKey
              ? `order_debit_${idempotencyKey}`
              : `order_debit_cart_${cart.id}_${actor.userId}`,
            remarks: `Payment for order ${orderNumber}`,
            createdBy: actor.userId,
          },
          tx,
        );

        // Create order
        const { order, items } = await repo.createOrder(tx, {
          orderNumber,
          customerId: actor.customerId!,
          warehouseId: input.warehouseId,
          cartId: cart.id,
          channel: 'ONLINE',
          fulfillmentType: input.fulfillmentType,
          deliveryAddressId: input.deliveryAddressId,
          deliveryDate: input.deliveryDate,
          deliverySlot: input.deliverySlot,
          subtotal,
          deliveryFee,
          discount,
          gstAmount,
          totalAmount,
          paymentMethod: input.paymentMethod,
          deliveryOtpPlaintext: deliveryOtp,
          items: cart.items,
          actorUserId: actor.userId,
        });

        // Convert allocations & append stock ledger SALE rows
        await repo.convertAllocationsAndAppendStockLedger(
          tx,
          cart.items,
          order.id,
          input.warehouseId,
          actor.userId,
        );

        // Write audit log
        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'order.place',
          entityType: 'order',
          entityId: order.id,
          warehouseId: input.warehouseId,
          after: {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentStatus: order.paymentStatus,
          },
        });

        return mapOrderResponse(order, items);
      });
    },

    async getOrder(actor, _scope, orderId) {
      const customerId = actor.customerId ?? null;
      const res = await repo.findOrderById(db, orderId, customerId);

      if (!res) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: 'Order not found.',
        });
      }

      return mapOrderResponse(res.order, res.items);
    },

    async listOrders(actor, _scope, query) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Orders can only be listed by customers.',
        });
      }

      const { orders, nextCursor, hasMore } = await repo.listOrders(
        db,
        actor.customerId,
        query,
      );

      const items: OrderSummaryResponse[] = orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        channel: o.channel,
        fulfillmentType: o.fulfillmentType,
        warehouseId: o.warehouseId,
        itemCount: o.itemCount,
        totalAmount: o.totalAmount as Money,
        paymentStatus: o.paymentStatus,
        deliveryDate: o.deliveryDate,
        placedAt: o.placedAt.toISOString(),
      }));

      return {
        items,
        page: {
          nextCursor,
          hasMore,
        },
      };
    },
  };
}

export const ordersService = createOrdersService();
