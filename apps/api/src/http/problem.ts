/**
 * RFC 9457 problem+json construction.
 *
 * There is exactly ONE way to fail a request in this codebase: throw an
 * `AppError`. The error middleware turns it into `application/problem+json`.
 * Never `res.status(400).json({ message })` — clients switch on `code`, and an
 * ad-hoc shape breaks every one of them.
 */
import { type ErrorCode, type Problem, type ProblemCode } from '@tohfa/shared-types';
import { currentTraceId } from '../logger.js';

/** Stable URI namespace for problem types. Do not change once published. */
export const PROBLEM_TYPE_BASE = 'https://docs.tohfa.in/problems';

export function problemType(code: ProblemCode): string {
  return `${PROBLEM_TYPE_BASE}/${code.toLowerCase().replace(/_/g, '-')}`;
}

export interface AppErrorOptions {
  status?: number;
  detail?: string;
  /** Field-level failures keyed by dotted path, e.g. `{ 'body.pricePerKg': [...] }`. */
  errors?: Record<string, string[]>;
  /** Extra machine-readable context clients may use, e.g. `{ ceiling: '120.00' }`. */
  meta?: Record<string, unknown>;
  /** Original error, logged but never serialised to the client. */
  cause?: unknown;
}

/**
 * Default HTTP status for each domain error code. Handlers may override via
 * `options.status`, but the default should be right often enough that they
 * rarely need to.
 */
const DEFAULT_STATUS: Record<ProblemCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,

  CERT_EXPIRED: 409,
  CERT_UNVERIFIED: 409,
  PRICE_ABOVE_CEILING: 422,
  RETAIL_ABOVE_CEILING: 422,
  FREE_TIER_LIMIT: 402,
  COUNTER_LIMIT_REACHED: 409,
  COUNTER_OFFER_EXPIRED: 409,
  LISTING_NOT_PENDING: 409,
  SELF_APPROVAL_FORBIDDEN: 403,
  WAREHOUSE_SCOPE_VIOLATION: 403,
  WAREHOUSE_REQUIRED: 422,
  WALLET_INSUFFICIENT: 402,
  CASH_LIMIT_EXCEEDED: 422,
  FISCAL_TAG_REQUIRED: 422,
  DUAL_APPROVAL_REQUIRED: 403,
  SAME_ACTOR_APPROVAL: 403,
  STOCK_UNAVAILABLE: 409,
  INSUFFICIENT_ALLOCATION: 409,
  ALLOCATION_SUM_INVALID: 422,
  CART_LOCK_EXPIRED: 410,
  OTP_INVALID: 422,
  OTP_EXPIRED: 410,
  OTP_LOCKED: 429,
  OTP_RESEND_TOO_SOON: 429,
  AUDIT_QUARTER_TAKEN: 409,
  SCORE_OUT_OF_RANGE: 422,
  FIELD_LOCKED: 403,
  INVALID_STATE_TRANSITION: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
};

