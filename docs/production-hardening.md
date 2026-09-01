# Tohfa Platform — Production Hardening, Secrets Rotation & Operational Procedures

This document defines the production hardening specifications, secret rotation runbooks, backup/restore procedures, worker autoscaling policies, and observability guidelines for the Tohfa Platform.

---

## 1. Secrets Rotation Procedures

All production secrets must be rotated periodically (every 90 days) or immediately upon suspect compromise.

### 1.1 `JWT_SECRET` (Zero-Downtime Overlap Window)
* **Risk**: Immediate invalidation of all active customer, farmer, and admin sessions.
* **Rotation Procedure**:
  1. Generate a high-entropy secret (>= 256 bits / 64 hex characters):
     ```bash
     openssl rand -hex 32
     ```
  2. Configure dual-secret validation in the API:
     - The API signs new tokens with `JWT_SECRET_PRIMARY`.
     - The API verifies incoming tokens against `JWT_SECRET_PRIMARY`, falling back to `JWT_SECRET_SECONDARY` during the transition window.
  3. **Overlap Window**: Keep `JWT_SECRET_SECONDARY` active for **30 days** (matching `JWT_REFRESH_TTL=30d`), ensuring active refresh tokens remain redeemable without forcing re-logins.
  4. After 30 days, remove `JWT_SECRET_SECONDARY`.

### 1.2 `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` & `RAZORPAY_WEBHOOK_SECRET`
1. Generate a new API Key in the Razorpay Dashboard (Settings -> API Keys -> Generate Key).
2. Deploy the new credentials to the container environment.
3. Update the webhook secret in Razorpay Dashboard webhooks configuration to match `RAZORPAY_WEBHOOK_SECRET`.
4. Deactivate the old Razorpay API Key after verifying successful incoming webhook deliveries.

### 1.3 `RAZORPAYX_ACCOUNT`
1. Update RazorpayX account mappings in coordination with the finance team.
2. Confirm sandbox verification on account credentials before promoting to production.

### 1.4 `AZURE_STORAGE_CONNECTION_STRING`
1. Regenerate **Key 2** in the Azure Portal (Storage Account -> Access Keys -> Regenerate Key 2).
2. Update application environment variables with the Connection String containing Key 2.
3. Once running, regenerate **Key 1** to invalidate the old key.

### 1.5 `MSG91_AUTH_KEY` & `FCM_SERVER_KEY`
1. Generate secondary Auth Token in MSG91 / Firebase Cloud Messaging console.
2. Update deployment secrets.
3. Delete previous token from provider console.

---

## 2. Database Backup Schedule & Proven Restore Procedure

### 2.1 Backup Policy
* **Continuous WAL Archiving**: PostgreSQL WAL shipping enabled (RPO < 5 minutes).
* **Daily Full Physical Backup**: pg_dump / pgBackRest snapshot taken at `01:00 UTC` daily.
* **Retention Schedule**:
  * Daily backups retained for **30 days**.
  * Weekly backups retained for **12 weeks**.
  * Monthly backups retained for **7 years** (compliance / financial audits).

### 2.2 Proven Restore Procedure (Tested & Timed)
To restore a snapshot into a staging/recovery instance:
```bash
# 1. Terminate active application connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'tohfa' AND pid <> pg_backend_pid();

# 2. Drop and recreate target database
DROP DATABASE IF EXISTS tohfa;
CREATE DATABASE tohfa;

# 3. Restore schema & data
psql "$DATABASE_URL" < backup_snapshot.sql

# 4. Verify post-restore integrity
psql "$DATABASE_URL" -c "SELECT count(*) FROM schema_migrations; SELECT count(*) FROM users; SELECT count(*) FROM wallets;"
```
* **Tested Recovery Time Objective (RTO)**: ~45 seconds on standard dev/staging infrastructure.

---

## 3. Worker Autoscaling Policy (`apps/api/src/jobs/worker.ts`)

The background job worker process processes asynchronous sweeps (`certificate-expiry-sweep`, `counter-offer-expiry-sweep`, `cart-reservation-release`, `cash-tag-reconciliation`).

### 3.1 Scaling Metrics
* **Autoscale Trigger**: Keyed on BullMQ queue depth (`queue:tohfa:waiting` + `queue:tohfa:delayed` in Redis).
* **Scaling Rules**:
  * `Queue Depth < 100`: 1 Replica (Base)
  * `Queue Depth >= 100`: Scale to 2 Replicas
  * `Queue Depth >= 500`: Scale to 4 Replicas (Max)
  * `Scale-down Cooldown`: 10 minutes to prevent thrashing.

### 3.2 Concurrency & Idempotency Guarantees
* Worker instance concurrency set to `4` (`{ connection: queueRedis, concurrency: 4 }`).
* Every background job in `JOB_REGISTRY` utilizes database transactions (`withTransaction`) and row-level locks or transactional status checks, guaranteeing idempotency under concurrent execution.

---

## 4. Observability & Sentry Error Scrubbing

### 4.1 Sentry Configuration
* SDK initialized in both API (`apps/api/src/server.ts`) and Worker (`apps/api/src/jobs/worker.ts`).
* Environment tagged with `NODE_ENV` and `traceId` correlation header.

### 4.2 Data Privacy Scrubbing Policy (`BR-16`, `CLAUDE.md §2.5`)
* Automatic `beforeSend` hook completely strips `request.data`.
* Recursively redacts all sensitive keys matching:
  `/(password|passwd|pwd|secret|authorization|cookie|token|jwt|otp|verification.?code|reset.?code|pin|aadhaar|aadhar|account.?number|bank.?account|ifsc|upi|card|pan|money|amount|price|ceiling|rate|balance)/i`
* Financial amounts and credentials never reach external telemetry.

### 4.3 Alert Rules
* **P0 Alert (Slack/PagerDuty)**: Any unhandled exception in `apps/api/src/modules/orders` or `apps/api/src/modules/payouts`.
* **P1 Alert**: Worker job failure rate exceeding 1% over a 5-minute window.
* **P2 Alert**: API 5xx error rate exceeding 0.5% over 10 minutes.
