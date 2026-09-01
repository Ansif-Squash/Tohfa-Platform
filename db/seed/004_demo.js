#!/usr/bin/env node
// =============================================================================
// 004_demo.js — Demo dataset for client walkthroughs & Track 1 validation
//
// GATED: Only runs when SEED_DEMO=true. Never loads in production.
// IDEMPOTENT: Uses deterministic UUIDs and ON CONFLICT handling so re-running
// does not duplicate records.
// =============================================================================

import pg from 'pg';

if (process.env.SEED_DEMO !== 'true') {
  console.log('SEED_DEMO is not "true" — skipping demo dataset seed.');
  process.exit(0);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

const DEMO_PASSWORD_HASH = '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi'; // Password@123

async function runDemoSeed() {
  console.log('Seeding demo dataset (SEED_DEMO=true)...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------------------------
    // 1. Resolve Reference IDs (Warehouses, Categories, Crops, Zones)
    // -------------------------------------------------------------------------
    const whRes = await client.query(`SELECT id, code FROM warehouses`);
    const whMap = new Map(whRes.rows.map((r) => [r.code, r.id]));
    const ootyWh = whMap.get('WH-OOTY');
    const coonWh = whMap.get('WH-COON');
    const kotaWh = whMap.get('WH-KOTA');
    const gudaWh = whMap.get('WH-GUDA');

    let defaultZone;
    const zoneRes = await client.query(`SELECT id, code FROM zones LIMIT 4`);
    if (zoneRes.rows.length > 0) {
      defaultZone = zoneRes.rows[0].id;
    } else {
      const newZone = await client.query(
        `INSERT INTO zones (code, name, is_active) VALUES ('ZONE-DEMO-01', 'Ooty Demo Zone', true) RETURNING id`,
      );
      defaultZone = newZone.rows[0].id;
    }

    const cropRes = await client.query(`SELECT id, slug FROM crop_master`);
    const cropMap = new Map(cropRes.rows.map((r) => [r.slug, r.id]));
    const carrotId = cropMap.get('carrot') || cropRes.rows[0]?.id;
    const potatoId = cropMap.get('potato') || cropRes.rows[1]?.id || carrotId;
    const beetrootId = cropMap.get('beetroot') || cropRes.rows[2]?.id || carrotId;

    const superAdminUserId = '00000000-0000-0000-0000-000000000001';
    const tohfaAdminUserId = '00000000-0000-0000-0000-000000000002';

    // -------------------------------------------------------------------------
    // 2. Seed 12 Demo Farmers Across Lifecycle & Certification States
    // -------------------------------------------------------------------------
    console.log('Seeding 12 demo farmers...');
    const farmerConfigs = [
      { num: 1, name: 'Ramesh Patel (Organic Pro)', status: 'APPROVED', cert: 'PGS', certStatus: 'VERIFIED', expiryDays: 300, blocked: false },
      { num: 2, name: 'Lakshmi Narayanan', status: 'APPROVED', cert: 'NPOP', certStatus: 'VERIFIED', expiryDays: 200, blocked: false },
      { num: 3, name: 'Suresh Gowda (Expiring Soon)', status: 'APPROVED', cert: 'PGS', certStatus: 'VERIFIED', expiryDays: 15, blocked: false },
      { num: 4, name: 'Anand Murugan (Expired Cert)', status: 'APPROVED', cert: 'PGS', certStatus: 'VERIFIED', expiryDays: -5, blocked: true },
      { num: 5, name: 'Priya Sundaram (Unverified Cert)', status: 'APPROVED', cert: 'NPOP', certStatus: 'UNVERIFIED', expiryDays: 180, blocked: true },
      { num: 6, name: 'Muthuvel Karunanidhi', status: 'SUBMITTED', cert: 'PGS', certStatus: 'UNVERIFIED', expiryDays: 365, blocked: true },
      { num: 7, name: 'Kavitha Dharmaraj', status: 'DOCS_REVIEW', cert: 'PGS', certStatus: 'UNVERIFIED', expiryDays: 365, blocked: true },
      { num: 8, name: 'Dharmendra Yadav', status: 'FARM_VERIFICATION', cert: 'NPOP', certStatus: 'UNVERIFIED', expiryDays: 365, blocked: true },
      { num: 9, name: 'Balamurugan Raj', status: 'AUDIT', cert: 'PGS', certStatus: 'UNVERIFIED', expiryDays: 365, blocked: true },
      { num: 10, name: 'Venkatesh Babu (New Applicant)', status: 'SUBMITTED', cert: null, certStatus: 'UNVERIFIED', expiryDays: 0, blocked: true },
      { num: 11, name: 'Selvaraj Nadar (Rejected App)', status: 'REJECTED', cert: null, certStatus: 'REJECTED', expiryDays: -100, blocked: true },
      { num: 12, name: 'Geetha Manoharan', status: 'APPROVED', cert: 'PGS', certStatus: 'VERIFIED', expiryDays: 400, blocked: false },
    ];

    const farmerIds = [];

    for (const f of farmerConfigs) {
      const uId = `10000000-0000-0000-0000-${String(f.num).padStart(12, '0')}`;
      const fId = `20000000-0000-0000-0000-${String(f.num).padStart(12, '0')}`;
      farmerIds.push(fId);

      // User
      await client.query(
        `INSERT INTO users (id, mobile, email, password_hash, full_name, user_type, status)
         VALUES ($1, $2, $3, $4, $5, 'FARMER', 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, mobile = EXCLUDED.mobile`,
        [uId, `+91987000${String(f.num).padStart(4, '0')}`, `farmer${f.num}@tohfa.demo`, DEMO_PASSWORD_HASH, f.name],
      );

      // Farmer
      await client.query(
        `INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, application_status, kyc_status, is_market_blocked, rejection_reason, market_block_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET application_status = EXCLUDED.application_status, is_market_blocked = EXCLUDED.is_market_blocked`,
        [
          fId,
          uId,
          `TF-DEMO-${String(f.num).padStart(4, '0')}`,
          defaultZone,
          f.status,
          f.status === 'APPROVED' ? 'VERIFIED' : 'PENDING',
          f.blocked,
          f.status === 'REJECTED' ? 'Incomplete land title documentation' : null,
          f.blocked ? 'Pending unexpired PGS/NPOP certification' : null,
        ],
      );

      // Farm
      const farmId = `30000000-0000-0000-0000-${String(f.num).padStart(12, '0')}`;
      await client.query(
        `INSERT INTO farms (id, farmer_id, name, survey_number, area_acres, centroid_lat, centroid_lng, village, district, is_primary)
         VALUES ($1, $2, $3, $4, $5, 11.4100 + ($6 * 0.005), 76.6900 + ($6 * 0.005), 'Kodanad', 'The Nilgiris', true)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [farmId, fId, `${f.name}'s Organic Farm`, `SF-${100 + f.num}/A`, 3.5 + (f.num * 0.5), f.num],
      );

      // Certification if present
      if (f.cert) {
        const certId = `40000000-0000-0000-0000-${String(f.num).padStart(12, '0')}`;
        await client.query(
          `INSERT INTO certifications
             (id, farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on, verification_status, verified_by, verified_at)
           VALUES
             ($1, $2, $3, $4, 'PGS India Council', CURRENT_DATE - 60, CURRENT_DATE + ($5 * INTERVAL '1 day'), $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET verification_status = EXCLUDED.verification_status, expires_on = EXCLUDED.expires_on`,
          [
            certId,
            fId,
            f.cert,
            `${f.cert}-TN-DEMO-${String(f.num).padStart(4, '0')}`,
            f.expiryDays,
            f.certStatus,
            f.certStatus === 'VERIFIED' ? superAdminUserId : null,
            f.certStatus === 'VERIFIED' ? new Date() : null,
          ],
        );
      }
    }

    // -------------------------------------------------------------------------
    // 3. Fair Price Ceilings
    // -------------------------------------------------------------------------
    console.log('Seeding fair price ceilings...');
    const fairPriceIds = {};
    for (const [cropSlug, cropId] of [[ 'carrot', carrotId ], [ 'potato', potatoId ], [ 'beetroot', beetrootId ]]) {
      for (const grade of ['GRADE_1', 'GRADE_2']) {
        const ceiling = grade === 'GRADE_1' ? (cropSlug === 'carrot' ? '80.00' : '65.00') : '50.00';
        const fpRes = await client.query(
          `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
           VALUES ($1, $2, $3, CURRENT_DATE - 30, $4)
           ON CONFLICT (crop_id, grade, effective_from) DO UPDATE SET ceiling_price = EXCLUDED.ceiling_price
           RETURNING id`,
          [cropId, grade, ceiling, superAdminUserId],
        );
        fairPriceIds[`${cropSlug}_${grade}`] = fpRes.rows[0]?.id;
      }
    }

    const defaultFpId = Object.values(fairPriceIds)[0];

    // -------------------------------------------------------------------------
    // 4. Seed 25 Produce Listings & 3 Live Counter-Offers
    // -------------------------------------------------------------------------
    console.log('Seeding 25 demo listings...');
    const listingStatuses = [
      'DRAFT', 'PENDING_APPROVAL', 'ACCEPTED', 'REJECTED', 'CANCELLED',
      'COUNTER_OFFERED', 'ACCEPTED', 'COUNTER_OFFERED', 'ACCEPTED', 'DRAFT',
      'COUNTER_OFFERED', 'ACCEPTED', 'PENDING_APPROVAL', 'ACCEPTED', 'REJECTED',
      'PENDING_APPROVAL', 'ACCEPTED', 'PENDING_APPROVAL', 'ACCEPTED', 'DRAFT',
      'PENDING_APPROVAL', 'ACCEPTED', 'PENDING_APPROVAL', 'ACCEPTED', 'ACCEPTED',
    ];

    const listingIds = [];

    for (let i = 1; i <= 25; i++) {
      const lId = `50000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
      listingIds.push(lId);
      const farmerId = farmerIds[(i - 1) % farmerIds.length];
      const status = listingStatuses[i - 1];
      const cropId = i % 3 === 0 ? beetrootId : i % 2 === 0 ? potatoId : carrotId;
      const price = (55 + (i % 20)).toFixed(2);

      await client.query(
        `INSERT INTO produce_listings
           (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status, rejection_reason, created_at)
         VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6, $7, $8, $9, now() - ($10 * INTERVAL '1 hour'))
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, price_per_kg = EXCLUDED.price_per_kg, rejection_reason = EXCLUDED.rejection_reason`,
        [
          lId,
          `LIST-DEMO-${String(i).padStart(4, '0')}`,
          farmerId,
          cropId,
          (500 + i * 50).toFixed(3),
          price,
          defaultFpId,
          status,
          status === 'REJECTED' ? 'Quality defect in photo proof' : null,
          i,
        ],
      );

      // Seed 3 LIVE Counter Offers for listings 6, 8, 11 (mid-countdown)
      if ([6, 8, 11].includes(i)) {
        const offerId = `60000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
        await client.query(
          `INSERT INTO counter_offers
             (id, listing_id, round, actor, actor_user_id, price_per_kg, quantity_kg, message, status, expires_at)
           VALUES ($1, $2, 1, 'ADMIN', $3, $4, $5, 'Counter offer for premium organic lot', 'PENDING', now() + INTERVAL '18 hours')
           ON CONFLICT (id) DO UPDATE SET status = 'PENDING', expires_at = now() + INTERVAL '18 hours'`,
          [offerId, lId, superAdminUserId, (Number(price) - 3).toFixed(2), (450 + i * 50).toFixed(3)],
        );
      }
    }

    // -------------------------------------------------------------------------
    // 5. Stocked Inventory Batches at all 4 Warehouses with 70/10/10/10 Allocations
    // -------------------------------------------------------------------------
    console.log('Seeding inventory batches & 70/10/10/10 allocations across 4 warehouses...');
    const whList = [ootyWh, coonWh, kotaWh, gudaWh].filter(Boolean);

    for (let wIdx = 0; wIdx < whList.length; wIdx++) {
      const whId = whList[wIdx];
      const batchId = `70000000-0000-0000-0000-${String(wIdx + 1).padStart(12, '0')}`;
      const batchCode = `BAT-DEMO-WH${wIdx + 1}-001`;

      // Batch
      await client.query(
        `INSERT INTO inventory_batches
           (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, received_on, status)
         VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 2000.000, 2000.000, CURRENT_DATE - 2, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET qty_available = 2000.000, status = 'ACTIVE'`,
        [batchId, batchCode, whId, carrotId, farmerIds[0]],
      );

      // Ledger movement
      const ledgerId = `71000000-0000-0000-0000-${String(wIdx + 1).padStart(12, '0')}`;
      await client.query(
        `INSERT INTO stock_ledger (id, batch_id, warehouse_id, movement_type, qty_delta, balance_after, remarks)
         VALUES ($1, $2, $3, 'RECEIPT', 2000.000, 2000.000, 'Initial demo stock receipt')
         ON CONFLICT (id) DO NOTHING`,
        [ledgerId, batchId, whId],
      );

      // Allocations: 70% Online (1400), 10% Live (200), 10% Reserve (200), 10% Buffer (200)
      const allocChannels = [
        { ch: 'ONLINE', qty: '1400.000' },
        { ch: 'LIVE_MARKET', qty: '200.000' },
        { ch: 'RESERVE', qty: '200.000' },
        { ch: 'BUFFER', qty: '200.000' },
      ];

      for (const a of allocChannels) {
        await client.query(
          `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty, computed_by)
           VALUES ($1, $2, $3, $4, 0.000, 0.000, 'AUTO')
           ON CONFLICT (batch_id, channel) DO UPDATE SET allocated_qty = EXCLUDED.allocated_qty`,
          [batchId, whId, a.ch, a.qty],
        );
      }
    }

    // -------------------------------------------------------------------------
    // 6. Seed 8 Demo Customers with Varied Wallet Balances
    // -------------------------------------------------------------------------
    console.log('Seeding 8 demo customers with wallet balances...');
    const customerConfigs = [
      { num: 1, name: 'Ananya Sharma (Premium)', balance: '8500.00' },
      { num: 2, name: 'Vikram Malhotra', balance: '4200.00' },
      { num: 3, name: 'Deepa Krishnan', balance: '2750.00' },
      { num: 4, name: 'Karthik Raja', balance: '1500.00' },
      { num: 5, name: 'Meera Nambiar', balance: '950.00' },
      { num: 6, name: 'Rajesh Koothrappali', balance: '600.00' },
      { num: 7, name: 'Shortfall Demo Customer (Low Balance)', balance: '15.00' }, // Triggers 402 shortfall demo!
      { num: 8, name: 'Sanjay Varma', balance: '12000.00' },
    ];

    const customerIds = [];

    for (const c of customerConfigs) {
      const uId = `80000000-0000-0000-0000-${String(c.num).padStart(12, '0')}`;
      const cId = `90000000-0000-0000-0000-${String(c.num).padStart(12, '0')}`;
      const wId = `a0000000-0000-0000-0000-${String(c.num).padStart(12, '0')}`;
      customerIds.push(cId);

      // User
      await client.query(
        `INSERT INTO users (id, mobile, email, password_hash, full_name, user_type, status)
         VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
        [uId, `+91988000${String(c.num).padStart(4, '0')}`, `customer${c.num}@tohfa.demo`, DEMO_PASSWORD_HASH, c.name],
      );

      // Customer
      await client.query(
        `INSERT INTO customers (id, user_id, customer_code, preferred_warehouse_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET customer_code = EXCLUDED.customer_code`,
        [cId, uId, `CUST-DEMO-${String(c.num).padStart(4, '0')}`, ootyWh],
      );

      // Wallet
      await client.query(
        `INSERT INTO wallets (id, owner_type, customer_id, balance, currency, status)
         VALUES ($1, 'CUSTOMER', $2, $3, 'INR', 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance`,
        [wId, cId, c.balance],
      );
    }

    // -------------------------------------------------------------------------
    // 7. Seed Orders in All 5 Lifecycle States
    // -------------------------------------------------------------------------
    console.log('Seeding demo orders in all 5 lifecycle states...');
    const orderStates = [
      { num: 1, status: 'CONFIRMED', paymentStatus: 'PAID', otp: '4321' },
      { num: 2, status: 'PACKED', paymentStatus: 'PAID', otp: '5678' },
      { num: 3, status: 'READY_FOR_PICKUP', paymentStatus: 'PAID', otp: '1234' }, // Awaiting OTP handover!
      { num: 4, status: 'PICKED_UP', paymentStatus: 'PAID', otp: '9999' },
      { num: 5, status: 'CANCELLED', paymentStatus: 'REFUNDED', otp: null },
    ];

    for (const o of orderStates) {
      const orderId = `b0000000-0000-0000-0000-${String(o.num).padStart(12, '0')}`;
      const customerId = customerIds[o.num - 1];

      await client.query(
        `INSERT INTO orders
           (id, order_number, customer_id, warehouse_id, channel, fulfilment_type, status, payment_status, total_amount, subtotal, delivery_otp_hash, cancellation_reason, cancelled_at, created_at)
         VALUES ($1, $2, $3, $4, 'ONLINE', 'PICKUP', $5, $6, 450.00, 450.00, $7, $8, $9, now() - ($10 * INTERVAL '2 hour'))
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment_status = EXCLUDED.payment_status`,
        [
          orderId,
          `ORD-DEMO-${String(o.num).padStart(4, '0')}`,
          customerId,
          ootyWh,
          o.status,
          o.paymentStatus,
          o.otp ? '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' : null, // SHA256 of 1234
          o.status === 'CANCELLED' ? 'Customer requested cancellation prior to packing' : null,
          o.status === 'CANCELLED' ? new Date() : null,
          o.num,
        ],
      );
    }

    // -------------------------------------------------------------------------
    // 8. Seed Pending Payouts (Below and Above Rs 10,000)
    // -------------------------------------------------------------------------
    console.log('Seeding pending payouts (below and above Rs 10,000 threshold)...');
    // Payout 1: Rs 4,500 (< 10k) -> Single approval, APPROVED
    await client.query(
      `INSERT INTO payouts
         (id, payout_number, farmer_id, amount, mode, status, initiated_by, released_by, released_at, created_at)
       VALUES
         ('c0000000-0000-0000-0000-000000000001', 'PO-DEMO-000001', $1, 4500.00, 'UPI', 'APPROVED', $2, $2, now(), now() - INTERVAL '1 day')
       ON CONFLICT (id) DO UPDATE SET status = 'APPROVED', amount = 4500.00`,
      [farmerIds[0], superAdminUserId],
    );

    // Payout 2: Rs 35,000 (> 10k) -> Dual approval required, PENDING_APPROVAL
    await client.query(
      `INSERT INTO payouts
         (id, payout_number, farmer_id, amount, mode, status, initiated_by, created_at)
       VALUES
         ('c0000000-0000-0000-0000-000000000002', 'PO-DEMO-000002', $1, 35000.00, 'NEFT', 'PENDING_APPROVAL', $2, now() - INTERVAL '3 hour')
       ON CONFLICT (id) DO UPDATE SET status = 'PENDING_APPROVAL', amount = 35000.00`,
      [farmerIds[1], superAdminUserId],
    );

    await client.query('COMMIT');
    console.log('✅ Demo dataset seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed demo dataset:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runDemoSeed().catch(() => process.exit(1));
