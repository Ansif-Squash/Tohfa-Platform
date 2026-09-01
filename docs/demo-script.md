# Tohfa Platform — 15-Minute Track 1 Client Demo Script

This document provides a scripted, end-to-end client walkthrough of the Tohfa Organic Produce Platform (Track 1). It is tuned for an exact 15-minute presentation with pre-flight checks, timed sections, exact click-paths, talking points, and interactive failure demonstrations.

---

## ⏱️ Timeline Overview

| Section | Topic | Persona / Role | Time |
|---|---|---|---|
| **0. Pre-Flight** | Environment sanity & quick reset | Ops | Pre-demo |
| **1. Overview & Fair Price Ceiling** | Platform governance & price ceilings (`BR-07`, `BR-08`) | Super Admin | 00:00 – 02:30 |
| **2. Farmer Intake & Listing Negotiation** | Farmer onboarding, 24h counter-offers (`BR-10`, `BR-29`) | Farmer Admin / Super Admin | 02:30 – 05:30 |
| **3. Warehouse Ingestion & 70/10/10/10 Allocation** | Quality check, ledger & allocation split (`BR-12`, `BR-30`) | Main/Sub Warehouse Admin | 05:30 – 08:30 |
| **4. Customer App: Cart Locks & Wallet Checkout** | 24h cart reservation & wallet-first payment (`BR-17`, `BR-22`) | Customer | 08:30 – 11:30 |
| **5. Fulfilment, OTP Handover & Dual Approval Payout** | Handover OTP & dual approval gate (`BR-20`, `BR-31`) | Warehouse Admin & Super Admin | 11:30 – 14:00 |
| **6. Q&A and Emergency Reset** | Client questions & fast database reset | All | 14:00 – 15:00 |

---

## 🛠️ Section 0: Pre-Flight Checklist & Fast Reset

### 1. Pre-Flight Sanity Check
Before starting the presentation:
1. Ensure the API is running: `http://localhost:3000/v1/healthz` returns `{"status":"ok"}`.
2. Ensure the Admin Web is open: `http://localhost:4200`.
3. Verify demo data is populated:
   ```bash
   SEED_DEMO=true pnpm db:seed
   ```

### 2. Fast Recovery Reset Command (< 60s)
If a demo step gets botched or you need a clean slate during a live rehearsal:
```bash
pnpm db:reset && SEED_DEMO=true pnpm db:seed
```

---

## 📋 Section 1: Overview & Fair Price Ceilings (00:00 – 02:30)

### Persona & Credentials
* **User**: `superadmin@tohfa.test`
* **Password**: `Password@123`
* **Role**: `SUPER_ADMIN`

### Talking Points
> *"Welcome to the Tohfa Organic Produce Platform. Tohfa connects smallholder organic farmers in The Nilgiris directly to urban consumers through a transparent, price-controlled supply chain. Today we will walk through the full lifecycle: from price governance, farm intake, and automated 70/10/10/10 warehouse channel allocation, to consumer wallet checkout and dual-approval payouts."*

### Click-Path & Demo Action
1. Log in to `http://localhost:4200` as `superadmin@tohfa.test`.
2. Navigate to **Pricing & Ceilings** (`/pricing`).
3. Point out the active Fair Price Ceilings for Ooty Organic Carrots Grade 1 (`₹80.00/kg`) and Grade 2 (`₹50.00/kg`).

### 🔴 Failure Demo 1: Listing Exceeding Fair Price Ceiling Rejected
* **Action**: Try to create a listing or simulate a farmer listing creation at `₹95.00/kg` (exceeding the `₹80.00/kg` ceiling).
* **What to say**: *"Notice that our backend immediately rejects any attempt to list above the statutory ceiling with a 422 Unprocessable Entity (`CEILING_EXCEEDED`). The platform strictly prevents speculative retail inflation."*

---

## 📋 Section 2: Farmer Intake & Listing Negotiation (02:30 – 05:30)

### Persona & Credentials
* **User**: `admin@tohfa.test` (Tohfa Admin) / `farmeradmin@tohfa.test` (Farmer Admin)
* **Password**: `Password@123`

### Talking Points
> *"Tohfa maintains a strict organic trust chain. Every farmer undergoes land title verification and PGS/NPOP certification checks. When certificates expire, our automated nightly sweep immediately blocks market listings (BR-01)."*

### Click-Path & Demo Action
1. Navigate to **Farmer Applications** (`/farmers`).
2. Show the pipeline: `Draft`, `Submitted`, `Docs Review`, `Farm Verification`, `Audit`, `Approved`.
3. Open farmer **Suresh Gowda** (flagged as "Expiring in 15 days") and **Anand Murugan** (flagged as "Market Blocked — Expired PGS Certificate").
4. Navigate to **Produce Listings** (`/marketplace/listings`).
5. Open listing `LIST-DEMO-0006` with an active counter-offer.
6. Show the live **24-hour countdown timer** on the counter-offer (`BR-10`). Explain that if unresponded within 24 hours, it lapses automatically without locking farmer inventory.

