/**
 * Pino logger with request correlation.
 *
 * Every log line emitted while handling a request carries the same `traceId`,
 * which is also echoed to the client in the `x-correlation-id` header and in
 * the `traceId` field of any problem+json response. That triple — client error
 * screenshot, HTTP header, log line — is what makes production triage possible.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import pino, { type Logger } from 'pino';
import { config } from './config.js';

export interface RequestContext {
  traceId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const rootLogger: Logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'tohfa-api', env: config.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'otp',
      '*.otp',
      'accountNumber',
      '*.accountNumber',
    ],
    censor: '[redacted]',
  },
  ...(config.isProduction || config.isTest
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } }),
});

/** Run `fn` with a correlation context; all logs inside inherit `traceId`. */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function currentContext(): RequestContext | undefined {
  return storage.getStore();
}

export function currentTraceId(): string | undefined {
  return storage.getStore()?.traceId;
}

export function newTraceId(): string {
  return randomUUID();
}

/**
 * The logger you should import in application code. It automatically decorates
 * lines with the ambient traceId when one exists.
 */
const LEVEL_METHODS = new Set(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);

/** The logger bound to the ambient request context, or the root logger. */
export function contextLogger(): Logger {
  const context = storage.getStore();
  if (context === undefined) return rootLogger;
  return rootLogger.child(
    context.userId === undefined
      ? { traceId: context.traceId }
      : { traceId: context.traceId, userId: context.userId },
  );
}

export const logger: Logger = new Proxy(rootLogger, {
  get(target, property, receiver): unknown {
    if (typeof property === 'string' && LEVEL_METHODS.has(property)) {
      const bound = contextLogger();
      const method = Reflect.get(bound, property, bound) as unknown;
      return typeof method === 'function' ? method.bind(bound) : method;
    }
    return Reflect.get(target, property, receiver);
  },
});
