import type { Executor } from '../../db/pool.js';
import type { GradeEnum } from './pricing.schema.js';

export interface FairPriceRow {
  id: string;
  crop_id: string;
  crop_name: string;
  grade: GradeEnum;
  ceiling_price: string;
  frequency: 'DAILY' | 'WEEKLY';
  effective_from: Date;
  effective_to: Date | null;
  set_by: string | null;
  notes: string | null;
  created_at: Date;
}

export interface RetailPriceRow {
  id: string;
  crop_id: string;
  crop_name: string;
  grade: GradeEnum;
  price: string;
  ceiling_price: string;
  markup_pct: number | null;
  gst_inclusive: boolean;
  fair_price_id: string | null;
  effective_from: Date;
  effective_to: Date | null;
  set_by: string;
  created_at: Date;
}

export interface ListFairPricesOptions {
  cropId?: string | undefined;
  grade?: GradeEnum | undefined;
  effectiveOn: string;
  cursor?: string | undefined;
  limit: number;
}

export interface GetFairPriceHistoryOptions {
  cropId: string;
  grade?: GradeEnum | undefined;
  from?: string | undefined;
  to?: string | undefined;
  cursor?: string | undefined;
  limit: number;
}

export interface ListRetailPricesOptions {
  cropId?: string | undefined;
  grade?: GradeEnum | undefined;
  effectiveOn: string;
  cursor?: string | undefined;
  limit: number;
}

export interface PricingRepo {
  findEffectiveFairPrice(
    db: Executor,
    cropId: string,
    grade: GradeEnum,
    targetDate: string,
  ): Promise<FairPriceRow | null>;

  listFairPrices(
    db: Executor,
    options: ListFairPricesOptions,
  ): Promise<{ items: FairPriceRow[]; nextCursor: string | null; hasMore: boolean }>;

  createFairPrice(
    db: Executor,
    input: {
      cropId: string;
      grade: GradeEnum;
      ceilingPrice: string;
      frequency: 'DAILY' | 'WEEKLY';
      effectiveFrom: string;
      notes?: string | undefined;
    },
    setBy: string,
  ): Promise<{
    fairPrice: FairPriceRow;
    affectedRetailPrices: RetailPriceRow[];
  }>;

  getFairPriceHistory(
    db: Executor,
    options: GetFairPriceHistoryOptions,
  ): Promise<{ items: FairPriceRow[]; nextCursor: string | null; hasMore: boolean }>;

  listRetailPrices(
    db: Executor,
    options: ListRetailPricesOptions,
  ): Promise<{ items: RetailPriceRow[]; nextCursor: string | null; hasMore: boolean }>;

  createRetailPrice(
    db: Executor,
    input: {
      cropId: string;
      grade: GradeEnum;
      price: string;
      markupPct?: number | undefined;
      gstInclusive: boolean;
      effectiveFrom: string;
    },
    fairPriceId: string,
    setBy: string,
  ): Promise<RetailPriceRow>;
}

