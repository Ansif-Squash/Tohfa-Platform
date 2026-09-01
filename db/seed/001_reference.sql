-- =============================================================================
-- 001_reference.sql — TOHFA reference data
--
-- Idempotent. Safe to re-run on every deploy; it is the definition of the
-- reference rows, not a one-time bootstrap. Run AFTER all migrations:
--
--     psql -v ON_ERROR_STOP=1 -d "$DATABASE_URL" -f db/seed/001_reference.sql
--
-- Permissions and role_permissions are NOT here — they are generated from
-- docs/rbac.json by db/seed/002_permissions.js so the permission list exists
-- in exactly one place.
--
-- The whole file is one transaction because allocation_config carries a
-- DEFERRABLE constraint trigger that checks the 100% sum at COMMIT (BR-12b).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Roles — the 7 roles of docs/rbac.json (BR-28 hierarchy, BR-30 scoping)
-- -----------------------------------------------------------------------------
INSERT INTO roles (code, name, hierarchy_level, scope_dimension, brand_color_hex, summary) VALUES
    ('SUPER_ADMIN',   'TOHFA Super Admin',      1, NULL,          '#A32D2D',
     'Full system. Only role that may set the fair price ceiling (BR-08), set allocation percentages (BR-12), approve payouts above Rs 10,000 (BR-31), reactivate farmers (BR-34) and create Super/TOHFA/Main Warehouse Admins (BR-28).'),
    ('TOHFA_ADMIN',   'TOHFA Admin',            2, NULL,          '#F0562A',
     'Operational head. Cannot set the fair price ceiling (BR-08), cannot initiate inter-warehouse transfers (BR-26), cannot approve payouts above Rs 10,000 (BR-31), cannot reactivate a disabled farmer (BR-34). Brand colour is a placeholder — confirm with client.'),
    ('FARMER_ADMIN',  'Farmer Admin (Elected)', 3, 'zone_id',     '#0F6E56',
     'Elected farmer, not paid staff. Approves peer listings but never their own — those auto-route (BR-29). Edits farm ratings for their own zone only (OWN_ZONE_ONLY). Brand colour is a placeholder — confirm with client.'),
    ('MAIN_WH_ADMIN', 'Main Warehouse Admin',   3, NULL,          '#854F0B',
     'Oversees all 4 warehouses. Initiates inter-warehouse transfers (BR-26), approves stock adjustments (BR-37), manages Sub Warehouse Admins.'),
    ('SUB_WH_ADMIN',  'Sub Warehouse Admin',    4, 'warehouse_id','#E48932',
     'Day-to-day operations of exactly one warehouse (BR-25). Every query is filtered by warehouse_id and cross-warehouse rows return empty, never 403 (BR-30). Cannot approve its own stock adjustments (BR-37).'),
    ('FARMER',        'Farmer',                 5, 'farmer_id',   '#0F6E56',
     'Farmer app end user. Own data only (BR-36).'),
    ('CUSTOMER',      'Customer',               5, 'customer_id', '#0C447C',
     'Customer app end user. Own data only (BR-36) and a farm-anonymous catalog (BR-16).')
ON CONFLICT (code) DO UPDATE SET
    name            = EXCLUDED.name,
    hierarchy_level = EXCLUDED.hierarchy_level,
    scope_dimension = EXCLUDED.scope_dimension,
    brand_color_hex = EXCLUDED.brand_color_hex,
    summary         = EXCLUDED.summary,
    updated_at      = now();

