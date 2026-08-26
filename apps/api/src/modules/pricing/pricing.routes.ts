import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  bulkUpsertFairPricesBody,
  fairPriceCreateSchema,
  getFairPriceHistoryQuery,
  listFairPricesQuery,
  listRetailPricesQuery,
  retailPriceCreateSchema,
} from './pricing.schema.js';
import { pricingService } from './pricing.service.js';

export const fairPricesRouter: Router = Router();

// GET /fair-prices — List effective fair price ceilings
fairPricesRouter.get(
  '/',
  requireAuth,
  requirePermission('pricing.fair_price.view'),
  validate({ query: listFairPricesQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listFairPricesQuery);
    const result = await pricingService.listFairPrices(query);
    res.json(result);
  }),
);

// POST /fair-prices — Set a fair price ceiling (Super Admin only, BR-08)
fairPricesRouter.post(
  '/',
  requireAuth,
  requirePermission('pricing.fair_price.set'),
  validate({ body: fairPriceCreateSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', fairPriceCreateSchema);
    const result = await pricingService.createFairPrice(actor, body);
    res.status(201).json(result);
  }),
);

// POST /fair-prices/bulk — Bulk price update (Super Admin only, BR-08)
fairPricesRouter.post(
  '/bulk',
  requireAuth,
  requirePermission('pricing.fair_price.bulk_update'),
  validate({ body: bulkUpsertFairPricesBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', bulkUpsertFairPricesBody);
    const result = await pricingService.bulkUpsertFairPrices(actor, body);
    res.json(result);
  }),
);

// GET /fair-prices/history — Price history for a crop + grade
fairPricesRouter.get(
  '/history',
  requireAuth,
  requirePermission('pricing.fair_price.view'),
  validate({ query: getFairPriceHistoryQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', getFairPriceHistoryQuery);
    const result = await pricingService.getFairPriceHistory(query);
    res.json(result);
  }),
);

export const retailPricesRouter: Router = Router();

// GET /retail-prices — Customer-facing retail prices
retailPricesRouter.get(
  '/',
  requireAuth,
  requirePermission('pricing.retail_price.view'),
  validate({ query: listRetailPricesQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listRetailPricesQuery);
    const result = await pricingService.listRetailPrices(query);
    res.json(result);
  }),
);

// POST /retail-prices — Set a retail price (Super Admin / TOHFA Admin, BR-09)
retailPricesRouter.post(
  '/',
  requireAuth,
  requirePermission('pricing.retail_price.set'),
  validate({ body: retailPriceCreateSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', retailPriceCreateSchema);
    const result = await pricingService.createRetailPrice(actor, body);
    res.status(201).json(result);
  }),
);
