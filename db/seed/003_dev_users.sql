-- =============================================================================
-- 003_dev_users.sql — Seed administrative and test users for local development
--
-- All accounts have password: Password@123
-- Hash: $2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi
-- =============================================================================

INSERT INTO users (
    id, mobile, email, password_hash, full_name, preferred_locale, user_type, status
)
VALUES
    -- 1. Super Admin
    (
        '00000000-0000-0000-0000-000000000001',
        '+919800000001',
        'superadmin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Super Administrator',
        'en',
        'ADMIN',
        'ACTIVE'
    ),
    -- 2. Tohfa Admin
    (
        '00000000-0000-0000-0000-000000000002',
        '+919800000002',
        'admin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Tohfa Platform Admin',
        'en',
        'ADMIN',
        'ACTIVE'
    ),
    -- 3. Farmer Admin (Read-only queue reviewer)
    (
        '00000000-0000-0000-0000-000000000003',
        '+919800000003',
        'farmeradmin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Farmer Desk Admin',
        'ta',
        'ADMIN',
        'ACTIVE'
    ),
    -- 4. Multi-Role Admin (Has both TOHFA_ADMIN and FARMER_ADMIN)
    (
        '00000000-0000-0000-0000-000000000004',
        '+919800000004',
        'multirole@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Operations Manager (Multi-Role)',
        'en',
        'ADMIN',
        'ACTIVE'
    )
ON CONFLICT (id) DO UPDATE
    SET mobile = EXCLUDED.mobile,
        password_hash = EXCLUDED.password_hash,
        status = 'ACTIVE',
        user_type = EXCLUDED.user_type,
        full_name = EXCLUDED.full_name;

-- Assign Roles
INSERT INTO user_roles (user_id, role_id, role_code)
VALUES
    -- Super Admin
    (
        '00000000-0000-0000-0000-000000000001',
        (SELECT id FROM roles WHERE code = 'SUPER_ADMIN'),
        'SUPER_ADMIN'
    ),
    -- Tohfa Admin
    (
        '00000000-0000-0000-0000-000000000002',
        (SELECT id FROM roles WHERE code = 'TOHFA_ADMIN'),
        'TOHFA_ADMIN'
    ),
    -- Farmer Admin
    (
        '00000000-0000-0000-0000-000000000003',
        (SELECT id FROM roles WHERE code = 'FARMER_ADMIN'),
        'FARMER_ADMIN'
    ),
    -- Multi-Role User (TOHFA_ADMIN)
    (
        '00000000-0000-0000-0000-000000000004',
        (SELECT id FROM roles WHERE code = 'TOHFA_ADMIN'),
        'TOHFA_ADMIN'
    ),
    -- Multi-Role User (FARMER_ADMIN)
    (
        '00000000-0000-0000-0000-000000000004',
        (SELECT id FROM roles WHERE code = 'FARMER_ADMIN'),
        'FARMER_ADMIN'
    )
ON CONFLICT (user_id, role_id, COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE valid_to IS NULL
DO NOTHING;
