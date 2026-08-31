import { fromPaise, parseMoney, toPaise, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { config } from '../../config.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { paymentGateway, type PaymentGateway } from '../../payments/index.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import {
  topupRepo,
  type TopupRepo,
  type TopupWithPayment,
} from './topup.repo.js';
import type {
  CreateTopupInput,
  TopupIntentResponse,
  WebhookResponse,
} from './topup.schema.js';

export interface TopupService {
  createTopup(
    actor: Actor,
    scope: ResolvedScope,
    input: CreateTopupInput,
    idempotencyKey?: string,
  ): Promise<TopupIntentResponse>;

  processRazorpayWebhook(
    rawBody: Buffer | string,
    signature: string | undefined,
    eventId: string | undefined,
  ): Promise<WebhookResponse>;

  reconcilePendingTopups(olderThanMinutes?: number): Promise<{ reconciledCount: number }>;
}

const systemScope: ResolvedScope = {
  level: ScopeLevel.ALL,
  permission: 'wallet.topup.digital',
  roleCode: RoleCode.SUPER_ADMIN,
  warehouseIds: [],
  zoneIds: [],
  userId: '00000000-0000-0000-0000-000000000000',
};

export function createTopupService(opts: {
  repo?: TopupRepo;
  gateway?: PaymentGateway;
  walletSvc?: WalletService;
  db?: Executor;
} = {}): TopupService {
  const repo = opts.repo ?? topupRepo;
  const gateway = opts.gateway ?? paymentGateway;
  const walletSvc = opts.walletSvc ?? walletService;
  const db = opts.db ?? pool;

  return {
    async createTopup(actor, _scope, input, idempotencyKey) {
      if (!actor.customerId && !actor.roles.some((r) => r.code === RoleCode.CUSTOMER)) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Only customer accounts can initiate digital top-ups.',
        });
      }

      const wallet = await walletSvc.getWalletForActor(actor);
      const amountPaise = toPaise(input.amount);
      if (amountPaise <= 0) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Top-up amount must be positive.',
        });
      }

      const receipt = `topup_${wallet.id.slice(0, 8)}_${Date.now()}`;
      const gatewayOrder = await gateway.createOrder({
        amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          walletId: wallet.id,
          customerId: actor.customerId ?? '',
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
      });

      const { topup } = await repo.createTopupIntent(db, {
        walletId: wallet.id,
        customerId: actor.customerId,
        channel: input.mode,
        amount: input.amount,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
      });

      const presetAmounts = await repo.getPresetAmounts(db);

      const razorpayKeyId =
        gateway.provider === 'razorpay'
          ? config.RAZORPAY_KEY_ID
          : 'rzp_test_mock_publishable_key';

      return {
        topupId: topup.id,
        gateway: 'RAZORPAY',
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        amount: input.amount,
        currency: 'INR',
        status: 'PENDING',
        razorpayKeyId,
        presetAmounts,
      };
    },

    async processRazorpayWebhook(rawBody, signature, _eventId) {
      if (!signature) {
        throw new AppError('UNAUTHENTICATED', {
          status: 401,
          detail: 'Missing X-Razorpay-Signature header.',
        });
      }

      const secret = config.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
      const isValid = gateway.verifyWebhookSignature(rawBody, signature, secret);

      if (!isValid) {
        throw new AppError('UNAUTHENTICATED', {
          status: 401,
          detail: 'Invalid or forged webhook signature.',
        });
      }

      const event = gateway.parseEvent(rawBody);

      if (event.event === 'payment.captured' && event.payment) {
        const payment = event.payment;
        const gatewayOrderId = payment.orderId;

        if (!gatewayOrderId) {
          return { received: true };
        }

        let topup: TopupWithPayment | null = null;
        if (gatewayOrderId) {
          topup = await repo.findTopupByGatewayOrderId(db, gatewayOrderId);
        }

        if (!topup) {
          return { received: true };
        }

        // Duplicate delivery check: already succeeded or payment captured
        if (topup.status === 'SUCCESS' || topup.gateway_payment_id === payment.paymentId) {
          return { received: true, duplicate: true };
        }

        const creditAmount = parseMoney(fromPaise(payment.amountPaise));
        const idempotencyKey = `rzp_pay_${payment.paymentId}`;

        await withTransaction(async (tx) => {
          // Double check within transaction
          const existingPayment = await repo.findPaymentByGatewayPaymentId(tx, payment.paymentId);
          if (existingPayment && existingPayment.status === 'CAPTURED') {
            return;
          }

          // Credit wallet
          const walletTxn = await walletSvc.move(
            systemScope,
            {
              walletId: topup!.wallet_id,
              direction: 'CREDIT',
              type: 'TOPUP_DIGITAL',
              amount: creditAmount,
              refType: 'TOPUP',
              refId: topup!.id,
              idempotencyKey,
              remarks: `Digital Top-up via Razorpay ${payment.paymentId}`,
              createdBy: null,
            },
            tx,
          );

          await repo.markTopupSuccess(tx, {
            topupId: topup!.id,
            paymentId: topup!.payment_id!,
            gatewayPaymentId: payment.paymentId,
            walletTxnId: walletTxn.id,
            capturedAt: new Date(event.createdAt * 1000),
            rawPayload: event.rawPayload,
          });

          await writeAuditLog(tx, {
            actorId: null,
            actorType: 'SYSTEM',
            actorRole: 'SYSTEM_BOT',
            actionCode: 'wallet.topup.digital',
            entityType: 'topup',
            entityId: topup!.id,
            after: {
              status: 'SUCCESS',
              gatewayPaymentId: payment.paymentId,
              amount: creditAmount,
            },
            changedFields: ['status', 'gateway_payment_id', 'wallet_txn_id'],
          });
        });

        return { received: true, duplicate: false };
      }

      if (event.event === 'payment.failed' && event.payment?.orderId) {
        const topup = await repo.findTopupByGatewayOrderId(db, event.payment.orderId);
        if (topup && topup.status === 'PENDING') {
          await repo.markTopupFailed(db, {
            topupId: topup.id,
            paymentId: topup.payment_id!,
            rawPayload: event.rawPayload,
          });
        }
        return { received: true };
      }

      return { received: true };
    },

    async reconcilePendingTopups(olderThanMinutes = 15) {
      const pendingTopups = await repo.findPendingTopupsOlderThan(db, olderThanMinutes);
      let reconciledCount = 0;

      for (const topup of pendingTopups) {
        if (!topup.gateway_order_id) continue;

        // If gateway supports fetchPayment and payment is captured
        if (gateway.fetchPayment && topup.gateway_payment_id) {
          const payment = await gateway.fetchPayment(topup.gateway_payment_id);
          if (payment && payment.status === 'captured') {
            const creditAmount = parseMoney(fromPaise(payment.amountPaise));
            const idempotencyKey = `rzp_pay_${payment.paymentId}`;

            await withTransaction(async (tx) => {
              const walletTxn = await walletSvc.move(
                systemScope,
                {
                  walletId: topup.wallet_id,
                  direction: 'CREDIT',
                  type: 'TOPUP_DIGITAL',
                  amount: creditAmount,
                  refType: 'TOPUP',
                  refId: topup.id,
                  idempotencyKey,
                  remarks: `Reconciled Top-up ${payment.paymentId}`,
                  createdBy: null,
                },
                tx,
              );

              await repo.markTopupSuccess(tx, {
                topupId: topup.id,
                paymentId: topup.payment_id!,
                gatewayPaymentId: payment.paymentId,
                walletTxnId: walletTxn.id,
              });
            });
            reconciledCount++;
          }
        }
      }

      return { reconciledCount };
    },
  };
}

export const topupService = createTopupService();
