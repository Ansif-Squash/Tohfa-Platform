import type { Executor } from '../../db/pool.js';
import { negate, parseMoney, type Money } from '@tohfa/shared-types';
import type {
  ListMyTransactionsQuery,
  WalletResponse,
  WalletTransactionResponse,
  WalletTxnType,
} from './wallet.schema.js';

/** Raw row shapes directly from Postgres. */
export interface WalletRow {
  id: string;
  owner_type: 'CUSTOMER' | 'FARMER';
  customer_id: string | null;
  farmer_id: string | null;
  balance: string; // NUMERIC returned as string
  currency: string;
  status: string;
  version: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface WalletTransactionRow {
  id: string;
  wallet_id: string;
  idempotency_key: string;
  direction: 'CREDIT' | 'DEBIT';
  type: string;
  amount: string;
  balance_after: string;
  ref_type: string | null;
  ref_id: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: Date;
  fiscal_cash_tag: string | null;
  warehouse_id: string | null;
}

export function toWalletResponse(row: WalletRow): WalletResponse {
  return {
    id: row.id,
    ownerType: row.owner_type,
    balance: parseMoney(row.balance),
    currency: 'INR',
    status: row.status as 'ACTIVE' | 'FROZEN',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  };
}

export function toWalletTransactionResponse(row: WalletTransactionRow): WalletTransactionResponse {
  const amt = parseMoney(row.amount);
  const signedAmt = row.direction === 'DEBIT' ? negate(amt) : amt;

  return {
    id: row.id,
    walletId: row.wallet_id,
    txnType: row.type as WalletTxnType,
    amount: signedAmt,
    balanceAfter: parseMoney(row.balance_after),
    refType: row.ref_type,
    refId: row.ref_id,
    fiscalCashTag: row.fiscal_cash_tag,
    warehouseId: row.warehouse_id,
    performedBy: row.created_by,
    performedAt: row.created_at.toISOString(),
    remarks: row.remarks,
  };
}

export interface InsertTransactionData {
  walletId: string;
  idempotencyKey: string;
  direction: 'CREDIT' | 'DEBIT';
  type: WalletTxnType;
  amount: Money;
  refType?: string | null;
  refId?: string | null;
  remarks?: string | null;
  createdBy?: string | null;
}

export interface ListTransactionsResult {
  items: WalletTransactionResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface WalletRepo {
  findWalletByOwner(
    db: Executor,
    ownerType: 'CUSTOMER' | 'FARMER',
    ownerId: string,
  ): Promise<WalletRow | null>;

  createWallet(
    db: Executor,
    ownerType: 'CUSTOMER' | 'FARMER',
    ownerId: string,
  ): Promise<WalletRow>;

  insertTransaction(
    db: Executor,
    data: InsertTransactionData,
  ): Promise<WalletTransactionRow>;

  findTransactionByIdempotencyKey(
    db: Executor,
    key: string,
  ): Promise<WalletTransactionRow | null>;

  listTransactions(
    db: Executor,
    walletId: string,
    filters: ListMyTransactionsQuery,
  ): Promise<ListTransactionsResult>;
}

export const walletRepo: WalletRepo = {
  async findWalletByOwner(db, ownerType, ownerId) {
    const query =
      ownerType === 'CUSTOMER'
        ? 'SELECT * FROM wallets WHERE customer_id = $1'
        : 'SELECT * FROM wallets WHERE farmer_id = $1';
    const result = await db.query<WalletRow>(query, [ownerId]);
    return result.rows[0] ?? null;
  },

  async createWallet(db, ownerType, ownerId) {
    const customerId = ownerType === 'CUSTOMER' ? ownerId : null;
    const farmerId = ownerType === 'FARMER' ? ownerId : null;
    const result = await db.query<WalletRow>(
      `INSERT INTO wallets (owner_type, customer_id, farmer_id, balance, currency, status)
       VALUES ($1, $2, $3, '0.00', 'INR', 'ACTIVE')
       RETURNING *`,
      [ownerType, customerId, farmerId],
    );
    return result.rows[0]!;
  },

  async insertTransaction(db, data) {
    const result = await db.query<WalletTransactionRow>(
      `INSERT INTO wallet_transactions (
        wallet_id,
        idempotency_key,
        direction,
        type,
        amount,
        balance_after,
        ref_type,
        ref_id,
        remarks,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, '0.00', $6, $7, $8, $9)
      RETURNING *`,
      [
        data.walletId,
        data.idempotencyKey,
        data.direction,
        data.type,
        data.amount, // money string matches pg numeric
        data.refType ?? null,
        data.refId ?? null,
        data.remarks ?? null,
        data.createdBy ?? null,
      ],
    );
    return result.rows[0]!;
  },

  async findTransactionByIdempotencyKey(db, key) {
    const result = await db.query<WalletTransactionRow>(
      `SELECT t.*, tu.fiscal_cash_tag, tu.warehouse_id
         FROM wallet_transactions t
         LEFT JOIN topups tu ON tu.wallet_txn_id = t.id
        WHERE t.idempotency_key = $1`,
      [key],
    );
    return result.rows[0] ?? null;
  },

  async listTransactions(db, walletId, filters) {
    const params: unknown[] = [walletId];
    const conditions: string[] = ['t.wallet_id = $1'];

    if (filters.type !== undefined) {
      params.push(filters.type);
      conditions.push(`t.type = $${params.length}`);
    }

    if (filters.from !== undefined) {
      params.push(filters.from);
      conditions.push(`t.created_at >= $${params.length}::timestamptz`);
    }

    if (filters.to !== undefined) {
      params.push(filters.to);
      conditions.push(`t.created_at <= $${params.length}::timestamptz`);
    }

    if (filters.tab === 'credits') {
      conditions.push(`t.direction = 'CREDIT'`);
    } else if (filters.tab === 'debits') {
      conditions.push(`t.direction = 'DEBIT'`);
    } else if (filters.tab === 'refunds') {
      conditions.push(`t.type = 'ORDER_REFUND'`);
    }

    if (filters.cursor !== undefined && filters.cursor.length > 0) {
      params.push(filters.cursor);
      conditions.push(`t.id < $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const limit = filters.limit;
    params.push(limit + 1);

    const querySql = `
      SELECT t.*, tu.fiscal_cash_tag, tu.warehouse_id
        FROM wallet_transactions t
        LEFT JOIN topups tu ON tu.wallet_txn_id = t.id
       WHERE ${where}
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT $${params.length}
    `;

    const result = await db.query<WalletTransactionRow>(querySql, params);
    const rows = result.rows;
    const hasMore = rows.length > limit;
    const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && itemsToReturn.length > 0
        ? itemsToReturn[itemsToReturn.length - 1]!.id
        : null;

    return {
      items: itemsToReturn.map(toWalletTransactionResponse),
      nextCursor,
      hasMore,
    };
  },
};