-- -----------------------------------------------------------------------------
-- Warehouses — BR-23: exactly four, with stable codes
-- -----------------------------------------------------------------------------
INSERT INTO warehouses (code, name, type, address, city, pincode, lat, lng, geom,
                        capacity_kg, is_market_day_venue, market_day_of_week, is_active) VALUES
    ('WH-OOTY', 'Ooty Warehouse',           'MAIN',
     'Ooty Main Bazaar Road, Udhagamandalam', 'Udhagamandalam', '643001',
     11.410200, 76.695000,
     ST_SetSRID(ST_MakePoint(76.695000, 11.410200), 4326)::geography,
     50000.000, false, NULL, true),

    ('WH-COON', 'Coonoor Warehouse',        'SUB',
     'Mount Road, Coonoor', 'Coonoor', '643101',
     11.353000, 76.795900,
     ST_SetSRID(ST_MakePoint(76.795900, 11.353000), 4326)::geography,
     30000.000, false, NULL, true),

    ('WH-KOTA', 'Kotagiri Warehouse',       'SUB',
     'Kookalthorai Road, Kotagiri', 'Kotagiri', '643217',
     11.420400, 76.865600,
     ST_SetSRID(ST_MakePoint(76.865600, 11.420400), 4326)::geography,
     25000.000, false, NULL, true),

    ('WH-GUDA', 'Gudalur Market Warehouse', 'SUB',
     'Gudalur Municipal Market, Ooty Road', 'Gudalur', '643212',
     11.503000, 76.490000,
     ST_SetSRID(ST_MakePoint(76.490000, 11.503000), 4326)::geography,
     25000.000, true, 6, true)
ON CONFLICT (code) DO UPDATE SET
    name                = EXCLUDED.name,
    type                = EXCLUDED.type,
    address             = EXCLUDED.address,
    city                = EXCLUDED.city,
    pincode             = EXCLUDED.pincode,
    lat                 = EXCLUDED.lat,
    lng                 = EXCLUDED.lng,
    geom                = EXCLUDED.geom,
    capacity_kg         = EXCLUDED.capacity_kg,
    is_market_day_venue = EXCLUDED.is_market_day_venue,
    market_day_of_week  = EXCLUDED.market_day_of_week,
    updated_at          = now();

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
INSERT INTO categories (slug, name, sort_order) VALUES
    ('vegetables',     'Vegetables',      1),
    ('fruits',         'Fruits',          2),
    ('grains',         'Grains',          3),
    ('spices',         'Spices',          4),
    ('herbs-greens',   'Herbs & Greens',  5),
    ('dry-goods',      'Dry Goods',       6)
ON CONFLICT (slug) DO UPDATE SET
    name       = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- Grades — Grade 1 / 2 / 3 / Reject
-- -----------------------------------------------------------------------------
INSERT INTO grades (code, name, description, sort_order, is_sellable) VALUES
    ('GRADE_1', 'Grade 1', 'Premium: uniform size, no visible defects, peak freshness.',        1, true),
    ('GRADE_2', 'Grade 2', 'Standard: minor size variation or cosmetic marks, fully edible.',   2, true),
    ('GRADE_3', 'Grade 3', 'Economy: visible blemishes or irregular size, suitable for processing.', 3, true),
    ('REJECT',  'Reject',  'Not fit for sale. Recorded for traceability and farmer feedback only.', 4, false)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order  = EXCLUDED.sort_order,
    is_sellable = EXCLUDED.is_sellable,
    updated_at  = now();

-- -----------------------------------------------------------------------------
-- Rating categories — BR-06: exactly 10, each worth 10 points
-- -----------------------------------------------------------------------------
INSERT INTO rating_categories (code, name, max_points, sort_order) VALUES
    ('CERTIFICATION',     'Certification',      10,  1),
    ('SOIL_LAND',         'Soil & Land',        10,  2),
    ('FARMING_PRACTICES', 'Farming Practices',  10,  3),
    ('ENVIRONMENTAL',     'Environmental',      10,  4),
    ('PRODUCE_QUALITY',   'Produce Quality',    10,  5),
    ('TRACEABILITY',      'Traceability',       10,  6),
    ('SOCIAL_LABOR',      'Social & Labor',     10,  7),
    ('FINANCIAL',         'Financial',          10,  8),
    ('MARKET_RELATIONS',  'Market Relations',   10,  9),
    ('INNOVATION',        'Innovation',         10, 10)
ON CONFLICT (code) DO UPDATE SET
    name       = EXCLUDED.name,
    max_points = EXCLUDED.max_points,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- Rating tiers — BR-04
