/**
 * Sentry integration (S-20).
 *
 * `config.SENTRY_DSN` is the switch: when empty (the default), nothing is
 * initialised and `reportError` no-ops, so dev/CI are offline. When set, we
 * initialise the SDK for the API and the BullMQ worker, tagging every report
 * with `environment` and `traceId` (the y correlation id).
 *
 * Privacy is the hard rule (docs/rules.md BR-16 and CLAUDE.md §2.5): we never
 * send request bodies, OTP codes, tokens, Aadhaar values or Money amounts. The
 * `beforeSend` hook strips `request.data` entirely and redacts any captured
 * key that looks sensitive; the scrubber is exported so it can be unit-tested.
 */
import * as Sentry from '@sentry/node';
import { config } from '../config.js';
import { currentTraceId } from '../logger.js';

/** Covers tokens, passwords, secrets, OTP/codes, Aadhaar, bank/money fields. */
const SENSITIVE_KEY_RE =
  /(password|passwd|pwd|secret|authorization|cookie|token|jwt|otp|verification.?code|reset.?code|pin|aadhaar|aadhar|account.?number|bank.?account|ifsc|upi|card|pan|money|amount|price|ceiling|rate)/i;

const SCRUB_PLACEHOLDER = '[scrubbed]';

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_RE.test(key);
}

/** A string that itself looks like money or a credential, regardless of key name. */
function looksSensitiveValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  // Money-like strings (e.g. "₹412.50", "10000.00", "48.00") never leave the box.
  return /^[₹$]\s?[0-9]+([.,][0-9]+)?$/.test(value);
}

/** Recursively redact a captured value; primitives pass through. */
export function scrubValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }
  if (value !== null && typeof value === 'object') {
    const safe: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      safe[key] =
        isSensitiveKey(key) || looksSensitiveValue(v) ? SCRUB_PLACEHOLDER : scrubValue(v);
    }
    return safe;
  }
  return looksSensitiveValue(value) ? SCRUB_PLACEHOLDER : value;
}

/**
 * Sentry `beforeSend` hook. Removes request bodies wholesale and scrubs any
 * remaining sensitive values (captured `extra`/context) before an event ships.
 *
 * In @sentry/node v10 the hook receives an `ErrorEvent` (performance
 * transactions never reach it — they use `beforeSendTransaction`), so this
 * signature must be exactly that or the compiler rejects the assignment.
 */
export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  return scrubEventInternal(event);
}

function scrubEventInternal(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Cast through `unknown`: ErrorEvent's optional props are precisely typed
  // (`exactOptionalPropertyTypes`), so direct Record casts are rejected.
  const next = { ...event } as unknown as Record<string, unknown>;

  if (event.request !== undefined) {
    const request = { ...(event.request as Record<string, unknown>) };
    // We never ship request bodies, regardless of content type.
    if ('data' in request) request['data'] = SCRUB_PLACEHOLDER;
    if ('headers' in request && request['headers'] !== undefined) {
      request['headers'] = scrubValue(request['headers']);
    }
    next['request'] = request;
  }

  if (event.extra !== undefined) {
    next['extra'] = scrubValue(event.extra);
  }

  if (event.contexts !== undefined) {
    next['contexts'] = scrubValue(event.contexts);
  }

  if (event.user !== undefined) {
    next['user'] = scrubValue(event.user);
  }

  return next as unknown as Sentry.ErrorEvent;
}

/** Initialise the SDK; a no-op (returns false) when the DSN is unset. */
export function initSentry(): boolean {
  if (config.SENTRY_DSN.trim().length === 0) return false;
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    release: process.env['TOHFA_RELEASE'] ?? 'local',
    beforeSend: scrubEvent,
  });
  return true;
}

export interface ReportContext {
  error: unknown;
  tags?: Record<string, string>;
}

/**
 * Report an error to Sentry — a no-op until `initSentry()` has run with a real
 * DSN. Tags the trace id so a Sentry issue can be matched to request/job logs.
 */
export function reportError(context: ReportContext): void {
  if (config.SENTRY_DSN.trim().length === 0) return;

  const traceId = currentTraceId();
  Sentry.withScope((scope) => {
    if (traceId !== undefined) scope.setTag('traceId', traceId);
    for (const [key, value] of Object.entries(context.tags ?? {})) {
      scope.setTag(key, value);
    }
    Sentry.captureException(context.error);
  });
}