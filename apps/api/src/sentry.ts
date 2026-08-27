import { config } from './config.js';
import { logger } from './logger.js';

export interface SentryScrubTarget {
  otp?: unknown;
  password?: unknown;
  token?: unknown;
  refreshToken?: unknown;
  accessToken?: unknown;
  aadhaar?: unknown;
  aadhaarLast4?: unknown;
  body?: unknown;
  authorization?: unknown;
  [key: string]: unknown;
}

/**
 * Sensitive fields that must NEVER be sent to Sentry or external loggers.
 */
const SENSITIVE_KEYS = new Set([
  'otp',
  'password',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'aadhaar',
  'aadhaarlast4',
  'secret',
  'creditcard',
]);

/**
 * Deeply scrubs object properties matching sensitive key names.
 */
export function scrubSensitiveData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => scrubSensitiveData(item)) as unknown as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      cleaned[key] = '[SCRUBBED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = scrubSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

/**
 * Captures an exception and reports to Sentry if DSN is configured.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const scrubbedContext = context ? scrubSensitiveData(context) : undefined;

  if (config.SENTRY_DSN && config.SENTRY_DSN.length > 0) {
    logger.info({ context: scrubbedContext }, 'Sentry exception captured (simulated)');
  } else {
    logger.warn({ err: error, context: scrubbedContext }, 'Unhandled exception (Sentry disabled)');
  }
}