--
-- The source documents state "max 100 points" AND the bands <650 / 650-700 /
-- 700-749 / 750+ in the same bullet. Both cannot be true. These rows seed the
-- bands EXACTLY as signed off, as data, so that resolving the contradiction is
-- an UPDATE and not a code change (BR-04a). No scoring logic reads them in
-- Track 1 and the scoring endpoint returns 501 (BR-04b).
--
-- Convention: min_score inclusive, max_score exclusive, NULL = unbounded.
-- -----------------------------------------------------------------------------
INSERT INTO rating_tier_config (tier_code, label, min_score, max_score, color_hex, sort_order, effective_from) VALUES
    ('POOR',      'Poor',      0.00,   650.00, '#A32D2D', 1, DATE '2025-01-01'),
    ('MODERATE',  'Moderate',  650.00, 700.00, '#E48932', 2, DATE '2025-01-01'),
    ('GOOD',      'Good',      700.00, 750.00, '#854F0B', 3, DATE '2025-01-01'),
    ('EXCELLENT', 'Excellent', 750.00, NULL,   '#0F6E56', 4, DATE '2025-01-01')
ON CONFLICT (tier_code, effective_from) DO UPDATE SET
    label      = EXCLUDED.label,
    min_score  = EXCLUDED.min_score,
    max_score  = EXCLUDED.max_score,
    color_hex  = EXCLUDED.color_hex,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- Allocation config — BR-12: Online 70 / Live Market 10 / Reserve 10 / Buffer 10
--
-- The four rows must sum to 100 (BR-12b). The deferred constraint trigger
-- checks that at COMMIT, which is why this file is one transaction.
-- Settable by SUPER_ADMIN only.
-- -----------------------------------------------------------------------------
INSERT INTO allocation_config (channel, percentage, effective_from) VALUES
    ('ONLINE',      70.00, DATE '2025-01-01'),
    ('LIVE_MARKET', 10.00, DATE '2025-01-01'),
    ('RESERVE',     10.00, DATE '2025-01-01'),
    ('BUFFER',      10.00, DATE '2025-01-01')
ON CONFLICT (channel, effective_from) WHERE crop_id IS NULL DO UPDATE SET
    percentage = EXCLUDED.percentage,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- System configuration
