import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { createWalletService } from './wallet.service.js';
import type { WalletRepo } from './wallet.repo.js';
import type { ListMyTransactionsQuery } from './wallet.schema.js';
import {
  IDS,
  aScope,
  databaseReady,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';
import { pool } from '../../db/pool.js';

interface RecordingRepo extends WalletRepo {
  lastFindOwner: string | null;
}

function fakeRepo(rows: any[]): RecordingRepo {
  const repo: RecordingRepo = {
    lastFindOwner: null,
    async findWalletByOwner(
      _db: Executor,
      ownerType: 'CUSTOMER' | 'FARMER',
      ownerId: string,
    ): Promise<any | null> {
      repo.lastFindOwner = `${ownerType}:${ownerId}`;
      return rows.find((r) => r.ownerType === ownerType && r.ownerId === ownerId) ?? null;
    },
    async createWallet(
      _db: Executor,
      ownerType: 'CUSTOMER' | 'FARMER',
      ownerId: string,
    ): Promise<any> {
      const newWallet = {
        id: newId(),
        ownerType,
        ownerId,
        balance: '0.00',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      };
      rows.push(newWallet);
      return newWallet;
    },
    async listTransactions(
      _db: Executor,
      _walletId: string,
      _query: ListMyTransactionsQuery,
    ): Promise<any> {
      return { items: [], hasMore: false };
    },
    async findTransactionByIdempotencyKey(
      _db: Executor,
      _key: string,
    ): Promise<any | null> {
      return null;
    },
    async insertTransaction(
      _db: Executor,
      _input: any,
    ): Promise<any> {
      return {};
    },
  };
  return repo;
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

describe('walletService.getWalletForActor', () => {
  it('resolves and returns wallet for a customer actor', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await service.getWalletForActor({
      userId: IDS.userSuperAdmin,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: 'customer-123',
    });

    expect(repo.lastFindOwner).toBe('CUSTOMER:customer-123');
  });

  it('resolves and returns wallet for a farmer actor', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await service.getWalletForActor({
      userId: IDS.userSuperAdmin,
      roles: [{ code: RoleCode.FARMER }],
      farmerId: 'farmer-456',
      customerId: null,
    });

    expect(repo.lastFindOwner).toBe('FARMER:farmer-456');
  });

  it('throws FORBIDDEN for an actor with no customerId or farmerId', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await expect(
      service.getWalletForActor({
        userId: IDS.userSuperAdmin,
        roles: [{ code: RoleCode.SUPER_ADMIN }],
        farmerId: null,
        customerId: null,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});

describe('walletService.move validations', () => {
  it('throws VALIDATION_FAILED if amount is not positive', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await expect(
      service.move(
        aScope(),
        {
          walletId: newId(),
          direction: 'CREDIT',
          type: 'TOPUP_DIGITAL',
          amount: '0.00' as Money,
          idempotencyKey: newId(),
        },
        noopDb,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });
});

describeIfDatabase('walletService (integration)', () => {
  let ready = false;
  let testUserId: string;
  let testCustomerId: string;
  let testFarmerId: string;
  let testZoneId: string;

  beforeAll(async () => {
    ready = await databaseReady('wallets');
    if (!ready) return;

    testUserId = newId();
    testCustomerId = newId();
    testFarmerId = newId();
    testZoneId = newId();

    const rand = Math.floor(100000 + Math.random() * 900000);
    const mobileCust = `+919999${rand}`;
    const mobileFarm = `+919998${rand}`;
    const customerCode = `CUST-W-${rand}`;
    const farmerIdCode = `TF-W-${rand}`;

    // Setup foreign key dependencies
    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES 
        ('${testUserId}', '${mobileCust}', 'Wallet Test Cust User', 'CUSTOMER', 'ACTIVE'),
        ('${newId()}', '${mobileFarm}', 'Wallet Test Farm User', 'FARMER', 'ACTIVE');

      INSERT INTO zones (id, code, name, is_active)
      VALUES ('${testZoneId}', 'ZONE_W_${rand}', 'Wallet Test Zone ${rand}', true);

      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${testCustomerId}', '${testUserId}', '${customerCode}');

      INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, application_status, kyc_status)
      VALUES ('${testFarmerId}', (SELECT id FROM users WHERE mobile = '${mobileFarm}'), '${farmerIdCode}', '${testZoneId}', 'APPROVED', 'VERIFIED');
    `);
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('BR-35: ledger sum equals cached balance', async () => {
    if (!ready) return;

    const service = createWalletService();
    
    // Create wallets
    const custWallet = await service.getWalletForActor({
      userId: testUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: testCustomerId,
    });

    const farmWallet = await service.getWalletForActor({
      userId: newId(),
      roles: [{ code: RoleCode.FARMER }],
      farmerId: testFarmerId,
      customerId: null,
    });

    // Seed initial balance to avoid overdraws: credit ₹5000.00 to both
    const scope = aScope();
    await service.move(scope, {
      walletId: custWallet.id,
      direction: 'CREDIT',
      type: 'TOPUP_DIGITAL',
      amount: parseMoney('5000.00'),
      idempotencyKey: newId(),
    });

    await service.move(scope, {
      walletId: farmWallet.id,
      direction: 'CREDIT',
      type: 'TOPUP_DIGITAL',
      amount: parseMoney('5000.00'),
      idempotencyKey: newId(),
    });

    // Run 500 randomized concurrent operations
    const operations = Array.from({ length: 500 }, () => {
      const isCredit = Math.random() > 0.4; // 60% credit, 40% debit
      const amount = (Math.floor(Math.random() * 5) + 1).toFixed(2); // ₹1 to ₹5
      const isCustomer = Math.random() > 0.5;
      const walletId = isCustomer ? custWallet.id : farmWallet.id;
      const direction: 'CREDIT' | 'DEBIT' = isCredit ? 'CREDIT' : 'DEBIT';

      return {
        walletId,
        direction,
        type: 'ORDER_DEBIT' as const,
        amount: parseMoney(amount),
        idempotencyKey: newId(),
      };
    });

    // Execute concurrently
    await Promise.all(
      operations.map((op) =>
        service.move(scope, op).catch((err) => {
          // Ignore overdraws in case they occur
          if (err.code !== 'WALLET_INSUFFICIENT') throw err;
        })
      )
    );

    // Verify wallets balance in database equals ledger sum
    for (const walletId of [custWallet.id, farmWallet.id]) {
      const walletRes = await pool.query('SELECT balance FROM wallets WHERE id = $1', [walletId]);
      const dbBalance = Number(walletRes.rows[0]!.balance);

      const ledgerRes = await pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0) AS sum
        FROM wallet_transactions 
        WHERE wallet_id = $1
      `, [walletId]);
      const ledgerSum = Number(ledgerRes.rows[0]!.sum);

      expect(dbBalance).toBeCloseTo(ledgerSum, 2);
    }
  });

  it('BR-17b: one idempotency key moves money once', async () => {
    if (!ready) return;

    const service = createWalletService();
    
    const wallet = await service.getWalletForActor({
      userId: testUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: testCustomerId,
    });

    const idempotencyKey = newId();
    const scope = aScope();

    // Call service concurrently with same idempotency key 10 times
    const results = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        service.move(
          scope,
          {
            walletId: wallet.id,
            direction: 'CREDIT',
            type: 'TOPUP_DIGITAL',
            amount: parseMoney('123.45'),
            idempotencyKey,
          },
        )
      )
    );

    // Assert that all calls return the exact same transaction ID
    const txId = results[0]!.id;
    for (const res of results) {
      expect(res.id).toBe(txId);
    }

    // Assert that only exactly one row is in wallet_transactions for this idempotency key
    const dbRes = await pool.query(
      'SELECT count(*) FROM wallet_transactions WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    expect(dbRes.rows[0]!.count).toBe('1');
  });

  it('throws WALLET_INSUFFICIENT on overdraw', async () => {
    if (!ready) return;

    const service = createWalletService();
    
    // Create new user & wallet to guarantee 0 balance
    const userId = newId();
    const customerId = newId();
    const randCode = Math.floor(100000 + Math.random() * 900000);
    const mobile = `+919999999${Math.floor(100 + Math.random() * 900)}`;
    const custCode = `CUST-OVERDRAW-${randCode}`;
    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES ('${userId}', '${mobile}', 'Wallet Overdraw User', 'CUSTOMER', 'ACTIVE');
      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${customerId}', '${userId}', '${custCode}');
    `);

    const wallet = await service.getWalletForActor({
      userId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId,
    });

    // Try to debit ₹1.00 from ₹0.00 balance
    await expect(
      service.move(
        aScope(),
        {
          walletId: wallet.id,
          direction: 'DEBIT',
          type: 'ORDER_DEBIT',
          amount: parseMoney('1.00'),
          idempotencyKey: newId(),
        },
      ),
    ).rejects.toMatchObject({
      code: 'WALLET_INSUFFICIENT',
      status: 402,
    });
  });
});
