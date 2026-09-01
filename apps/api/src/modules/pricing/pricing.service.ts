import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  pricingRepo,
  type FairPriceRow,
  type PricingRepo,
  type RetailPriceRow,
} from './pricing.repo.js';
import type {
  BulkUpsertFairPricesBody,
  FairPriceCreate,
  GetFairPriceHistoryQuery,
  ListFairPricesQuery,
  ListRetailPricesQuery,
  RetailPriceCreate,
} from './pricing.schema.js';

export function parseMoneyToPaise(money: string): number {
  return Math.round(Number(money) * 100);
}

export function compareMoney(a: string, b: string): number {
  return parseMoneyToPaise(a) - parseMoneyToPaise(b);
}

export function getTodayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatDateOnly(val: unknown): string {
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  return String(val).slice(0, 10);
}

function mapFairPriceResponse(row: FairPriceRow) {
  return {
    id: row.id,
    cropId: row.crop_id,
    cropName: row.crop_name,
    grade: row.grade,
    ceilingPrice: Number(row.ceiling_price).toFixed(2),
    frequency: row.frequency,
    effectiveFrom: formatDateOnly(row.effective_from),
    effectiveTo: row.effective_to ? formatDateOnly(row.effective_to) : null,
    setBy: row.set_by,
    notes: row.notes,
  };
}

function mapRetailPriceResponse(row: RetailPriceRow) {
  return {
    id: row.id,
    cropId: row.crop_id,
    cropName: row.crop_name,
    grade: row.grade,
    price: Number(row.price).toFixed(2),
    ceilingPrice: Number(row.ceiling_price).toFixed(2),
    markupPct: row.markup_pct,
    gstInclusive: row.gst_inclusive,
    effectiveFrom: formatDateOnly(row.effective_from),
    effectiveTo: row.effective_to ? formatDateOnly(row.effective_to) : null,
  };
}