export const pricingRepo: PricingRepo = {
  async findEffectiveFairPrice(db, cropId, grade, targetDate) {
    const result = await db.query<FairPriceRow>(
      `SELECT fp.id, fp.crop_id, cm.name AS crop_name, fp.grade,
              fp.ceiling_price::text AS ceiling_price, fp.frequency,
              fp.effective_from, fp.effective_to, fp.set_by, fp.notes, fp.created_at
         FROM fair_prices fp
         JOIN crop_master cm ON cm.id = fp.crop_id
        WHERE fp.crop_id = $1
          AND fp.grade = $2
          AND fp.effective_from <= $3::date
          AND (fp.effective_to IS NULL OR fp.effective_to >= $3::date)
        ORDER BY fp.effective_from DESC
        LIMIT 1`,
      [cropId, grade, targetDate],
    );
    return result.rows[0] ?? null;
  },

  async listFairPrices(db, options) {
    const conditions: string[] = [
      `fp.effective_from <= $1::date`,
      `(fp.effective_to IS NULL OR fp.effective_to >= $1::date)`,
    ];
    const values: unknown[] = [options.effectiveOn];
    let paramIndex = 2;

    if (options.cropId !== undefined) {
      conditions.push(`fp.crop_id = $${paramIndex++}`);
      values.push(options.cropId);
    }
    if (options.grade !== undefined) {
      conditions.push(`fp.grade = $${paramIndex++}`);
      values.push(options.grade);
    }
    if (options.cursor !== undefined && options.cursor.length > 0) {
      conditions.push(`fp.id < $${paramIndex++}`);
      values.push(options.cursor);
    }

    values.push(options.limit + 1);
    const limitParam = paramIndex;

    const result = await db.query<FairPriceRow>(
      `SELECT fp.id, fp.crop_id, cm.name AS crop_name, fp.grade,
              fp.ceiling_price::text AS ceiling_price, fp.frequency,
              fp.effective_from, fp.effective_to, fp.set_by, fp.notes, fp.created_at
         FROM fair_prices fp
         JOIN crop_master cm ON cm.id = fp.crop_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY cm.name ASC, fp.grade ASC, fp.id DESC
        LIMIT $${limitParam}`,
      values,
    );

    const hasMore = result.rows.length > options.limit;
    const items = hasMore ? result.rows.slice(0, options.limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  },

  async createFairPrice(db, input, setBy) {
    // 1. Close any open window for (crop_id, grade) before effectiveFrom
    await db.query(
      `UPDATE fair_prices
          SET effective_to = ($3::date - interval '1 day')::date,
              updated_at = now()
        WHERE crop_id = $1
          AND grade = $2
          AND (effective_to IS NULL OR effective_to >= $3::date)
          AND effective_from < $3::date`,
      [input.cropId, input.grade, input.effectiveFrom],
    );

    // 2. Insert new fair price ceiling
    const insertRes = await db.query<FairPriceRow>(
      `INSERT INTO fair_prices (
         crop_id, grade, ceiling_price, frequency, effective_from, set_by, notes
       )
       VALUES ($1, $2, $3, $4, $5::date, $6, $7)
       RETURNING id, crop_id, (SELECT name FROM crop_master WHERE id = $1) AS crop_name,
                 grade, ceiling_price::text AS ceiling_price, frequency,
                 effective_from, effective_to, set_by, notes, created_at`,
      [
        input.cropId,
        input.grade,
        input.ceilingPrice,
        input.frequency,
        input.effectiveFrom,
        setBy,
        input.notes ?? null,
      ],
    );
    const fairPrice = insertRes.rows[0]!;

    // 3. Check for any active retail prices for this (crop_id, grade) that are now above the ceiling (BR-09b)
    const affectedRes = await db.query<RetailPriceRow>(
      `SELECT rp.id, rp.crop_id, cm.name AS crop_name, rp.grade,
              rp.price::text AS price, $4::text AS ceiling_price,
              rp.markup_pct::float AS markup_pct, rp.gst_inclusive,
              rp.fair_price_id, rp.effective_from, rp.effective_to,
              rp.set_by, rp.created_at
         FROM retail_prices rp
         JOIN crop_master cm ON cm.id = rp.crop_id
        WHERE rp.crop_id = $1
          AND rp.grade = $2
          AND (rp.effective_to IS NULL OR rp.effective_to >= $3::date)
          AND rp.price > $4`,
      [input.cropId, input.grade, input.effectiveFrom, input.ceilingPrice],
    );

    return {
      fairPrice,
      affectedRetailPrices: affectedRes.rows,
    };
  },

  async getFairPriceHistory(db, options) {
    const conditions: string[] = [`fp.crop_id = $1`];
    const values: unknown[] = [options.cropId];
    let paramIndex = 2;

    if (options.grade !== undefined) {
      conditions.push(`fp.grade = $${paramIndex++}`);
      values.push(options.grade);
    }
    if (options.from !== undefined) {
      conditions.push(`fp.effective_from >= $${paramIndex++}::date`);
      values.push(options.from);
    }
    if (options.to !== undefined) {
      conditions.push(`fp.effective_from <= $${paramIndex++}::date`);
      values.push(options.to);
    }
    if (options.cursor !== undefined && options.cursor.length > 0) {
      conditions.push(`fp.id < $${paramIndex++}`);
      values.push(options.cursor);
    }

    values.push(options.limit + 1);
    const limitParam = paramIndex;

    const result = await db.query<FairPriceRow>(
      `SELECT fp.id, fp.crop_id, cm.name AS crop_name, fp.grade,
              fp.ceiling_price::text AS ceiling_price, fp.frequency,
              fp.effective_from, fp.effective_to, fp.set_by, fp.notes, fp.created_at
         FROM fair_prices fp
         JOIN crop_master cm ON cm.id = fp.crop_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY fp.effective_from DESC, fp.id DESC
        LIMIT $${limitParam}`,
      values,
    );

    const hasMore = result.rows.length > options.limit;
    const items = hasMore ? result.rows.slice(0, options.limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  },

  async listRetailPrices(db, options) {
    const conditions: string[] = [
      `rp.effective_from <= $1::date`,
      `(rp.effective_to IS NULL OR rp.effective_to >= $1::date)`,
    ];
    const values: unknown[] = [options.effectiveOn];
    let paramIndex = 2;

    if (options.cropId !== undefined) {
      conditions.push(`rp.crop_id = $${paramIndex++}`);
      values.push(options.cropId);
    }
    if (options.grade !== undefined) {
      conditions.push(`rp.grade = $${paramIndex++}`);
      values.push(options.grade);
    }
    if (options.cursor !== undefined && options.cursor.length > 0) {
      conditions.push(`rp.id < $${paramIndex++}`);
      values.push(options.cursor);
    }

    values.push(options.limit + 1);
    const limitParam = paramIndex;

    const result = await db.query<RetailPriceRow>(
      `SELECT rp.id, rp.crop_id, cm.name AS crop_name, rp.grade,
              rp.price::text AS price, COALESCE(fp.ceiling_price::text, '0.00') AS ceiling_price,
              rp.markup_pct::float AS markup_pct, rp.gst_inclusive,
              rp.fair_price_id, rp.effective_from, rp.effective_to,
              rp.set_by, rp.created_at
         FROM retail_prices rp
         JOIN crop_master cm ON cm.id = rp.crop_id
    LEFT JOIN fair_prices fp ON fp.id = rp.fair_price_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY cm.name ASC, rp.grade ASC, rp.id DESC
        LIMIT $${limitParam}`,
      values,
    );

    const hasMore = result.rows.length > options.limit;
    const items = hasMore ? result.rows.slice(0, options.limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  },

  async createRetailPrice(db, input, fairPriceId, setBy) {
    // 1. Close open retail window before effectiveFrom
    await db.query(
      `UPDATE retail_prices
          SET effective_to = ($3::date - interval '1 day')::date,
              updated_at = now()
        WHERE crop_id = $1
          AND grade = $2
          AND (effective_to IS NULL OR effective_to >= $3::date)
          AND effective_from < $3::date`,
      [input.cropId, input.grade, input.effectiveFrom],
    );

    // 2. Insert new retail price
    const result = await db.query<RetailPriceRow>(
      `INSERT INTO retail_prices (
         crop_id, grade, price, markup_pct, gst_inclusive, fair_price_id,
         effective_from, set_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)
       RETURNING id, crop_id, (SELECT name FROM crop_master WHERE id = $1) AS crop_name,
                 grade, price::text AS price,
                 (SELECT ceiling_price::text FROM fair_prices WHERE id = $6) AS ceiling_price,
                 markup_pct::float AS markup_pct, gst_inclusive, fair_price_id,
                 effective_from, effective_to, set_by, created_at`,
      [
        input.cropId,
        input.grade,
        input.price,
        input.markupPct ?? null,
        input.gstInclusive,
        fairPriceId,
        input.effectiveFrom,
        setBy,
      ],
    );

    return result.rows[0]!;
  },
};
