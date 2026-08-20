/**
 * Zod request validation middleware.
 *
 * Validated output is stored on `req.validated`, NOT written back over
 * `req.query` (Express 4 defines `query` as a getter — assigning to it throws
 * in strict mode). Read it back with the typed `getValidated` helper so the
 * handler gets the *parsed* value, with coercions and defaults applied.
 *
 * ```ts
 * const listQuery = z.object({ page: z.coerce.number().int().min(1).default(1) });
 *
 * router.get('/', validate({ query: listQuery }), asyncHandler(async (req, res) => {
 *   const { page } = getValidated(req, 'query', listQuery);   // page: number
 * }));
 * ```
 */
import type { Request, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { zodToAppError } from './errorHandler.js';

export type ValidationPart = 'body' | 'query' | 'params';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export type ValidatedStore = Partial<Record<ValidationPart, unknown>>;

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    const store: ValidatedStore = req.validated ?? {};
    const issues: ZodError[] = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (schema === undefined) continue;

      const result = schema.safeParse(req[part]);
      if (result.success) {
        store[part] = result.data;
        // `body` is a plain own property, so keeping it in sync is safe and
        // means legacy handlers that read req.body still see parsed values.
        if (part === 'body') req.body = result.data;
      } else {
        issues.push(prefixIssues(result.error, part));
      }
    }

    req.validated = store;

    if (issues.length > 0) {
      const merged = new ZodError(issues.flatMap((error) => error.issues));
      next(zodToAppError(merged));
      return;
    }

    next();
  };
}

/**
 * Read a validated part back with its inferred type. Throws if `validate` was
 * not applied for that part — a wiring bug, not a client error.
 */
export function getValidated<S extends ZodTypeAny>(
  req: Request,
  part: ValidationPart,
  _schema: S,
): z.infer<S> {
  const store = req.validated;
  if (store === undefined || !(part in store)) {
    throw new Error(
      `getValidated(req, '${part}') called without a matching validate({ ${part}: ... }) middleware.`,
    );
  }
  return store[part] as z.infer<S>;
}

/** Namespace issue paths as `body.pricePerKg` so the client can map to a field. */
function prefixIssues(error: ZodError, part: ValidationPart): ZodError {
  return new ZodError(
    error.issues.map((issue) => ({ ...issue, path: [part, ...issue.path] })),
  );
}
