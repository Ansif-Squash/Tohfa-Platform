/**
 * Express application assembly.
 *
 * Order matters and is deliberate:
 *   1. helmet          security headers before anything can respond
 *   2. correlationId   so every later log line and problem carries a traceId
 *   3. cors            preflight must be answered before body parsing
 *   4. json/urlencoded bounded body size
 *   5. routes
 *   6. notFoundHandler turns an unmatched path into a NOT_FOUND AppError
 *   7. errorHandler    the single place that writes problem+json
 *
 * `createApp()` returns the app WITHOUT listening, so tests can drive it with
 * supertest and `server.ts` owns the socket.
 */
import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './http/errorHandler.js';
import { logger, newTraceId, runWithContext } from './logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { warehousesRouter } from './modules/_example/warehouses.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { adminFarmerApplicationsRouter, farmerApplicationsRouter } from './modules/farmer-applications/farmer-applications.routes.js';
import { certificationsAdminRouter, certificationsFarmerRouter } from './modules/certifications/certifications.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { fairPricesRouter, retailPricesRouter } from './modules/pricing/pricing.routes.js';
import { listingsRouter } from './modules/listings/listings.routes.js';

export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Establishes the async-local logging context for the request. A client-supplied
 * correlation id is honoured (so a mobile crash report can be tied to server
 * logs) but length-capped so it cannot be used to bloat every log line.
 */
const correlationId: RequestHandler = (req, res, next) => {
  const incoming = req.header(CORRELATION_HEADER);
  const traceId =
    incoming !== undefined && incoming.length > 0 && incoming.length <= 128
      ? incoming
      : newTraceId();

  req.traceId = traceId;
  res.setHeader(CORRELATION_HEADER, traceId);
  runWithContext({ traceId }, () => {
    next();
  });
};

/** One line per completed request, at the level the status deserves. */
const requestLog: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const payload = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - startedAt,
    };
    if (res.statusCode >= 500) logger.error(payload, 'request');
    else logger.info(payload, 'request');
  });
  next();
};

export function createApp(): Express {
  const app = express();

  // Behind Azure App Gateway / nginx: trust one proxy hop so req.ip is real.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(correlationId);
  app.use(requestLog);
  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      credentials: true,
      exposedHeaders: [CORRELATION_HEADER],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Probes are unversioned: orchestrators should not care about the API version.
  app.use(healthRouter);

  // REFERENCE: every module router mounts under /v1/<plural-noun>.
  app.use('/v1/warehouses', warehousesRouter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/uploads', uploadsRouter);
  app.use('/v1/farmers', farmerApplicationsRouter);
  app.use('/v1/farmers/me/certifications', certificationsFarmerRouter);
  app.use('/v1/admin/farmer-applications', adminFarmerApplicationsRouter);
  app.use('/v1/admin/certifications', certificationsAdminRouter);
  app.use('/v1/notifications', notificationsRouter);
  app.use('/v1/fair-prices', fairPricesRouter);
  app.use('/v1/retail-prices', retailPricesRouter);
  app.use('/v1/listings', listingsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
