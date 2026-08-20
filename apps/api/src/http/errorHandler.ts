/**
 * Terminal Express error middleware. Must be registered LAST in app.ts.
 *
 * Responsibilities:
 *  - translate AppError / ZodError / unknown throwables into problem+json
 *  - log at the right level (4xx = warn, 5xx = error)
 *  - never leak an internal message or stack to the client
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.js';
import { AppError, internalProblem } from './problem.js';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** 404 fallback. Register after all routes, before `errorHandler`. */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', { detail: 'No route matches this path and method.' }));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Express requires the 4-arity signature; if headers already went out the
  // only correct move is to hand it back so the connection is destroyed.
  if (res.headersSent) {
    next(error);
    return;
  }

  const instance = req.originalUrl;

  if (error instanceof ZodError) {
    const appError = zodToAppError(error);
    logger.warn({ err: error, code: appError.code, path: instance }, 'request validation failed');
    res.status(appError.status).type(PROBLEM_CONTENT_TYPE).json(appError.toProblem(instance));
    return;
  }

  if (error instanceof AppError) {
    const problem = error.toProblem(instance);
    if (error.status >= 500) {
      logger.error({ err: error, code: error.code, path: instance }, 'request failed');
    } else {
      logger.warn({ code: error.code, path: instance, detail: error.detail }, 'request rejected');
    }
    res.status(error.status).type(PROBLEM_CONTENT_TYPE).json(problem);
    return;
  }

  // Anything else is a bug. Log everything, tell the client nothing.
  logger.error({ err: error, path: instance }, 'unhandled error');
  res.status(500).type(PROBLEM_CONTENT_TYPE).json(internalProblem(instance));
};

/** Flatten a ZodError into the `errors` map of a VALIDATION_FAILED problem. */
export function zodToAppError(error: ZodError): AppError {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    const bucket = errors[key];
    if (bucket === undefined) {
      errors[key] = [issue.message];
    } else {
      bucket.push(issue.message);
    }
  }
  return new AppError('VALIDATION_FAILED', {
    detail: 'One or more fields are invalid.',
    errors,
  });
}
