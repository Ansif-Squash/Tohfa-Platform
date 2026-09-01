import type { Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { TopupMode } from './topup.schema.js';

export interface PaymentRecord {
  id: string;
  gateway: string;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  gateway_signature: string | null;
  amount: string;
  currency: string;
  method: string | null;
  status: string;
  ref_type: string | null;
  ref_id: string | null;
  raw_payload: Record<string, unknown> | null;
  captured_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface TopupRecord {
  id: string;
  wallet_id: string;
  customer_id: string | null;
  channel: TopupMode;
  amount: string;
  fiscal_cash_tag: string | null;
  warehouse_id: string | null;
  processed_by: string | null;
  payment_id: string | null;
  wallet_txn_id: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  sms_sent_at: Date | null;
  sms_error: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface TopupWithPayment extends TopupRecord {
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
}

export interface TopupRepo {
  createTopupIntent(
    db: Executor,
    params: {
      walletId: string;
      customerId: string | null;
      channel: TopupMode;
      amount: Money;
      gatewayOrderId: string;
    },
  ): Promise<{ topup: TopupRecord; payment: PaymentRecord }>;

  findTopupByGatewayOrderId(
    db: Executor,
    gatewayOrderId: string,
  ): Promise<TopupWithPayment | null>;

  findTopupById(
    db: Executor,
    topupId: string,
  ): Promise<TopupWithPayment | null>;

  findPaymentByGatewayPaymentId(
    db: Executor,
    gatewayPaymentId: string,
  ): Promise<PaymentRecord | null>;

  markTopupSuccess(
    db: Executor,
    params: {
      topupId: string;
      paymentId: string;
      gatewayPaymentId: string;
      gatewaySignature?: string | null;
      walletTxnId: string;
      capturedAt?: Date;
      rawPayload?: Record<string, unknown>;
    },
  ): Promise<void>;

  markTopupFailed(
    db: Executor,
    params: {
      topupId: string;
      paymentId: string;
      rawPayload?: Record<string, unknown>;
    },
  ): Promise<void>;

  getPresetAmounts(db: Executor): Promise<Money[]>;

  findPendingTopupsOlderThan(
    db: Executor,
    minutes: number,
  ): Promise<TopupWithPayment[]>;
}

export const topupRepo: TopupRepo = {
  async createTopupIntent(db, params) {
    const paymentRes = await db.query<PaymentRecord>(
      `INSERT INTO payments (
         gateway, gateway_order_id, amount, currency, status, ref_type
       )
       VALUES ('razorpay', $1, $2, 'INR', 'CREATED', 'TOPUP')
       RETURNING *`,
      [params.gatewayOrderId, params.amount],
    );
    const payment = paymentRes.rows[0]!;

    const topupRes = await db.query<TopupRecord>(
      `INSERT INTO topups (
         wallet_id, customer_id, channel, amount, payment_id, status
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [params.walletId, params.customerId, params.channel, params.amount, payment.id],
    );
    const topup = topupRes.rows[0]!;

    // Link back payment ref_id to topup.id
    await db.query(
      `UPDATE payments SET ref_id = $1 WHERE id = $2`,
      [topup.id, payment.id],
    );

    return { topup, payment };
  },

  async findTopupByGatewayOrderId(db, gatewayOrderId) {
    const res = await db.query<TopupWithPayment>(
      `SELECT t.id, t.wallet_id, t.customer_id, t.channel, t.amount::text,
              t.fiscal_cash_tag, t.warehouse_id, t.processed_by, t.payment_id,
              t.wallet_txn_id, t.status, t.sms_sent_at, t.sms_error,
              t.created_at, t.updated_at,
              p.gateway_order_id, p.gateway_payment_id
         FROM topups t
         JOIN payments p ON p.id = t.payment_id
        WHERE p.gateway_order_id = $1
        LIMIT 1`,
      [gatewayOrderId],
    );
    return res.rows[0] ?? null;
  },

  async findTopupById(db, topupId) {
    const res = await db.query<TopupWithPayment>(
      `SELECT t.id, t.wallet_id, t.customer_id, t.channel, t.amount::text,
              t.fiscal_cash_tag, t.warehouse_id, t.processed_by, t.payment_id,
              t.wallet_txn_id, t.status, t.sms_sent_at, t.sms_error,
              t.created_at, t.updated_at,
              p.gateway_order_id, p.gateway_payment_id
         FROM topups t
         LEFT JOIN payments p ON p.id = t.payment_id
        WHERE t.id = $1
        LIMIT 1`,
      [topupId],
    );
    return res.rows[0] ?? null;
  },

  async findPaymentByGatewayPaymentId(db, gatewayPaymentId) {
    const res = await db.query<PaymentRecord>(
      `SELECT * FROM payments WHERE gateway_payment_id = $1 LIMIT 1`,
      [gatewayPaymentId],
    );
    return res.rows[0] ?? null;
  },

  async markTopupSuccess(db, params) {
    await db.query(
      `UPDATE payments
          SET status = 'CAPTURED',
              gateway_payment_id = $1,
              gateway_signature = $2,
              captured_at = $3,
              raw_payload = $4,
              updated_at = now()
        WHERE id = $5`,
      [
        params.gatewayPaymentId,
        params.gatewaySignature ?? null,
        params.capturedAt ?? new Date(),
        params.rawPayload ? JSON.stringify(params.rawPayload) : null,
        params.paymentId,
      ],
    );

    await db.query(
      `UPDATE topups
          SET status = 'SUCCESS',
              wallet_txn_id = $1,
              updated_at = now()
        WHERE id = $2`,
      [params.walletTxnId, params.topupId],
    );
  },

  async markTopupFailed(db, params) {
    await db.query(
      `UPDATE payments
          SET status = 'FAILED',
              raw_payload = $1,
              updated_at = now()
        WHERE id = $2`,
      [params.rawPayload ? JSON.stringify(params.rawPayload) : null, params.paymentId],
    );

    await db.query(
      `UPDATE topups
          SET status = 'FAILED',
              updated_at = now()
        WHERE id = $1`,
      [params.topupId],
    );
  },

  async getPresetAmounts(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'topup_preset_amounts' LIMIT 1`,
    );
    if (res.rows.length > 0 && Array.isArray(res.rows[0]!.value)) {
      return res.rows[0]!.value as Money[];
    }
    return ['500.00', '1000.00', '2000.00', '5000.00'] as Money[];
  },

  async findPendingTopupsOlderThan(db, minutes) {
    const res = await db.query<TopupWithPayment>(
      `SELECT t.id, t.wallet_id, t.customer_id, t.channel, t.amount::text,
              t.fiscal_cash_tag, t.warehouse_id, t.processed_by, t.payment_id,
              t.wallet_txn_id, t.status, t.sms_sent_at, t.sms_error,
              t.created_at, t.updated_at,
              p.gateway_order_id, p.gateway_payment_id
         FROM topups t
         JOIN payments p ON p.id = t.payment_id
        WHERE t.status = 'PENDING'
          AND t.created_at < now() - ($1 || ' minutes')::interval
        ORDER BY t.created_at ASC`,
      [minutes],
    );
    return res.rows;
  },
};
