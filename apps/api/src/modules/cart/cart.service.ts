import { randomUUID } from 'node:crypto';
import type { Money } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  cartRepo,
  type CartRepo,
  type CartRecord,
  type CartItemRecord,
} from './cart.repo.js';
import type {
  CartItemCreateInput,
  CartItemResponse,
  CartReplaceInput,
  CartResponse,
  ProduceGrade,
} from './cart.schema.js';

export interface CartService {
  getCart(actor: Actor, scope: ResolvedScope): Promise<CartResponse>;

  addItem(
    actor: Actor,
    scope: ResolvedScope,
    input: CartItemCreateInput,
  ): Promise<CartResponse>;

  replaceCart(
    actor: Actor,
    scope: ResolvedScope,
    input: CartReplaceInput,
  ): Promise<CartResponse>;

  clearCart(actor: Actor, scope: ResolvedScope): Promise<void>;
}

function mapCartResponse(
  cart: CartRecord,
  items: CartItemRecord[],
): CartResponse {
  const mappedItems: CartItemResponse[] = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    grade: item.grade,
    qtyKg: item.qtyKg,
    unitPrice: item.unitPrice as Money,
    lineTotal: item.lineTotal as Money,
    certificationBadges: [],
  }));

  return {
    id: cart.id,
    warehouseId: cart.warehouse_id,
    status: cart.status,
    items: mappedItems,
    subtotal: cart.subtotal as Money,
    lockedAt: cart.locked_at ? cart.locked_at.toISOString() : null,
    lockExpiresAt: cart.locked_until ? cart.locked_until.toISOString() : null,
  };
}

