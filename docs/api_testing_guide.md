# 🧪 TOHFA Platform — Complete & Verified API Testing Guide

> **Base URL (Business Endpoints)**: `http://localhost:3000/v1`  
> **Health Probe (Unversioned)**: `http://localhost:3000/healthz`  
> **Default Auth Header**: `Authorization: Bearer <accessToken>`  
> **Default Content Type**: `application/json`  
> **Postman Collection File**: [`docs/tohfa_api_postman_collection.json`](file:///Users/ansif/Downloads/base/docs/tohfa_api_postman_collection.json) (v2.1 ready to import)

---

## 1. Quick Start & Postman Setup

### 📥 1-Click Postman Import
1. Open Postman ➔ Click **Import**.
2. Select the generated file: [`docs/tohfa_api_postman_collection.json`](file:///Users/ansif/Downloads/base/docs/tohfa_api_postman_collection.json).
3. The collection is pre-configured with collection variables and automated login test scripts that automatically capture and propagate your `farmerToken`, `superAdminToken`, `customerToken`, etc., across all requests.

### ⚙️ Postman / cURL Environment Variables
| Variable | Value | Description |
|---|---|---|
| `baseUrl` | `http://localhost:3000/v1` | Root URL for all v1 API modules |
| `unversionedUrl` | `http://localhost:3000` | Unversioned health check URL |
| `defaultWarehouseId` | `c674e552-3178-42d6-b4db-2ce2843dbb30` | Ooty Central Warehouse (WH-OOTY) |
| `carrotCropId` | `5fcda424-f709-48b3-98a6-03dbbd7ec6c7` | Carrot (Grade 1 ceiling ₹80.00) |
| `potatoCropId` | `04f80e85-1e32-42f4-86e4-7db25d5863a0` | Potato (Grade 1 ceiling ₹65.00) |
| `beetrootCropId` | `c4f7b93d-7f86-4689-8ac7-69f2d6b7ff40` | Beetroot (Grade 1 ceiling ₹65.00) |
| `defaultZoneId` | `03b94b85-0358-4b6f-a6fe-051203c9660f` | Ooty Demo Zone (ZONE-DEMO-01) |

---

## 2. Seeded Test Credentials (All Passwords: `Password@123`)

| Role | Mobile | Email / Name | Scopes & Permissions | Test Purpose |
|---|---|---|---|---|
| **SUPER_ADMIN** | `+919800000001` | Super Administrator | System-wide access (`*`) | Fair price ceiling changes, global overrides, PO approvals |
| **TOHFA_ADMIN** | `+919800000002` | Tohfa Platform Admin | Platform administration | Farmer review, retail pricing, allocation settings |
| **FARMER_ADMIN** | `+919800000003` | Farmer Desk Admin | Reviewer queue (`FARMER_ADMIN`) | Application verification, listing counter-offers (`BR-29`) |
| **MULTI_ROLE** | `+919800000004` | Operations Manager | `TOHFA_ADMIN` + `FARMER_ADMIN` | Multi-role switching validation |
| **FARMER (Active)** | `+919870000001` | Ramesh Patel (Organic Pro) | Verified PGS (`FARMER`) | Produce listings, certificates, wallet payouts |
| **FARMER (Expiring)** | `+919870000003` | Suresh Gowda | 15 Days to Expiry (`FARMER`) | 30-day warning banner test |
| **FARMER (Blocked)** | `+919870000004` | Anand Murugan | Expired Certificate (`FARMER`) | `BR-01` listing rejection (422 `CERT_EXPIRED`) |
| **CUSTOMER (Active)** | `+919880000001` | Ananya Sharma | Balance ₹8,500.00 (`CUSTOMER`) | Catalog browse, 24h cart lock, wallet checkout |
| **CUSTOMER (Low)** | `+919880000007` | Shortfall Customer | Balance ₹15.00 (`CUSTOMER`) | 402 Payment shortfall test |

---

## 3. Instant Token Retrieval (cURL)

#### 🌾 Get Farmer Token:
```bash
FARMER_TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919870000001", "password": "Password@123", "roleCode": "FARMER"}' \
  | jq -r '.accessToken')
echo "Farmer Token: $FARMER_TOKEN"
```

#### 👑 Get Super Admin Token:
```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919800000001", "password": "Password@123", "roleCode": "SUPER_ADMIN"}' \
  | jq -r '.accessToken')
echo "Admin Token: $ADMIN_TOKEN"
```

#### 🛒 Get Customer Token:
```bash
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919880000001", "password": "Password@123"}' \
  | jq -r '.accessToken')
echo "Customer Token: $CUSTOMER_TOKEN"
```

---

## 4. End-to-End Verified Golden Testing Flows

---

### 🌊 Flow A: 5-Step Farmer Onboarding & Admin Approval

#### Step 1: Create Application Draft
```bash
APP_ID=$(curl -s -X POST http://localhost:3000/v1/farmers/applications \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "+919875550001",
    "fullName": "Muthusamy Selvan",
    "preferredLocale": "ta"
  }' | jq -r '.id')
echo "Application ID: $APP_ID"
```

#### Step 2: Save Step 1 (Personal Details)
```bash
curl -s -X PATCH http://localhost:3000/v1/farmers/applications/$APP_ID/steps/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Muthusamy Selvan",
    "dob": "1982-08-14",
    "gender": "MALE",
    "aadhaarLast4": "9876",
    "farmingExperienceYears": 15,
    "addressLine1": "45 Green Hill Road",
    "village": "Kodanad",
    "taluk": "Kotagiri",
    "district": "The Nilgiris",
    "pincode": "643217"
  }' | jq .
```

#### Step 3: Save Step 2 (Farm Details — Array of Farms)
```bash
curl -s -X PATCH http://localhost:3000/v1/farmers/applications/$APP_ID/steps/2 \
  -H "Content-Type: application/json" \
  -d '{
    "farms": [
      {
        "name": "Nilgiri Green Terrace Farm",
        "totalAreaAcres": 4.5,
        "organicSince": "2019-01-01",
        "waterSource": "Borewell & Stream",
        "primaryCrops": ["Carrot", "Potato", "Beetroot"]
      }
    ]
  }' | jq .
```

#### Step 4: Save Step 3 (Location & Centroid)
```bash
curl -s -X PATCH http://localhost:3000/v1/farmers/applications/$APP_ID/steps/3 \
  -H "Content-Type: application/json" \
  -d '{
    "gpsCaptured": true,
    "latitude": 11.4102,
    "longitude": 76.6950,
    "village": "Kodanad",
    "taluk": "Kotagiri",
    "district": "The Nilgiris"
  }' | jq .
```

#### Step 5: Save Step 4 (Document References)
```bash
curl -s -X PATCH http://localhost:3000/v1/farmers/applications/$APP_ID/steps/4 \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "docType": "ID_PROOF",
        "fileUrl": "https://storage.tohfa.in/docs/id-proof.pdf",
        "fileName": "aadhaar-proof.pdf"
      },
      {
        "docType": "FARM_DOC",
        "fileUrl": "https://storage.tohfa.in/docs/patta.pdf",
        "fileName": "land-patta.pdf"
      }
    ]
  }' | jq .
```

#### Step 6: Submit Application (Idempotent `BR-34`)
```bash
curl -s -X POST http://localhost:3000/v1/farmers/applications/$APP_ID/submit \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: submit-uuid-$(date +%s)" | jq .
```

#### Step 7: Admin Approves Application
```bash
curl -s -X POST http://localhost:3000/v1/admin/farmer-applications/$APP_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "03b94b85-0358-4b6f-a6fe-051203c9660f",
    "note": "Verified land patta documents and organic certification."
  }' | jq .
```

---

### 🌾 Flow B: Produce Listing, Counter-Offer, PO, Goods Receipt & 5-Point QC

#### Step 1: Query Fair Price Ceilings (`BR-07`)
```bash
curl -s -X GET "http://localhost:3000/v1/fair-prices?cropId=5fcda424-f709-48b3-98a6-03dbbd7ec6c7&grade=GRADE_1" \
  -H "Authorization: Bearer $FARMER_TOKEN" | jq .
```
*(Shows active ceiling price: ₹80.00/kg)*

#### Step 2: Farmer Creates Produce Listing
```bash
LISTING_RESP=$(curl -s -X POST http://localhost:3000/v1/listings \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: listing-$(date +%s)" \
  -d '{
    "cropId": "5fcda424-f709-48b3-98a6-03dbbd7ec6c7",
    "grade": "GRADE_1",
    "quantityKg": "350.000",
    "askingPricePerKg": "75.00",
    "availableFrom": "2026-09-06"
  }')
echo $LISTING_RESP | jq .
LISTING_ID=$(echo $LISTING_RESP | jq -r '.id')
```
> [!TIP]
> **Ceiling Test**: Try sending `askingPricePerKg: "85.00"` ➔ Fails with `422 PRICE_ABOVE_CEILING`!  
> **Expired Cert Test**: Login with Farmer 4 (`+919870000004`) and try listing ➔ Fails with `422 CERT_EXPIRED`!

#### Step 3: Admin Sends 24-hr Counter-Offer (`BR-10`, `BR-11`)
```bash
OFFER_RESP=$(curl -s -X POST http://localhost:3000/v1/admin/listings/$LISTING_ID/counter-offers \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricePerKg": "72.00",
    "quantityKg": "350.000",
    "message": "Quality intake rate adjustment"
  }')
echo $OFFER_RESP | jq .
OFFER_ID=$(echo $OFFER_RESP | jq -r '.id')
```

#### Step 4: Farmer Accepts Counter-Offer
```bash
curl -s -X POST http://localhost:3000/v1/listings/$LISTING_ID/counter-offers/$OFFER_ID/accept \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: application/json" | jq .
```
*(Listing transitions to `ACCEPTED` with `finalPricePerKg: "72.00"`)*

#### Step 5: Admin Approves Listing & Generates Purchase Order (S-24)
```bash
PO_RESP=$(curl -s -X POST http://localhost:3000/v1/admin/listings/$LISTING_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "c674e552-3178-42d6-b4db-2ce2843dbb30",
    "expectedDeliveryDate": "2026-09-08",
    "note": "Approved after counter-offer agreement"
  }')
echo $PO_RESP | jq .
PO_ID=$(echo $PO_RESP | jq -r '.purchaseOrderId')
```

#### Step 6: Warehouse Creates Goods Receipt (Intake)
```bash
GRN_RESP=$(curl -s -X POST http://localhost:3000/v1/admin/goods-receipts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"purchaseOrderId\": \"$PO_ID\",
    \"warehouseId\": \"c674e552-3178-42d6-b4db-2ce2843dbb30\",
    \"grossQtyKg\": \"350.000\",
    \"vehicleNumber\": \"TN-43-A-1234\",
    \"photos\": [],
    \"remarks\": \"Morning harvest lot\"
  }")
echo $GRN_RESP | jq .
GRN_ID=$(echo $GRN_RESP | jq -r '.id')
```

#### Step 7: Record 5-Point Quality Check (`BR-30`)
```bash
curl -s -X POST http://localhost:3000/v1/admin/goods-receipts/$GRN_ID/quality-check \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedGrade": "GRADE_1",
    "outcome": "ACCEPTED",
    "acceptedQtyKg": "345.000",
    "rejectedQtyKg": "5.000",
    "rejectionReason": "Minor root crack and soil clump",
    "items": [
      { "parameter": "APPEARANCE", "score": 9, "passed": true, "remarks": "Vibrant orange colour", "photoKeys": [] },
      { "parameter": "SIZE_UNIFORMITY", "score": 8, "passed": true, "remarks": "Medium-large straight roots", "photoKeys": [] },
      { "parameter": "MOISTURE", "score": 9, "passed": true, "remarks": "Optimal crispness", "photoKeys": [] },
      { "parameter": "DAMAGE_PEST", "score": 10, "passed": true, "remarks": "Zero pest or worm holes", "photoKeys": [] },
      { "parameter": "FRESHNESS", "score": 9, "passed": true, "remarks": "Fresh harvest smell", "photoKeys": [] }
    ]
  }' | jq .
```

#### Step 8: View Automated 70/10/10/10 Channel Allocation (`BR-12`)
```bash
curl -s -X GET "http://localhost:3000/v1/admin/allocations?warehouseId=c674e552-3178-42d6-b4db-2ce2843dbb30" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

---

### 🛒 Flow C: Farm-Anonymous Catalog, 24h Cart Lock, Wallet Checkout & Delivery

#### Step 1: Browse Farm-Anonymous Catalog (`BR-16`, `BR-24`)
```bash
curl -s -X GET "http://localhost:3000/v1/catalog/products?limit=5" | jq .
```
*(Proven to contain zero farmer names, farm IDs, or GPS data)*

#### Step 2: Add to Cart (Locks 24-Hour Stock Reservation `BR-22`)
```bash
curl -s -X POST http://localhost:3000/v1/cart/items \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "5fcda424-f709-48b3-98a6-03dbbd7ec6c7",
    "grade": "GRADE_1",
    "qtyKg": "3.000",
    "warehouseId": "c674e552-3178-42d6-b4db-2ce2843dbb30"
  }' | jq .
```
*(Returns `status: "LOCKED"`, `lockedAt` and `lockExpiresAt` 24 hours later)*

#### Step 3: Checkout with Wallet Balance (`BR-17`)
```bash
ORDER_RESP=$(curl -s -X POST http://localhost:3000/v1/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-$(date +%s)" \
  -d '{
    "fulfillmentType": "PICKUP",
    "warehouseId": "c674e552-3178-42d6-b4db-2ce2843dbb30",
    "paymentMethod": "WALLET"
  }')
echo $ORDER_RESP | jq .
ORDER_ID=$(echo $ORDER_RESP | jq -r '.id')
```

#### Step 4: Warehouse Packs Order
```bash
curl -s -X POST http://localhost:3000/v1/admin/orders/$ORDER_ID/pack \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

#### Step 5: Warehouse Marks Dispatched / Ready for Pickup
```bash
curl -s -X POST http://localhost:3000/v1/admin/orders/$ORDER_ID/dispatch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "TN-43-W-0001"
  }' | jq .
```

#### Step 6: Verify 4-Digit Handover OTP (`BR-20`)
```bash
curl -s -X POST http://localhost:3000/v1/admin/orders/$ORDER_ID/verify-otp \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "1234"
  }' | jq .
```

---

### 💳 Flow D: Wallets, Cash Top-Up & Farmer Payouts

#### Step 1: Check Own Wallet Balance (`BR-36`)
```bash
curl -s -X GET http://localhost:3000/v1/wallets/me \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
```

#### Step 2: Query Transactions with Re-querying Filter Tabs
```bash
curl -s -X GET "http://localhost:3000/v1/wallets/me/transactions?tab=all&limit=10" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
```

#### Step 3: Admin Cash Top-Up (`BR-18`, `BR-19` Capped at ₹10,000)
```bash
curl -s -X POST http://localhost:3000/v1/admin/wallets/90000000-0000-0000-0000-000000000001/cash-topup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: topup-$(date +%s)" \
  -d '{
    "amount": "2500.00",
    "warehouseId": "c674e552-3178-42d6-b4db-2ce2843dbb30",
    "fiscalCashTag": "POS-CASH-DESK-01",
    "remarks": "In-person counter cash deposit"
  }' | jq .
```
> [!NOTE]
> Testing `BR-19`: Submitting `"amount": "10000.01"` or more fails immediately with `422 CASH_TOPUP_LIMIT_EXCEEDED`.

#### Step 4: Admin Farmer Payout Dues & Payout
```bash
# View Payout Dues
curl -s -X GET http://localhost:3000/v1/admin/payout-dues \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Execute Payout
curl -s -X POST http://localhost:3000/v1/admin/payouts \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payout-$(date +%s)" \
  -d '{
    "farmerId": "20000000-0000-0000-0000-000000000001",
    "amount": "4500.00",
    "mode": "UPI",
    "notes": "Weekly harvest lot settlement"
  }' | jq .
```

---

## 5. Master API Endpoint Directory

### 🔐 Authentication (`/v1/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/login` | None | Password login with optional `roleCode` |
| `POST` | `/v1/auth/otp/send` | None | Send 6-digit SMS challenge |
| `POST` | `/v1/auth/otp/verify` | None | Verify challenge code & return JWT pair |
| `POST` | `/v1/auth/refresh` | None | Rotate refresh token & issue new access token |
| `GET` | `/v1/auth/me` | Bearer | Current user info, roles, and farmerId/customerId |
| `POST` | `/v1/auth/forgot-password` | None | Initiate password reset SMS |
| `POST` | `/v1/auth/reset-password` | None | Submit new password with OTP challenge |

### 👨‍🌾 Farmer Applications & Profile (`/v1/farmers`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/farmers/applications` | None | Create application draft |
| `PATCH` | `/v1/farmers/applications/:id/steps/:step` | None | Save draft step (1..5) |
| `POST` | `/v1/farmers/applications/:id/submit` | None | Submit application for admin review |
| `GET` | `/v1/farmers/applications/:id/status` | None | View application status timeline |
| `GET` | `/v1/farmers/me` | Farmer | View own farmer profile (`BR-33` masked fields) |
| `PATCH` | `/v1/farmers/me` | Farmer | Update address & experience (Aadhaar/mobile locked) |
| `GET` | `/v1/farmers/me/certifications` | Farmer | List certificates with server-driven `daysToExpiry` |
| `POST` | `/v1/farmers/me/certifications` | Farmer | Upload certificate (Starts `UNVERIFIED` `BR-02`) |
| `GET` | `/v1/admin/farmer-applications` | Admin | Review pending farmer applications queue |
| `POST` | `/v1/admin/farmer-applications/:id/approve` | Admin | Approve farmer application & assign zone |
| `POST` | `/v1/admin/certifications/:id/verify` | Admin | Verify PGS/NPOP certification |

### 📈 Pricing & Listings (`/v1/fair-prices`, `/v1/listings`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/fair-prices` | Bearer | View active fair price ceilings |
| `POST` | `/v1/fair-prices` | Super Admin | Set/update fair price ceiling (`BR-08`) |
| `GET` | `/v1/retail-prices` | Bearer | View customer retail prices |
| `POST` | `/v1/listings` | Farmer | Create produce listing (Ceiling enforced `BR-07`) |
| `GET` | `/v1/listings` | Farmer | List caller's own produce listings |
| `GET` | `/v1/admin/listings` | Admin | Admin approval queue |
| `POST` | `/v1/admin/listings/:id/counter-offers` | Admin | Propose price/quantity counter-offer (`BR-10`) |
| `POST` | `/v1/listings/:id/counter-offers/:offerId/accept` | Farmer | Accept negotiation offer |
| `POST` | `/v1/admin/listings/:id/approve` | Admin | Approve listing & raise Purchase Order |

### 🏢 Warehouse & Quality Control (`/v1/admin`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/admin/purchase-orders` | Warehouse | List purchase orders scoped to warehouse |
| `POST` | `/v1/admin/goods-receipts` | Warehouse | Initial intake against PO (Gross weight, vehicle) |
| `POST` | `/v1/admin/goods-receipts/:id/quality-check` | Warehouse | Record 5-point quality check (`BR-30`) |
| `GET` | `/v1/admin/allocations` | Warehouse | 70/10/10/10 channel allocation dashboard (`BR-12`) |
| `GET` | `/v1/admin/stock-ledger` | Warehouse | Append-only inventory movements ledger |

### 🛒 Customer Catalog, Cart & Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/catalog/products` | None | Farm-anonymous consolidated catalog (`BR-16`) |
| `GET` | `/v1/catalog/products/:id` | None | Product detail view |
| `GET` | `/v1/cart` | Customer | View active shopping cart |
| `POST` | `/v1/cart/items` | Customer | Add item and lock 24-hour stock reservation (`BR-22`) |
| `DELETE` | `/v1/cart` | Customer | Clear active cart |
| `POST` | `/v1/orders` | Customer | Wallet-first checkout (`BR-17`) |
| `GET` | `/v1/orders` | Customer | View own order history |
| `POST` | `/v1/admin/orders/:id/pack` | Warehouse | Transition order to `PACKED` |
| `POST` | `/v1/admin/orders/:id/dispatch` | Warehouse | Transition to `READY_FOR_PICKUP` / `DISPATCHED` |
| `POST` | `/v1/admin/orders/:id/verify-otp` | Warehouse | Verify 4-digit handover OTP & complete delivery (`BR-20`) |

### 💳 Wallets, Invoices & Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/wallets/me` | Bearer | Get caller's own wallet balance |
| `GET` | `/v1/wallets/me/transactions` | Bearer | Query transactions with filter tabs (`all`, `credits`, etc.) |
| `POST` | `/v1/admin/wallets/:customerId/cash-topup` | Warehouse | Admin cash deposit with fiscal tag (Max ₹10k `BR-19`) |
| `GET` | `/v1/admin/payout-dues` | Admin | View pending farmer payout dues |
| `POST` | `/v1/admin/payouts` | Admin | Execute farmer payout |
| `GET` | `/v1/invoices` | Bearer | List generated invoices |
| `GET` | `/v1/invoices/:id/download` | Bearer | Download invoice PDF |
| `GET` | `/v1/notifications` | Bearer | In-app notifications feed |
| `POST` | `/v1/notifications/:id/read` | Bearer | Mark notification as read |

---

## 6. Error Codes & Business Rules Reference

| HTTP Code | Error Code | Business Rule | Description & Failure Trigger |
|---|---|---|---|
| `401` | `UNAUTHENTICATED` | — | Token missing, invalid, expired, or wrong signing key |
| `403` | `FORBIDDEN` | — | Missing required permission or actor attempting cross-warehouse access |
| `404` | `NOT_FOUND` | `BR-36` | Resource not found or actor attempting to access another user's private data |
| `409` | `CONFLICT` | — | Version mismatch or duplicate unique key (e.g. mobile number exists) |
| `409` | `STOCK_UNAVAILABLE` | `BR-12` | Cart item requested exceeds available warehouse stock |
| `422` | `PRICE_ABOVE_CEILING` | `BR-07` | Listing asking price exceeds current Super-Admin fair price ceiling |
| `422` | `CERT_EXPIRED` | `BR-01` | Farmer produce listing attempted with an expired PGS/NPOP certification |
| `422` | `CERT_UNVERIFIED` | `BR-02` | Farmer produce listing attempted with unverified certification |
| `422` | `CASH_TOPUP_LIMIT_EXCEEDED` | `BR-19` | Cash top-up single transaction amount exceeds ₹10,000 |
| `422` | `INVALID_OTP` | `BR-20` | Delivery handover OTP does not match hash |
| `429` | `OTP_LOCKED` | `BR-32` | 3 failed OTP attempts locks challenge |
