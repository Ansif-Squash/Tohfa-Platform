import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { isMoney, greaterThan, ZERO, parseMoney, type Money } from '@tohfa/shared-types';
import {
  walletRepo,
  toWalletResponse,
  toWalletTransactionResponse,
  type WalletRepo,
} from './wallet.repo.js';
import type {
  ListMyTransactionsQuery,
  ListTransactionsResponse,
  WalletResponse,
  WalletTransactionResponse,
  WalletTxnType,
} from './wallet.schema.js';

export interface WalletMoveInput {
  walletId?: string;
  customerId?: string;
  farmerId?: string;
  idempotencyKey: string;
  direction: 'CREDIT' | 'DEBIT';
  type: WalletTxnType;
  amount: Money;
  refType?: string | null;
  refId?: string | null;
  remarks?: string | null;
  createdBy?: string | null;
}

export interface WalletServiceDeps {
  repo: WalletRepo;
  db: Executor;
  runTx: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
}

export interface WalletService {
  getWalletForActor(actor: Actor): Promise<WalletResponse>;
  listTransactionsForActor(
    actor: Actor,
    query: ListMyTransactionsQuery,
  ): Promise<ListTransactionsResponse>;
  move(
    scope: ResolvedScope,
    input: WalletMoveInput,
    tx?: Executor,
  ): Promise<WalletTransactionResponse>;
}

export function createWalletService(
  deps: Partial<WalletServiceDeps> = {},
): WalletService {
  const repo = deps.repo ?? walletRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? (deps.db ? <T>(fn: (executor: Executor) => Promise<T>) => fn(deps.db!) : withTransaction);

  return {
    async getWalletForActor(actor): Promise<WalletResponse> {
      let ownerType: 'CUSTOMER' | 'FARMER';
      let ownerId: string;

      if (actor.customerId) {
        ownerType = 'CUSTOMER';
        ownerId = actor.customerId;
      } else if (actor.farmerId) {
        ownerType = 'FARMER';
        ownerId = actor.farmerId;
      } else {
        throw new AppError('FORBIDDEN', {
          detail: 'Only customer or farmer accounts have wallets.',
        });
      }

      return await runTx(async (tx) => {
        const wallet = await repo.findWalletByOwner(tx, ownerType, ownerId);
        if (wallet) {
          return toWalletResponse(wallet);
        }
        const newWallet = await repo.createWallet(tx, ownerType, ownerId);
        return toWalletResponse(newWallet);
      });
    },

    async listTransactionsForActor(actor, query): Promise<ListTransactionsResponse> {
      const wallet = await this.getWalletForActor(actor);
      const res = await repo.listTransactions(db, wallet.id, query);
      return {
        items: res.items,
        page: {
          nextCursor: res.nextCursor,
          hasMore: res.hasMore,
        },
      };
    },

    async move(scope, input, tx): Promise<WalletTransactionResponse> {
      // 1. Amount validation
      if (!isMoney(input.amount) || !greaterThan(input.amount, ZERO)) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'Transaction amount must be a positive money string.',
        });
      }

      return await runTx(async (innerTx) => {
        // Use active transactional executor
        const activeTx = tx ?? innerTx;

        // 2. Resolve target wallet ID
        let walletId = input.walletId;
        if (!walletId) {
          let ownerType: 'CUSTOMER' | 'FARMER';
          let ownerId: string;

          if (input.customerId) {
            ownerType = 'CUSTOMER';
            ownerId = input.customerId;
          } else if (input.farmerId) {
            ownerType = 'FARMER';
            ownerId = input.farmerId;
          } else {
            throw new AppError('VALIDATION_FAILED', {
              detail: 'Must provide either walletId, customerId, or farmerId.',
            });
          }

          const wallet = await repo.findWalletByOwner(activeTx, ownerType, ownerId);
          if (!wallet) {
            const newWallet = await repo.createWallet(activeTx, ownerType, ownerId);
            walletId = newWallet.id;
          } else {
            walletId = wallet.id;
          }
        }

        try {
          const row = await repo.insertTransaction(activeTx, {
            walletId,
            idempotencyKey: input.idempotencyKey,
            direction: input.direction,
            type: input.type,
            amount: input.amount,
            refType: input.refType ?? null,
            refId: input.refId ?? null,
            remarks: input.remarks ?? null,
            createdBy: input.createdBy !== undefined ? input.createdBy : (scope.userId === '00000000-0000-0000-0000-000000000000' ? null : (scope.userId ?? null)),
          });
          return toWalletTransactionResponse(row);
        } catch (err: any) {
          // A. Unique constraint violation on idempotency_key
          if (err.code === '23505') {
            try {
              await activeTx.query('ROLLBACK');
            } catch {
              // Rollback may fail if connection was already closed/aborted
            }
            const existing = await repo.findTransactionByIdempotencyKey(activeTx, input.idempotencyKey);
            if (existing) {
              const matchesAmount = parseMoney(existing.amount) === parseMoney(input.amount);
              const matchesWallet = existing.wallet_id === walletId;

              if (!matchesAmount || !matchesWallet) {
                throw new AppError('IDEMPOTENCY_KEY_REUSED', {
                  status: 409,
                  detail: 'Idempotency key was reused with a different wallet or amount.',
                  cause: err,
                });
              }
              return toWalletTransactionResponse(existing);
            }
          }

          // B. Trigger check constraints (insufficient balance or frozen status)
          if (err.code === '23514') {
            if (err.hint === 'code: WALLET_INSUFFICIENT' || err.message?.includes('insufficient wallet balance')) {
              throw new AppError('WALLET_INSUFFICIENT', {
                status: 402,
                detail: 'Insufficient wallet balance.',
                cause: err,
              });
            }
            if (err.hint === 'code: WALLET_NOT_ACTIVE' || err.message?.includes('no movement permitted')) {
              throw new AppError('FORBIDDEN', {
                detail: 'Wallet is not active.',
                cause: err,
              });
            }
          }

          throw err;
        }
      });
    },
  };
}

export const walletService: WalletService = createWalletService();