--
-- Every threshold a business rule says must not be a literal. If a value is
-- here, no service may hard-code it.
-- -----------------------------------------------------------------------------
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('cash_topup_cap',
     '10000.00'::jsonb, 'number',
     'BR-19: maximum rupees for a SINGLE cash top-up. 10000.00 is accepted, 10000.01 is CASH_LIMIT_EXCEEDED. No per-day or per-customer cap exists — neither source document defines one and BR-19 forbids inventing one.'),

    ('counter_offer_window_hours',
     '24'::jsonb, 'number',
     'BR-10: hours a farmer has to answer a counter-offer. counter_offers.expires_at = created_at + this. On expiry the offer LAPSES — it is not a rejection and not an acceptance.'),

    ('max_counter_rounds',
     '3'::jsonb, 'number',
     'BR-11: how many times the farmer may counter back after the admin opening counter. Round 1 is the admin offer, so rounds run 1..(this + 1). A 4th farmer counter is COUNTER_LIMIT_REACHED.'),

    ('free_tier_listing_limit',
     '5'::jsonb, 'number',
     'BR-14b: free-tier listing cap. WARNING — neither source document defines free-tier limits. This value is a placeholder for the client to confirm and is NOT enforced while free_tier_limits_enabled is false.'),

    ('free_tier_limits_enabled',
     'false'::jsonb, 'boolean',
     'BR-14b: the free-tier gate is a single named check that ships DISABLED. Turning it on is a deliberate client decision, not a deployment side effect.'),

    ('delivery_fee',
     '40.00'::jsonb, 'number',
     'Flat delivery fee in rupees. Modelled only — Track 1 is pickup-only (BR-21, contradiction 3).'),

    ('free_delivery_threshold',
     '500.00'::jsonb, 'number',
     'Order subtotal at or above which delivery_fee is waived. Modelled only — see BR-21.'),

    ('subscription_fee',
     '500.00'::jsonb, 'number',
     'BR-14a: farmer subscription in rupees. Read from config, never a literal.'),

    ('subscription_period_months',
     '12'::jsonb, 'number',
     'BR-14a: subscription period. Rs 500 per YEAR.'),

    ('cart_lock_hours',
     '24'::jsonb, 'number',
     'BR-22: how long a cart line holds stock against the ONLINE allocation bucket before the release job returns it.'),

    ('payout_dual_approval_threshold',
     '10000.00'::jsonb, 'number',
     'BR-31c: payouts STRICTLY ABOVE this need a second, distinct SUPER_ADMIN approval. Exactly 10000.00 follows the single-approval path.'),

    ('otp_length',
     '6'::jsonb, 'number',
     'BR-32: authentication OTP digits. The handover OTP (BR-20) is 4 digits and is configured separately.'),

    ('otp_resend_seconds',
     '60'::jsonb, 'number',
     'BR-32b: minimum seconds between sends. A resend at 59s is OTP_RESEND_TOO_SOON.'),

    ('otp_max_attempts',
     '3'::jsonb, 'number',
     'BR-32a: failed verifications before the challenge locks. The 4th wrong attempt is OTP_LOCKED and the challenge stays dead even for the correct code.'),

    ('handover_otp_length',
     '4'::jsonb, 'number',
     'BR-20: digits in the order handover OTP. Held by the customer; the verifying admin never receives the value.'),

    ('rating_scale_max',
     'null'::jsonb, 'number',
     'BR-04 / contradiction 1: the audit rating scale is UNRESOLVED (100 vs 750+ tiers). Deliberately null. No code may assume a scale until the client answers; the scoring endpoint returns 501.'),

    ('low_stock_threshold_kg',
     '50'::jsonb, 'number',
     'S-28 specification gap: no source document defines a low-stock threshold. 50 kg is a placeholder. The admin inventory screen reads this key from system_config — it is NOT a literal in the component. The client must confirm the correct value.')
ON CONFLICT (key) DO UPDATE SET
    value       = EXCLUDED.value,
    data_type   = EXCLUDED.data_type,
    description = EXCLUDED.description,
    updated_at  = now();

