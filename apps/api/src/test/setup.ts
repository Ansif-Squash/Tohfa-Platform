/**
 * Vitest global setup. Runs once per test file (see vitest.config.ts).
 *
 * The point of this file is that a unit test must NEVER need a running
 * Postgres, Redis or a populated .env. We supply the minimum viable
 * environment here; tests that genuinely need a database opt in explicitly via
 * `describeIfDatabase` in factories.ts.
 */
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] ??= 'silent';
process.env['JWT_SECRET'] ??= 'test-secret-value-that-is-long-enough-32';
process.env['DATABASE_URL'] ??= 'postgres://tohfa:tohfa@localhost:5432/tohfa_test';
process.env['REDIS_URL'] ??= 'redis://localhost:6379';
process.env['PAYMENT_PROVIDER'] ??= 'mock';
process.env['SMS_PROVIDER'] ??= 'mock';
