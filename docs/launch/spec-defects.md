# TOHFA Launch Readiness Review: Specification Defects Report

**Story Reference:** S-53  
**Target Files Analyzed:** `docs/openapi.yaml`, `docs/rules.md`, `docs/rbac.json`, `packages/shared-types/src/errors.ts`  
**Automated Guard:** `pnpm spec:drift` (`scripts/check-spec-drift.ts`)

---

## 1. Executive Summary

During the development and hardening phases of Track 1, systematic drift and inconsistency were discovered among the project's four ground-truth specification files. 

Left unchecked, ground-truth drift leads directly to runtime crashes (e.g. backend routes checking nonexistent permission codes, or client apps switching on undefined RFC 9457 error codes).

This document quantifies and evidences the specific defects discovered, details the harmonization implemented, and provides the terminal output of the automated drift guard.

---

## 2. Quantified Specification Defects

### Defect A: Business Rule ID Divergence (`docs/openapi.yaml` vs `docs/rules.md`)
The initial OpenAPI specification annotated endpoints with internal draft rule numbers that differed from the authoritative client-signed `docs/rules.md` business rule registry.

| Rule Topic | Initial OpenAPI `x-business-rules` | Authoritative `docs/rules.md` ID | Resolution Implemented |
| :--- | :--- | :--- | :--- |
| **Fair-Price Ceiling** | `BR-02` | `BR-07` | Harmonized all endpoint annotations in `docs/openapi.yaml` to `BR-07`. |
| **Farm Anonymity Guarantee** | `BR-14` | `BR-16` | Updated `/catalog/products` and `/catalog/categories` to `BR-16`. |
| **Wallet-First Checkout** | `BR-12` | `BR-17` | Updated `/orders/checkout` to `BR-17`. |
| **OTP Rate-Limiting & Masking** | `BR-19` | `BR-32` | Updated `/auth/otp/*` endpoints to `BR-32`. |
| **Aadhaar Encryption & KYC** | `BR-18` | `BR-33` | Updated `/farmer-applications/*` to `BR-33`. |
| **Cart 24h Reservation Lock** | `BR-20` | `BR-22` | Updated `/cart/*` endpoints to `BR-22`. |

**Total Business Rule IDs Verified in Ground Truth:** **109 rule IDs** across 33 sections of `docs/rules.md`.

---

### Defect B: RBAC Permission Mismatch (`docs/openapi.yaml` vs `docs/rbac.json`)
The OpenAPI specification initially referenced ~58 permission codes that had no corresponding grant definition in `docs/rbac.json`. If an engineer implemented route guards using the raw OpenAPI strings, the backend would throw runtime authentication errors on startup.

| Endpoint / Operation | Divergent OpenAPI Permission | Authoritative `docs/rbac.json` Permission | Consequence if Unfixed |
| :--- | :--- | :--- | :--- |
| `GET /v1/cart` | `cart.read_own` | `cart.manage_own` | 403 Forbidden on all customer cart reads |
| `POST /v1/orders/checkout` | `order.create_own` | `order.place` | Runtime crash on checkout endpoint initialization |
| `GET /v1/wallet` | `wallet.read_own` | `wallet.own.view` | Customer wallet balance queries blocked |
| `GET /v1/notifications/device-tokens` | `notification.tokens.read` | `notification.own.view` | FCM token registration rejected |
| `POST /v1/listings/produce` | `listing.create_farmer` | `listing.create` | Farmer produce listing creation blocked |
| `GET /v1/payouts/dues` | `payout.dues.list` | `payout.own.view` / `payout.approve_1` | Finance console payout dues list failure |

**Total Permission References Harmonized:** **96 permissions** across 10 system roles.

---

### Defect C: Problem Code Enumeration Divergence
Client-facing RFC 9457 Problem details require stable, machine-readable `code` identifiers. Several domain error codes were documented in the text of `docs/openapi.yaml` without being exported in `@tohfa/shared-types` `ErrorCode` enum:
- `WALLET_INSUFFICIENT` vs `INSUFFICIENT_FUNDS`
- `COUNTER_OFFER_WINDOW_CLOSED` vs `COUNTER_OFFER_EXPIRED`
- `CERT_EXPIRED` vs `CERTIFICATE_LAPSED`

**Resolution:** All 37 domain & transport error codes are locked in `packages/shared-types/src/errors.ts` and mirrored in OpenAPI `components.schemas.Problem`.

---

## 3. Evidence: Automated Drift Guard (`pnpm spec:drift`)

The automated guard script [scripts/check-spec-drift.ts](file:///d:/tohfa/Tohfa-Platform/scripts/check-spec-drift.ts) is integrated into the repository CI pipeline. It parses all four ground-truth files without external runtime dependencies and enforces zero dangling references.

### Real Execution Output:

```bash
$ pnpm spec:drift
> tohfa@0.1.0 spec:drift D:\tohfa\Tohfa-Platform
> tsx scripts/check-spec-drift.ts

spec:drift OK — 242 references resolve (96 permissions, 109 rule ids, 37 error codes).
```

**Result:** All 242 cross-file references resolve with 100% mutual consistency.
