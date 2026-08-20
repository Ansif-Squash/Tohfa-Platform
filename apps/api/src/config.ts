/**
 * Boot-time configuration.
 *
 * Every environment variable the API reads is declared and validated HERE and
 * nowhere else. `process.env` must never be touched outside this file — that
 * way a missing variable is a loud crash at boot instead of an `undefined`
 * surfacing three weeks later inside a payout job.
 */
import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';
import { z } from 'zod';
import { REPO_ROOT } from './paths.js';

loadDotenv({ path: join(REPO_ROOT, '.env') });

const csv = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );

const intFromEnv = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: intFromEnv(1, 65535).default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  JWT_REFRESH_TTL: z.string().min(1).default('30d'),

  AZURE_STORAGE_CONNECTION_STRING: z.string().default(''),
  AZURE_BLOB_CONTAINER: z.string().default('tohfa-media'),

  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  RAZORPAYX_ACCOUNT: z.string().default(''),
  PAYMENT_PROVIDER: z.enum(['mock', 'razorpay']).default('mock'),

  SMS_PROVIDER: z.enum(['mock', 'msg91', 'twilio']).default('mock'),
  MSG91_AUTH_KEY: z.string().default(''),
  FCM_SERVER_KEY: z.string().default(''),
  SENTRY_DSN: z.string().default(''),

  OTP_LENGTH: intFromEnv(4, 8).default(6),
  OTP_TTL_SECONDS: intFromEnv(30, 3600).default(300),
  OTP_MAX_ATTEMPTS: intFromEnv(1, 20).default(5),
  OTP_RESEND_SECONDS: intFromEnv(0, 3600).default(30),

  CORS_ORIGINS: csv.default('http://localhost:4200'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type Config = z.infer<typeof envSchema> & {
  readonly isProduction: boolean;
  readonly isTest: boolean;
};

function load(): Config {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    // Deliberately not the logger: the logger itself depends on this config.
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }

  const value = parsed.data;

  // Fail loudly rather than silently falling back to mocks in production.
  if (value.NODE_ENV === 'production') {
    if (value.PAYMENT_PROVIDER === 'mock') {
      throw new Error('PAYMENT_PROVIDER=mock is not allowed when NODE_ENV=production');
    }
    if (value.SMS_PROVIDER === 'mock') {
      throw new Error('SMS_PROVIDER=mock is not allowed when NODE_ENV=production');
    }
  }

  return {
    ...value,
    isProduction: value.NODE_ENV === 'production',
    isTest: value.NODE_ENV === 'test',
  };
}

export const config: Config = load();