export function createCartService(opts: {
  repo?: CartRepo;
  db?: Executor;
} = {}): CartService {
  const repo = opts.repo ?? cartRepo;
  const db = opts.db ?? pool;

  return {
    async getCart(actor, _scope) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      const cart = await repo.findActiveCart(db, actor.customerId);
      if (!cart) {
        return {
          id: randomUUID(),
          warehouseId: null,
          status: 'ACTIVE',
          items: [],
          subtotal: '0.00' as Money,
          lockedAt: null,
          lockExpiresAt: null,
        };
      }

      const items = await repo.getCartItems(db, cart.id);
      return mapCartResponse(cart, items);
    },

    async addItem(actor, _scope, input) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      const qty = Number(input.qtyKg);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Quantity must be greater than 0.',
        });
      }

      const grade: ProduceGrade = input.grade ?? 'GRADE_1';

      return await withTransaction(async (tx) => {
        let cart = await repo.findActiveCart(tx, actor.customerId!);
        if (!cart) {
          cart = await repo.createActiveCart(tx, actor.customerId!);
        }

        const priceInfo = await repo.findActiveRetailPrice(tx, input.productId, grade);
        if (!priceInfo) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: 'Product or retail price not found for the specified grade.',
          });
        }

        const targetWarehouseId = input.warehouseId ?? cart.warehouse_id;

        const allocation = await repo.findAndLockOnlineAllocation(tx, {
          cropId: input.productId,
          grade,
          warehouseId: targetWarehouseId,
          requiredQty: input.qtyKg,
        });

        if (!allocation) {
          const breakdown = await repo.getAvailableStockBreakdown(tx, {
            cropId: input.productId,
            grade,
            warehouseId: targetWarehouseId,
          });

          if (Number(breakdown.totalAvailable) === 0) {
            throw new AppError('STOCK_UNAVAILABLE', {
              status: 409,
              detail: `Only ${breakdown.onlineAvailable} kg of ${priceInfo.cropName} ${grade} remains today.`,
            });
          }

          if (Number(breakdown.onlineAvailable) < qty) {
            throw new AppError('INSUFFICIENT_ALLOCATION', {
              status: 409,
              detail: `Requested ${input.qtyKg} kg exceeds remaining online allocation of ${breakdown.onlineAvailable} kg (BR-12c).`,
            });
          }

          throw new AppError('STOCK_UNAVAILABLE', {
            status: 409,
            detail: 'Requested quantity is unavailable.',
          });
        }

        try {
          await repo.reserveAllocation(tx, allocation.id, input.qtyKg);
        } catch (err: any) {
          if (err.code === '23514') {
            throw new AppError('STOCK_UNAVAILABLE', {
              status: 409,
              detail: 'Allocation oversold constraint reached.',
            });
          }
          throw err;
        }

        const lockHours = await repo.getCartLockHours(tx);
        const lineTotal = (qty * Number(priceInfo.price)).toFixed(2);
        const reservedUntil = new Date(Date.now() + lockHours * 3600 * 1000);

        await repo.upsertCartItem(tx, {
          cartId: cart.id,
          cropId: input.productId,
          grade,
          qtyKg: input.qtyKg,
          unitPrice: priceInfo.price,
          lineTotal,
          allocationId: allocation.id,
          reservedUntil,
        });

        const updatedCart = await repo.updateCartLockAndSubtotal(
          tx,
          cart.id,
          allocation.warehouse_id,
          lockHours,
        );

        const items = await repo.getCartItems(tx, cart.id);
        return mapCartResponse(updatedCart, items);
      });
    },

    async replaceCart(actor, _scope, input) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      return await withTransaction(async (tx) => {
        let cart = await repo.findActiveCart(tx, actor.customerId!);
        if (!cart) {
          cart = await repo.createActiveCart(tx, actor.customerId!, input.warehouseId ?? null);
        } else {
          await repo.clearCart(tx, cart.id);
        }

        const lockHours = await repo.getCartLockHours(tx);
        const targetWarehouseId = input.warehouseId ?? cart.warehouse_id;

        for (const itemInput of input.items) {
          const qty = Number(itemInput.qtyKg);
          if (isNaN(qty) || qty <= 0) {
            throw new AppError('VALIDATION_FAILED', {
              status: 422,
              detail: 'Quantity must be greater than 0.',
            });
          }

          const grade: ProduceGrade = itemInput.grade ?? 'GRADE_1';
          const priceInfo = await repo.findActiveRetailPrice(tx, itemInput.productId, grade);
          if (!priceInfo) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `Product or retail price not found for ${itemInput.productId}.`,
            });
          }

          const allocation = await repo.findAndLockOnlineAllocation(tx, {
            cropId: itemInput.productId,
            grade,
            warehouseId: targetWarehouseId,
            requiredQty: itemInput.qtyKg,
          });

          if (!allocation) {
            const breakdown = await repo.getAvailableStockBreakdown(tx, {
              cropId: itemInput.productId,
              grade,
              warehouseId: targetWarehouseId,
            });

            if (Number(breakdown.totalAvailable) === 0) {
              throw new AppError('STOCK_UNAVAILABLE', {
                status: 409,
                detail: `Only ${breakdown.onlineAvailable} kg of ${priceInfo.cropName} ${grade} remains today.`,
              });
            }

            if (Number(breakdown.onlineAvailable) < qty) {
              throw new AppError('INSUFFICIENT_ALLOCATION', {
                status: 409,
                detail: `Requested ${itemInput.qtyKg} kg exceeds remaining online allocation of ${breakdown.onlineAvailable} kg (BR-12c).`,
              });
            }

            throw new AppError('STOCK_UNAVAILABLE', {
              status: 409,
              detail: 'Requested quantity is unavailable.',
            });
          }

          await repo.reserveAllocation(tx, allocation.id, itemInput.qtyKg);

          const lineTotal = (qty * Number(priceInfo.price)).toFixed(2);
          const reservedUntil = new Date(Date.now() + lockHours * 3600 * 1000);

          await repo.upsertCartItem(tx, {
            cartId: cart.id,
            cropId: itemInput.productId,
            grade,
            qtyKg: itemInput.qtyKg,
            unitPrice: priceInfo.price,
            lineTotal,
            allocationId: allocation.id,
            reservedUntil,
          });
        }

        const updatedCart = await repo.updateCartLockAndSubtotal(
          tx,
          cart.id,
          targetWarehouseId,
          lockHours,
        );

        const items = await repo.getCartItems(tx, cart.id);
        return mapCartResponse(updatedCart, items);
      });
    },

    async clearCart(actor, _scope) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Cart is accessible only by customers.',
        });
      }

      await withTransaction(async (tx) => {
        const cart = await repo.findActiveCart(tx, actor.customerId!);
        if (cart) {
          await repo.clearCart(tx, cart.id);
        }
      });
    },
  };
}

export const cartService = createCartService();