-- -----------------------------------------------------------------------------
-- Crop master — Nilgiris-appropriate crops
-- -----------------------------------------------------------------------------
INSERT INTO crop_master (slug, name, category_id, botanical_name, season_months, shelf_life_days)
SELECT c.slug, c.name, cat.id, c.botanical_name, c.season_months, c.shelf_life_days
FROM (VALUES
    -- Vegetables ---------------------------------------------------------------
    ('carrot',        'Carrot',        'vegetables',   'Daucus carota',            ARRAY[1,2,3,9,10,11,12]::smallint[],  21),
    ('potato',        'Potato',        'vegetables',   'Solanum tuberosum',        ARRAY[1,2,6,7,8,12]::smallint[],      60),
    ('cabbage',       'Cabbage',       'vegetables',   'Brassica oleracea var. capitata', ARRAY[1,2,3,10,11,12]::smallint[], 21),
    ('cauliflower',   'Cauliflower',   'vegetables',   'Brassica oleracea var. botrytis', ARRAY[1,2,10,11,12]::smallint[],   14),
    ('beetroot',      'Beetroot',      'vegetables',   'Beta vulgaris',            ARRAY[1,2,3,9,10,11,12]::smallint[],  30),
    ('radish',        'Radish',        'vegetables',   'Raphanus sativus',         ARRAY[1,2,3,10,11,12]::smallint[],    10),
    ('garlic',        'Garlic',        'vegetables',   'Allium sativum',           ARRAY[3,4,5,11,12]::smallint[],      120),
    ('leek',          'Leek',          'vegetables',   'Allium ampeloprasum',      ARRAY[1,2,11,12]::smallint[],         14),
    ('celery',        'Celery',        'vegetables',   'Apium graveolens',         ARRAY[1,2,3,11,12]::smallint[],       14),
    ('lettuce',       'Lettuce',       'vegetables',   'Lactuca sativa',           ARRAY[1,2,3,10,11,12]::smallint[],     7),
    ('broccoli',      'Broccoli',      'vegetables',   'Brassica oleracea var. italica', ARRAY[1,2,11,12]::smallint[],    10),
    ('peas',          'Peas',          'vegetables',   'Pisum sativum',            ARRAY[1,2,3,11,12]::smallint[],       10),
    ('beans',         'Beans',         'vegetables',   'Phaseolus vulgaris',       ARRAY[3,4,5,6,9,10]::smallint[],       8),
    ('spinach',       'Spinach',       'vegetables',   'Spinacia oleracea',        ARRAY[1,2,3,10,11,12]::smallint[],     5),

    -- Herbs & Greens -----------------------------------------------------------
    ('coriander',     'Coriander',     'herbs-greens', 'Coriandrum sativum',       ARRAY[1,2,3,4,10,11,12]::smallint[],   5),
    ('mint',          'Mint',          'herbs-greens', 'Mentha spicata',           ARRAY[3,4,5,6,7,8,9]::smallint[],      5),

    -- Fruits -------------------------------------------------------------------
    ('avocado',       'Avocado',       'fruits',       'Persea americana',         ARRAY[8,9,10,11]::smallint[],         14),
    ('plum',          'Plum',          'fruits',       'Prunus domestica',         ARRAY[4,5,6]::smallint[],              7),
    ('peach',         'Peach',         'fruits',       'Prunus persica',           ARRAY[4,5,6]::smallint[],              7),
    ('pear',          'Pear',          'fruits',       'Pyrus communis',           ARRAY[6,7,8]::smallint[],             14),
    ('passion-fruit', 'Passion Fruit', 'fruits',       'Passiflora edulis',        ARRAY[6,7,8,9,10]::smallint[],        14),
    ('strawberry',    'Strawberry',    'fruits',       'Fragaria x ananassa',      ARRAY[1,2,3,11,12]::smallint[],        5),
    ('orange',        'Orange',        'fruits',       'Citrus sinensis',          ARRAY[11,12,1,2]::smallint[],         21),
    ('banana',        'Banana',        'fruits',       'Musa acuminata',           ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[], 7),

    -- Spices -------------------------------------------------------------------
    ('pepper',        'Black Pepper',  'spices',       'Piper nigrum',             ARRAY[11,12,1,2]::smallint[],        365),
    ('cardamom',      'Cardamom',      'spices',       'Elettaria cardamomum',     ARRAY[8,9,10,11]::smallint[],        365),

    -- Grains -------------------------------------------------------------------
    ('millet',        'Finger Millet', 'grains',       'Eleusine coracana',        ARRAY[9,10,11]::smallint[],          365),
    ('rajma',         'Rajma',         'grains',       'Phaseolus vulgaris',       ARRAY[9,10,11]::smallint[],          365),

    -- Dry Goods ----------------------------------------------------------------
    ('tea',           'Tea',           'dry-goods',    'Camellia sinensis',        ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[], 730),
    ('coffee',        'Coffee',        'dry-goods',    'Coffea arabica',           ARRAY[11,12,1,2]::smallint[],        365)
) AS c(slug, name, category_slug, botanical_name, season_months, shelf_life_days)
JOIN categories cat ON cat.slug = c.category_slug
ON CONFLICT (slug) DO UPDATE SET
    name            = EXCLUDED.name,
    category_id     = EXCLUDED.category_id,
    botanical_name  = EXCLUDED.botanical_name,
    season_months   = EXCLUDED.season_months,
    shelf_life_days = EXCLUDED.shelf_life_days,
    updated_at      = now();

