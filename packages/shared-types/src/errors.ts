/**
 * Error contract shared by the API and all three clients.
 *
 * Every failure the API returns carries a stable machine-readable `code` from
 * the `ErrorCode` union below. Clients switch on `code` — never on `title` or
 * `detail`, which are human-facing and localisable.
 *
 * The wire format is RFC 9457 `application/problem+json`.
 *
 * CODE NAMES ARE NOT FREE CHOICE: every code named in a `docs/rules.md` test
 * contract (`code: X`) must exist here under exactly that name. `pnpm spec:drift`
 * checks the OpenAPI side of the same contract.
 */

export const ErrorCode = {
  /** The farm's certification lapsed; listing/sale under that claim is blocked. */
  CERT_EXPIRED: 'CERT_EXPIRED',
  /** Certificate document exists but has not been verified by an admin. */
  CERT_UNVERIFIED: 'CERT_UNVERIFIED',
  /** Asking price exceeds the Super-Admin-set fair price ceiling for the crop. */
  PRICE_ABOVE_CEILING: 'PRICE_ABOVE_CEILING',
  /** Customer-facing retail price exceeds the ceiling for that crop + grade. */
  RETAIL_ABOVE_CEILING: 'RETAIL_ABOVE_CEILING',
  /** Actor is on the free tier and hit the listing/order quota. */
  FREE_TIER_LIMIT: 'FREE_TIER_LIMIT',
  /** No counter-offer rounds remain for this listing. */
  COUNTER_LIMIT_REACHED: 'COUNTER_LIMIT_REACHED',
  /** The counter-offer's response window has passed. */
  COUNTER_OFFER_EXPIRED: 'COUNTER_OFFER_EXPIRED',
  /** Listing is not in PENDING, so it cannot be approved/rejected/countered. */
  LISTING_NOT_PENDING: 'LISTING_NOT_PENDING',
  /** An actor tried to approve their own submission (auto-route instead). */
  SELF_APPROVAL_FORBIDDEN: 'SELF_APPROVAL_FORBIDDEN',
  /** Actor attempted to act outside their assigned warehouse/zone scope. */
  WAREHOUSE_SCOPE_VIOLATION: 'WAREHOUSE_SCOPE_VIOLATION',
  /** A warehouse-scoped role was created or used without a warehouse id. */
  WAREHOUSE_REQUIRED: 'WAREHOUSE_REQUIRED',
  /** Wallet balance is below the requested debit. */
  WALLET_INSUFFICIENT: 'WALLET_INSUFFICIENT',
  /** Cash top-up would breach the per-transaction cash ceiling. */
  CASH_LIMIT_EXCEEDED: 'CASH_LIMIT_EXCEEDED',
  /** A cash top-up was submitted without its fiscal cash tag. */
  FISCAL_TAG_REQUIRED: 'FISCAL_TAG_REQUIRED',
  /** Amount crosses the threshold requiring a second, different approver. */
  DUAL_APPROVAL_REQUIRED: 'DUAL_APPROVAL_REQUIRED',
  /** The approver of a payout is also its initiator. */
  SAME_ACTOR_APPROVAL: 'SAME_ACTOR_APPROVAL',
  /** Requested quantity is not physically available in the batch. */
  STOCK_UNAVAILABLE: 'STOCK_UNAVAILABLE',
  /** Requested quantity exceeds the channel's allocation percentage. */
  INSUFFICIENT_ALLOCATION: 'INSUFFICIENT_ALLOCATION',
  /** Saved channel allocation percentages do not sum to exactly 100. */
  ALLOCATION_SUM_INVALID: 'ALLOCATION_SUM_INVALID',
  /** The cart's stock reservation lock lapsed before checkout completed. */
  CART_LOCK_EXPIRED: 'CART_LOCK_EXPIRED',
  /** The supplied OTP did not match the challenge. */
  OTP_INVALID: 'OTP_INVALID',
  /** The OTP challenge is past its validity window. */
  OTP_EXPIRED: 'OTP_EXPIRED',
  /** Three failed attempts; the challenge is locked and a new one is required. */
  OTP_LOCKED: 'OTP_LOCKED',
  /** A resend was requested inside the 60-second window. */
  OTP_RESEND_TOO_SOON: 'OTP_RESEND_TOO_SOON',
  /** A second audit was scheduled for a quarter that already has one. */
  AUDIT_QUARTER_TAKEN: 'AUDIT_QUARTER_TAKEN',
  /** A rating/audit category score falls outside its allowed range. */
  SCORE_OUT_OF_RANGE: 'SCORE_OUT_OF_RANGE',
  /** A field only a Super Admin may change (Aadhaar, mobile) was submitted. */
  FIELD_LOCKED: 'FIELD_LOCKED',
  /** Requested state transition is not legal from the current state. */
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  /** Idempotency-Key seen before with a different request body. */
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Transport-level codes that are not domain rules. Kept as a named union so
 * `docs/openapi.yaml`'s `Problem` description can be checked against this file
 * by `pnpm spec:drift`.
 */
export const GenericProblemCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export type GenericProblemCode = (typeof GenericProblemCode)[keyof typeof GenericProblemCode];

export const errorCodeValues: readonly ErrorCode[] = Object.values(ErrorCode);

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ErrorCode, value);
}

/**
 * RFC 9457 problem detail, plus TOHFA extensions.
 *
 * `type`     stable URI identifying the problem class.
 * `title`    short, human readable, does not change per occurrence.
 * `status`   HTTP status code, duplicated in the body on purpose.
 * `detail`   occurrence-specific explanation. Safe to show to staff, not
 *            necessarily to end users.
 * `instance` the request path that produced it.
 * `code`     TOHFA machine code — THE field clients branch on.
 * `errors`   field-level validation failures, keyed by dotted JSON pointer.
 * `traceId`  correlation id, echoed from the `x-correlation-id` header.
 */
export interface Problem {
  type: string;
  title: string;
  status: number;
  code: ErrorCode | GenericProblemCode;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  /** Extra, problem-specific context (e.g. `{ ceilingPaise: 12000 }`). */
  meta?: Record<string, unknown>;
}

export type ProblemCode = Problem['code'];
