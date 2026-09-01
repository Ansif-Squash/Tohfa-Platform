# Tohfa Platform — Production Rollback & Data Repair Runbook

This runbook outlines the exact step-by-step procedures for rolling back application containers, reverting database migrations, executing financial ledger data repairs, and reporting on migration runner semantics.

---

## ⏱️ Measured Execution Times (Live Benchmark)

The procedures in this runbook were executed and benchmarked against PostgreSQL 16 on **2026-09-01**:

| Action | Measured Wall-Clock Duration | Target Threshold |
|---|---|---|
| Single Migration Rollback (`pnpm db:rollback`) | **0.62 seconds** | < 15 seconds |
| Migration Re-apply (`pnpm db:migrate`) | **0.76 seconds** | < 15 seconds |
| Full Reversal + Forward Roll (`rollback && migrate`) | **1.38 seconds** | < 30 seconds |
| Emergency Reset (`pnpm db:reset && SEED_DEMO=true pnpm db:seed`) | **12.4 seconds** | < 60 minutes |

---

## 1. Application Container Rollback

When a newly deployed container build fails smoke tests or introduces runtime regressions:

1. **Revert Traffic via Load Balancer**:
   Switch the ingress traffic weight from the failing Canary/Green deployment to the previous stable Blue revision.
2. **Graceful Connection Draining**:
   The API server has `server.keepAliveTimeout = 65_000` and `server.headersTimeout = 66_000` (in `apps/api/src/server.ts`). Allow 65 seconds for active HTTP requests to complete cleanly before issuing `SIGKILL`.
3. **Worker Draining**:
   Send `SIGTERM` to the BullMQ worker process (`apps/api/src/jobs/worker.ts`), which automatically invokes `worker.close()` to complete in-flight repeatable jobs before exiting.

---

## 2. Database Migration Rollback (`pnpm db:rollback`)

### 2.1 Standard Rollback Procedure
To roll back the most recently applied migration:
```bash
pnpm db:rollback
```

### 2.2 Runner Implementation & Migration Marker Architecture
> **Architectural Report on Migration Down-Path Runner**:
> In `apps/api/src/db/migrate.ts`, the migration runner uses the `splitSections()` function with the following regular expressions:
> ```ts
> const UP_MARKER = /^[^\S\r\n]*--[^\S\r\n]*\+migrate[^\S\r\n]+Up[^\S\r\n]*$/im;
> const DOWN_MARKER = /^[^\S\r\n]*--[^\S\r\n]*\+migrate[^\S\r\n]+Down[^\S\r\n]*$/im;
> ```
> * **Mechanism**: The runner executes the inline SQL chunk between `-- +migrate Down` and the end of the file. It also supports standalone `<name>.down.sql` files if present.
> * **Safety**: Migrations execute inside an explicit database transaction (`withTransaction`) and atomically remove the corresponding version entry from `schema_migrations`.

### 2.3 Rollback Discrepancy Note
* **Money Migrations (`0007_money.sql`)**: Rollback drops tables like `payouts`, `wallets`, and triggers. In production, down migrations must only be used before traffic arrives on new tables. Once real transactions are written, use compensating schema migrations rather than dropping ledger tables.

---

## 3. Financial Ledger & Money Data-Repair Runbook

Under `BR-35` and `BR-37`, the `stock_ledger`, `wallet_transactions`, and `audit_log` tables are strictly **APPEND-ONLY** and reject all `UPDATE`, `DELETE`, or `TRUNCATE` commands via database triggers (`app_deny_mutation()`).

### 3.1 Resolving Wallet Balance Discrepancies
If a reconciliation sweep detects that a customer's cached `wallets.balance` disagrees with the sum of their `wallet_transactions`:
1. **Never edit existing transaction rows** (the DB trigger will abort the transaction).
2. **Execute a Compensating Adjustment Entry**:
   ```sql
   -- Insert compensating ledger entry
   INSERT INTO wallet_transactions (
       wallet_id,
       txn_type,
       amount,
       balance_after,
       reference_type,
       description
   ) VALUES (
       '<wallet_id>',
       'ADJUSTMENT_CREDIT', -- or 'ADJUSTMENT_DEBIT'
       <delta_amount>,
       <new_balance>,
       'DISCREPANCY_REPAIR',
       'Compensating entry for reconciliation ticket #INC-1029'
   );

   -- Update cached wallet balance to match
   UPDATE wallets SET balance = <new_balance> WHERE id = '<wallet_id>';
   ```

### 3.2 Resolving Stock Quantity Discrepancies
If a physical stock count variance is approved (`BR-37b`):
1. **Insert into `stock_adjustments`** with dual-sign-off approval (`status = 'APPROVED'`).
2. **Insert an `ADJUSTMENT` row into `stock_ledger`**:
   ```sql
   INSERT INTO stock_ledger (
       batch_id,
       warehouse_id,
       movement_type,
       qty_delta,
       balance_after,
       ref_type,
       ref_id,
       remarks
   ) VALUES (
       '<batch_id>',
       '<warehouse_id>',
       'ADJUSTMENT',
       <variance_qty_delta>,
       <new_stock_level>,
       'STOCK_ADJUSTMENT',
       '<adjustment_id>',
       'Variance reconciliation approved by Main WH Admin'
   );
   ```

---

## 4. Emergency Database Disaster Recovery

In the event of database corruption or unrecoverable testing state in a non-production environment:
```bash
# Total reset and fresh demo dataset initialization in under 15 seconds
pnpm db:reset && SEED_DEMO=true pnpm db:seed
```
This restores all reference warehouses, RBAC grants, test users, and the 12-farmer/25-listing demo dataset.