-- -----------------------------------------------------------------------------
-- Notification Templates — BR-38a: 11 golden-thread transactional events in en & ta
-- -----------------------------------------------------------------------------
INSERT INTO notification_templates (code, channel, locale, subject, body_template, is_active) VALUES
    ('FARMER_APP_APPROVED', 'IN_APP', 'en', 'Application Approved', 'Welcome to TOHFA! Your farmer registration {{applicationId}} has been approved with ID {{tohfaFarmerId}}.', true),
    ('FARMER_APP_APPROVED', 'IN_APP', 'ta', 'விண்ணப்பம் ஏற்கப்பட்டது', 'தோஹ்பா தளத்திற்கு வரவேற்கிறோம்! உங்கள் பதிவு {{applicationId}} அடையாள எண் {{tohfaFarmerId}} உடன் ஏற்கப்பட்டது.', true),

    ('FARMER_APP_REJECTED', 'IN_APP', 'en', 'Application Rejected', 'Your registration application {{applicationId}} was not approved. Reason: {{reason}}.', true),
    ('FARMER_APP_REJECTED', 'IN_APP', 'ta', 'விண்ணப்பம் நிராகரிக்கப்பட்டது', 'உங்கள் பதிவு விண்ணப்பம் {{applicationId}} நிராகரிக்கப்பட்டது. காரணம்: {{reason}}.', true),

    ('FARMER_APP_INFO_REQUESTED', 'IN_APP', 'en', 'Information Requested', 'Additional information requested for application {{applicationId}}: {{message}}.', true),
    ('FARMER_APP_INFO_REQUESTED', 'IN_APP', 'ta', 'கூடுதல் தகவல் தேவை', 'விண்ணப்பம் {{applicationId}} தொடர்பான கூடுதல் தகவல் தேவை: {{message}}.', true),

    ('COUNTER_OFFER_RECEIVED', 'IN_APP', 'en', 'Counter-Offer Received', 'A counter-offer of ₹{{offerPrice}}/kg was received for your listing {{listingId}} (original: ₹{{originalPrice}}/kg).', true),
    ('COUNTER_OFFER_RECEIVED', 'IN_APP', 'ta', 'மறு விலை பெறப்பட்டது', 'உங்கள் பட்டியல் {{listingId}}-க்கு ₹{{offerPrice}}/கிலோ மறு விலை பெறப்பட்டது (அசல் விலை: ₹{{originalPrice}}/கிலோ).', true),

    ('COUNTER_OFFER_EXPIRING', 'IN_APP', 'en', 'Counter-Offer Expiring Soon', 'Counter-offer for listing {{listingId}} expires in {{hoursRemaining}} hours.', true),
    ('COUNTER_OFFER_EXPIRING', 'IN_APP', 'ta', 'மறு விலை விரைவில் காலாவதியாகிறது', 'பட்டியல் {{listingId}}-க்கான மறு விலை {{hoursRemaining}} மணி நேரத்தில் காலாவதியாகிறது.', true),

    ('GOODS_RECEIVED', 'IN_APP', 'en', 'Goods Received (GRN)', 'GRN {{grnNumber}} generated for {{quantityKg}} kg of {{produceName}}.', true),
    ('GOODS_RECEIVED', 'IN_APP', 'ta', 'பொருட்கள் பெறப்பட்டன (GRN)', '{{produceName}} {{quantityKg}} கிலோவிற்கு GRN {{grnNumber}} உருவாக்கப்பட்டது.', true),

    ('PAYOUT_RELEASED', 'IN_APP', 'en', 'Payout Released', 'Payout of ₹{{amount}} released to your bank account (Ref: {{reference}}).', true),
    ('PAYOUT_RELEASED', 'IN_APP', 'ta', 'பணம் விடுவிக்கப்பட்டது', 'உங்கள் வங்கிக் கணக்கிற்கு ₹{{amount}} பணம் அனுப்பப்பட்டது (குறிப்பு: {{reference}}).', true),

    ('ORDER_CONFIRMED', 'IN_APP', 'en', 'Order Confirmed', 'Order #{{orderNumber}} confirmed for ₹{{totalAmount}}.', true),
    ('ORDER_CONFIRMED', 'IN_APP', 'ta', 'ஆர்டர் உறுதிசெய்யப்பட்டது', 'ஆர்டர் #{{orderNumber}} ₹{{totalAmount}}-க்கு உறுதிசெய்யப்பட்டது.', true),

    ('ORDER_DISPATCHED', 'IN_APP', 'en', 'Order Dispatched', 'Order #{{orderNumber}} is on its way.', true),
    ('ORDER_DISPATCHED', 'IN_APP', 'ta', 'ஆர்டர் அனுப்பப்பட்டது', 'ஆர்டர் #{{orderNumber}} அனுப்பப்பட்டுள்ளது.', true),

    ('ORDER_DELIVERED', 'IN_APP', 'en', 'Order Delivered', 'Order #{{orderNumber}} has been delivered.', true),
    ('ORDER_DELIVERED', 'IN_APP', 'ta', 'ஆர்டர் டெலிவரி செய்யப்பட்டது', 'ஆர்டர் #{{orderNumber}} டெலிவரி செய்யப்பட்டது.', true),

    ('WALLET_CREDITED', 'IN_APP', 'en', 'Wallet Credited', '₹{{amount}} credited to your wallet (Ref: {{reference}}). Current balance: ₹{{balance}}.', true),
    ('WALLET_CREDITED', 'IN_APP', 'ta', 'வாலட்டில் பணம் சேர்க்கப்பட்டது', 'உங்கள் வாலட்டில் ₹{{amount}} சேர்க்கப்பட்டது (குறிப்பு: {{reference}}). இருப்பு: ₹{{balance}}.', true)