/** Short, stable, human-readable titles. Localisation happens client-side. */
const DEFAULT_TITLE: Record<ProblemCode, string> = {
  BAD_REQUEST: 'Malformed request',
  VALIDATION_FAILED: 'Request validation failed',
  UNAUTHENTICATED: 'Authentication required',
  FORBIDDEN: 'Not permitted',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Conflicting request',
  RATE_LIMITED: 'Too many requests',
  INTERNAL: 'Internal server error',

  CERT_EXPIRED: 'Certification has expired',
  CERT_UNVERIFIED: 'Certification is not verified',
  PRICE_ABOVE_CEILING: 'Price exceeds the fair price ceiling',
  RETAIL_ABOVE_CEILING: 'Retail price exceeds the fair price ceiling',
  FREE_TIER_LIMIT: 'Free tier limit reached',
  COUNTER_LIMIT_REACHED: 'No counter-offer rounds remain',
  COUNTER_OFFER_EXPIRED: 'Counter-offer has expired',
  LISTING_NOT_PENDING: 'Listing is not pending review',
  SELF_APPROVAL_FORBIDDEN: 'You cannot approve your own submission',
  WAREHOUSE_SCOPE_VIOLATION: 'Outside your assigned scope',
  WAREHOUSE_REQUIRED: 'A warehouse assignment is required',
  WALLET_INSUFFICIENT: 'Insufficient wallet balance',
  CASH_LIMIT_EXCEEDED: 'Cash top-up cap exceeded',
  FISCAL_TAG_REQUIRED: 'Fiscal cash tag is required',
  DUAL_APPROVAL_REQUIRED: 'A second approver is required',
  SAME_ACTOR_APPROVAL: 'You cannot approve what you initiated',
  STOCK_UNAVAILABLE: 'Requested stock is unavailable',
  INSUFFICIENT_ALLOCATION: 'Channel allocation exhausted',
  ALLOCATION_SUM_INVALID: 'Allocation percentages must sum to 100',
  CART_LOCK_EXPIRED: 'Cart reservation expired',
  OTP_INVALID: 'Invalid OTP',
  OTP_EXPIRED: 'OTP has expired',
  OTP_LOCKED: 'OTP challenge is locked',
  OTP_RESEND_TOO_SOON: 'OTP resend requested too soon',
  AUDIT_QUARTER_TAKEN: 'That quarter already has an audit',
  SCORE_OUT_OF_RANGE: 'Score is outside the allowed range',
  FIELD_LOCKED: 'That field is locked',
  INVALID_STATE_TRANSITION: 'Invalid state transition',
  IDEMPOTENCY_KEY_REUSED: 'Idempotency key reused with a different body',
};

/**
 * The only error type application code should throw.
 *
 * ```ts
 * throw new AppError('PRICE_ABOVE_CEILING', {
 *   detail: 'Asking price 145.00 exceeds the 120.00 ceiling for Carrot / Grade A.',
 *   meta: { ceiling: '120.00', asking: '145.00' },
 * });
 * ```
 */
export class AppError extends Error {
  readonly code: ProblemCode;
  readonly status: number;
  readonly detail: string | undefined;
  readonly errors: Record<string, string[]> | undefined;
  readonly meta: Record<string, unknown> | undefined;

  constructor(code: ProblemCode, options: AppErrorOptions = {}) {
    super(options.detail ?? DEFAULT_TITLE[code]);
    this.name = 'AppError';
    this.code = code;
    this.status = options.status ?? DEFAULT_STATUS[code];
    this.detail = options.detail;
    this.errors = options.errors;
    this.meta = options.meta;
    if (options.cause !== undefined) {
      // `cause` is standard on Error in ES2022 but not in the lib typings path
      // we use, so assign it explicitly.
      Object.defineProperty(this, 'cause', { value: options.cause, enumerable: false });
    }
    Error.captureStackTrace?.(this, AppError);
  }

  /** Convenience for the very common domain-error case. */
  static domain(code: ErrorCode, options: AppErrorOptions = {}): AppError {
    return new AppError(code, options);
  }

  toProblem(instance?: string): Problem {
    const traceId = currentTraceId();
    return {
      type: problemType(this.code),
      title: DEFAULT_TITLE[this.code],
      status: this.status,
      code: this.code,
      ...(this.detail === undefined ? {} : { detail: this.detail }),
      ...(instance === undefined ? {} : { instance }),
      ...(this.errors === undefined ? {} : { errors: this.errors }),
      ...(this.meta === undefined ? {} : { meta: this.meta }),
      ...(traceId === undefined ? {} : { traceId }),
    };
  }
}

/** Build a Problem for something that is not an AppError (last-resort 500). */
export function internalProblem(instance?: string): Problem {
  const traceId = currentTraceId();
  return {
    type: problemType('INTERNAL'),
    title: DEFAULT_TITLE.INTERNAL,
    status: 500,
    code: 'INTERNAL',
    ...(instance === undefined ? {} : { instance }),
    ...(traceId === undefined ? {} : { traceId }),
  };
}

export const notFound = (detail?: string): AppError =>
  new AppError('NOT_FOUND', detail === undefined ? {} : { detail });

export const forbidden = (detail?: string): AppError =>
  new AppError('FORBIDDEN', detail === undefined ? {} : { detail });

export const unauthenticated = (detail?: string): AppError =>
  new AppError('UNAUTHENTICATED', detail === undefined ? {} : { detail });