---

## 📋 Section 3: Warehouse Ingestion & 70/10/10/10 Allocation (05:30 – 08:30)

### Persona & Credentials
* **User**: `multirole@tohfa.test` (Main Warehouse Admin - Ooty)
* **Password**: `Password@123`

### Talking Points
> *"When produce arrives at our warehouse hubs, Sub Warehouse Admins perform a 5-point quality inspection. Once approved, our immutable append-only stock ledger generates an inventory batch and instantly splits the stock into 70/10/10/10 buckets (BR-12)."*

### Click-Path & Demo Action
1. Navigate to **Inventory & Batches** (`/inventory`).
2. Select batch `BAT-DEMO-WH1-001` (2,000 kg Grade 1 Carrots at Ooty Warehouse).
3. Display the channel allocation breakdown:
   * **Online App (70%)**: `1,400.00 kg`
   * **Live Market Day (10%)**: `200.00 kg`
   * **Institutional Reserve (10%)**: `200.00 kg`
   * **Spoilage / Buffer (10%)**: `200.00 kg`
4. Explain **BR-30**: Sub Warehouse Admins in Coonoor or Kotagiri can only view their own warehouse's intake and inventory; cross-warehouse leakage is physically denied by scoped database filters.

---

## 📋 Section 4: Customer App: Cart Locks & Wallet Checkout (08:30 – 11:30)

### Persona & Credentials
* **User**: `customer7@tohfa.demo` (Shortfall Customer) & `customer1@tohfa.demo` (Premium Customer)
* **Password**: `Password@123`

### Talking Points
> *"Tohfa uses a wallet-first checkout architecture. To eliminate race conditions where multiple customers buy the last available crate of fresh produce, adding an item to the cart places a 24-hour reservation lock directly against the 70% Online allocation bucket (BR-22)."*

### Click-Path & Demo Action
1. Open API test or Customer Web view with `customer7@tohfa.demo` (Wallet Balance: `₹15.00`).
2. Add `5.0 kg` of Carrots (`₹375.00`) to the cart.
3. Attempt checkout (`POST /v1/orders`).

### 🔴 Failure Demo 2: Insufficient Wallet Balance (402 Shortfall Moment)
* **Result**: The API returns `402 Payment Required` with exact shortfall metadata:
  ```json
  {
    "code": "WALLET_INSUFFICIENT_BALANCE",
    "required": "375.00",
    "balance": "15.00",
    "shortfall": "360.00"
  }
  ```
* **What to say**: *"The system immediately detects the shortfall and prompts the customer with a top-up action for exactly ₹360.00."*
4. Switch to `customer1@tohfa.demo` (Wallet Balance: `₹8,500.00`), place the order, and show instant confirmation with order number `ORD-DEMO-0001`.

---

## 📋 Section 5: Fulfilment, OTP Handover & Dual Approval Payout (11:30 – 14:00)

### Persona & Credentials
* **User**: `superadmin@tohfa.test` / `admin@tohfa.test`

### Talking Points
> *"For security and fraud prevention, handover at the warehouse requires a cryptographic 4-digit OTP. Once delivered, farmers are owed settlement dues. Any payout exceeding ₹10,000 mandates dual approval by two distinct administrators (BR-31)."*

### Click-Path & Demo Action
1. Navigate to **Order Fulfilment** (`/fulfilment`).
2. Select order `ORD-DEMO-0003` in `READY_FOR_PICKUP` state.
3. Demonstrate handover verification by entering the OTP `1234`. Status immediately updates to `PICKED_UP` and timestamp is recorded.
4. Navigate to **Farmer Payouts** (`/payouts`).
5. Show **Payout 1** (`₹4,500.00`): Status is `APPROVED` (single admin approval).
6. Show **Payout 2** (`₹35,000.00`): Status is `PENDING_APPROVAL` with `requires_dual_approval = true`.

### 🔴 Failure Demo 3: Self-Approval of Large Payout Refused
* **Action**: While logged in as `superadmin@tohfa.test` (who initiated Payout 2), attempt to approve Payout 2.
* **Result**: Backend returns `403 Forbidden` / `422 Unprocessable Entity` (`SAME_ACTOR_APPROVAL`).
* **What to say**: *"Notice that the system strictly forbids the initiating administrator from approving their own high-value payout. A second, distinct administrator must review and release the funds."*
7. Log out and log in as `admin@tohfa.test` to approve Payout 2. The payout transitions to `APPROVED` and generates an immutable audit record.

---

## 📋 Section 6: Q&A & Wrap Up (14:00 – 15:00)

### Key Takeaways for Client
* **Complete Trust Chain**: Farm-to-fork PGS/NPOP certification enforcement.
* **No Overselling**: 70/10/10/10 automated warehouse allocation with 24-hour cart reservation locks.
* **Financial Integrity**: Double-entry ledger, immutable audit logging, and dual-approval controls on high-value money movements.
* **Farm Anonymity Protected**: Customer responses are guaranteed free of farm GPS coordinates or producer identity (`BR-16`).