ON CONFLICT (code, channel, locale) DO UPDATE SET
    subject       = EXCLUDED.subject,
    body_template = EXCLUDED.body_template,
    is_active     = EXCLUDED.is_active,
    updated_at    = now();

-- -----------------------------------------------------------------------------
-- Sanity checks. A seed that silently produced 3 warehouses would break BR-30
-- scoping in a way nobody notices until a Sub Warehouse Admin sees nothing.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_roles      integer;
    v_warehouses integer;
    v_categories integer;
    v_grades     integer;
    v_rating_cat integer;
    v_alloc      numeric;
    v_crops      integer;
BEGIN
    SELECT count(*) INTO v_roles      FROM roles;
    SELECT count(*) INTO v_warehouses FROM warehouses;
    SELECT count(*) INTO v_categories FROM categories;
    SELECT count(*) INTO v_grades     FROM grades;
    SELECT count(*) INTO v_rating_cat FROM rating_categories;
    SELECT count(*) INTO v_crops      FROM crop_master;
    SELECT COALESCE(SUM(percentage), 0) INTO v_alloc
      FROM allocation_config WHERE effective_from = DATE '2025-01-01';

    IF v_roles      <> 7  THEN RAISE EXCEPTION 'seed: expected 7 roles, found %', v_roles; END IF;
    IF v_warehouses <> 4  THEN RAISE EXCEPTION 'BR-23: expected 4 warehouses, found %', v_warehouses; END IF;
    IF v_categories <> 6  THEN RAISE EXCEPTION 'seed: expected 6 categories, found %', v_categories; END IF;
    IF v_grades     <> 4  THEN RAISE EXCEPTION 'seed: expected 4 grades, found %', v_grades; END IF;
    IF v_rating_cat <> 10 THEN RAISE EXCEPTION 'BR-06: expected 10 rating categories, found %', v_rating_cat; END IF;
    IF v_alloc      <> 100 THEN RAISE EXCEPTION 'BR-12b: allocation percentages sum to %, must be 100', v_alloc; END IF;
    IF v_crops      < 30  THEN RAISE EXCEPTION 'seed: expected at least 30 crops, found %', v_crops; END IF;

    RAISE NOTICE 'seed 001: % roles, % warehouses, % categories, % grades, % rating categories, % crops, allocation sum %',
        v_roles, v_warehouses, v_categories, v_grades, v_rating_cat, v_crops, v_alloc;
END
$$;

COMMIT;