export interface PricingService {
  listFairPrices(query: ListFairPricesQuery): Promise<unknown>;
  createFairPrice(actor: Actor, body: FairPriceCreate): Promise<unknown>;
  bulkUpsertFairPrices(actor: Actor, body: BulkUpsertFairPricesBody): Promise<unknown>;
  getFairPriceHistory(query: GetFairPriceHistoryQuery): Promise<unknown>;
  listRetailPrices(query: ListRetailPricesQuery): Promise<unknown>;
  createRetailPrice(actor: Actor, body: RetailPriceCreate): Promise<unknown>;
}

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export function createPricingService(
  repo: PricingRepo = pricingRepo,
  runTx: TransactionRunner = withTransaction,
): PricingService {
  return {
    async listFairPrices(query) {
      const effectiveOn = query.effectiveOn ?? getTodayKolkata();
      const { items, nextCursor, hasMore } = await repo.listFairPrices(pool, {
        ...(query.cropId !== undefined ? { cropId: query.cropId } : {}),
        ...(query.grade !== undefined ? { grade: query.grade } : {}),
        effectiveOn,
        ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
        limit: query.limit,
      });

      return {
        items: items.map(mapFairPriceResponse),
        page: { nextCursor, hasMore },
      };
    },

    async createFairPrice(actor, body) {
      const result = await runTx(async (tx) => {
        try {
          const { fairPrice, affectedRetailPrices } = await repo.createFairPrice(
            tx,
            {
              cropId: body.cropId,
              grade: body.grade,
              ceilingPrice: body.ceilingPrice,
              frequency: body.frequency,
              effectiveFrom: body.effectiveFrom,
              ...(body.notes !== undefined ? { notes: body.notes } : {}),
            },
            actor.userId,
          );

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
            actionCode: 'pricing.fair_price.set',
            entityType: 'fair_price',
            entityId: fairPrice.id,
            after: {
              cropId: fairPrice.crop_id,
              grade: fairPrice.grade,
              ceilingPrice: fairPrice.ceiling_price,
              effectiveFrom: fairPrice.effective_from,
            },
            changedFields: ['ceiling_price', 'effective_from'],
          });

          return { fairPrice, affectedRetailPrices };
        } catch (err: any) {
          if (err.code === '23505' || err.code === '23P01') {
            throw new AppError('CONFLICT', {
              status: 409,
              detail: 'A fair price ceiling for this crop, grade, and effective window already exists.',
              cause: err,
            });
          }
          throw err;
        }
      });

      const mapped = mapFairPriceResponse(result.fairPrice);
      if (result.affectedRetailPrices.length > 0) {
        return {
          ...mapped,
          affectedRetailPrices: result.affectedRetailPrices.map(mapRetailPriceResponse),
        };
      }
      return mapped;
    },

    async bulkUpsertFairPrices(actor, body) {
      // Validate batch internally
      const errors: Array<{ index: number; field: string; message: string }> = [];
      const seen = new Set<string>();

      body.items.forEach((item, idx) => {
        const key = `${item.cropId}:${item.grade}:${item.effectiveFrom}`;
        if (seen.has(key)) {
          errors.push({
            index: idx,
            field: 'cropId',
            message: `Duplicate entry for crop ${item.cropId} grade ${item.grade} on ${item.effectiveFrom}`,
          });
        }
        seen.add(key);

        if (parseMoneyToPaise(item.ceilingPrice) <= 0) {
          errors.push({
            index: idx,
            field: 'ceilingPrice',
            message: 'Ceiling price must be greater than 0',
          });
        }
      });

      if (errors.length > 0) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Bulk fair price validation failed.',
          meta: { errors },
        });
      }

      const results = await runTx(async (tx) => {
        const createdItems: FairPriceRow[] = [];

        for (const item of body.items) {
          const { fairPrice } = await repo.createFairPrice(
            tx,
            {
              cropId: item.cropId,
              grade: item.grade,
              ceilingPrice: item.ceilingPrice,
              frequency: item.frequency,
              effectiveFrom: item.effectiveFrom,
              ...(item.notes !== undefined ? { notes: item.notes } : {}),
            },
            actor.userId,
          );

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
            actionCode: 'pricing.fair_price.bulk_update',
            entityType: 'fair_price',
            entityId: fairPrice.id,
            after: {
              cropId: fairPrice.crop_id,
              grade: fairPrice.grade,
              ceilingPrice: fairPrice.ceiling_price,
              effectiveFrom: fairPrice.effective_from,
            },
            changedFields: ['ceiling_price', 'effective_from'],
          });

          createdItems.push(fairPrice);
        }

        return createdItems;
      });

      return {
        applied: results.length,
        items: results.map(mapFairPriceResponse),
      };
    },

    async getFairPriceHistory(query) {
      const { items, nextCursor, hasMore } = await repo.getFairPriceHistory(pool, {
        cropId: query.cropId,
        ...(query.grade !== undefined ? { grade: query.grade } : {}),
        ...(query.from !== undefined ? { from: query.from } : {}),
        ...(query.to !== undefined ? { to: query.to } : {}),
        ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
        limit: query.limit,
      });

      return {
        items: items.map(mapFairPriceResponse),
        page: { nextCursor, hasMore },
      };
    },

    async listRetailPrices(query) {
      const effectiveOn = getTodayKolkata();
      const { items, nextCursor, hasMore } = await repo.listRetailPrices(pool, {
        ...(query.cropId !== undefined ? { cropId: query.cropId } : {}),
        ...(query.grade !== undefined ? { grade: query.grade } : {}),
        effectiveOn,
        ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
        limit: query.limit,
      });

      return {
        items: items.map(mapRetailPriceResponse),
        page: { nextCursor, hasMore },
      };
    },

    async createRetailPrice(actor, body) {
      const created = await runTx(async (tx) => {
        const ceiling = await repo.findEffectiveFairPrice(
          tx,
          body.cropId,
          body.grade,
          body.effectiveFrom,
        );

        if (ceiling === null) {
          throw new AppError('NOT_FOUND', {
            detail: `No fair price ceiling in effect for this crop and grade on ${body.effectiveFrom}.`,
          });
        }

        // BR-09a: Retail price must not exceed fair price ceiling
        if (compareMoney(body.price, ceiling.ceiling_price) > 0) {
          throw new AppError('PRICE_ABOVE_CEILING', {
            status: 422,
            detail: `Retail price (${body.price}) cannot exceed the fair price ceiling (${ceiling.ceiling_price}).`,
            meta: {
              ceilingPrice: Number(ceiling.ceiling_price).toFixed(2),
              attemptedPrice: Number(body.price).toFixed(2),
            },
          });
        }

        const row = await repo.createRetailPrice(
          tx,
          {
            cropId: body.cropId,
            grade: body.grade,
            price: body.price,
            ...(body.markupPct !== undefined ? { markupPct: body.markupPct } : {}),
            gstInclusive: body.gstInclusive,
            effectiveFrom: body.effectiveFrom,
          },
          ceiling.id,
          actor.userId,
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'pricing.retail_price.set',
          entityType: 'retail_price',
          entityId: row.id,
          after: {
            cropId: row.crop_id,
            grade: row.grade,
            price: row.price,
            fairPriceId: ceiling.id,
            effectiveFrom: row.effective_from,
          },
          changedFields: ['price', 'effective_from'],
        });

        return row;
      });

      return mapRetailPriceResponse(created);
    },
  };
}

export const pricingService = createPricingService();
