import type { Executor } from '../../db/pool.js';
import type {
  CategoryView,
  ListProductsQuery,
  ProductGrade,
  ProductSort,
  SearchCatalogQuery,
} from './catalog.schema.js';

export interface RawCatalogProductRow {
  crop_id: string;
  name: string;
  category_id: string;
  grade: ProductGrade;
  price_per_kg: string;
  available_qty: string;
  unit: 'kg';
  icon_key: string | null;
  photo_url: string | null;
  certification_badges: string[] | null;
  warehouse_ids: string[];
  created_at: Date;
}

export interface CatalogRepo {
  listProducts(
    db: Executor,
    filters: ListProductsQuery,
  ): Promise<{ items: RawCatalogProductRow[]; nextCursor: string | null; hasMore: boolean }>;
  getProductById(
    db: Executor,
    cropId: string,
    grade?: ProductGrade,
  ): Promise<RawCatalogProductRow | null>;
  searchProducts(
    db: Executor,
    filters: SearchCatalogQuery,
  ): Promise<{ items: RawCatalogProductRow[]; nextCursor: string | null; hasMore: boolean }>;
  listCategories(db: Executor): Promise<CategoryView[]>;
  getFeaturedProducts(db: Executor, warehouseId?: string): Promise<RawCatalogProductRow[]>;
}

function buildSortClause(sort: ProductSort): string {
  switch (sort) {
    case 'PRICE_ASC':
      return 'ORDER BY price_per_kg ASC, cm.name ASC, cm.id ASC';
    case 'PRICE_DESC':
      return 'ORDER BY price_per_kg DESC, cm.name ASC, cm.id ASC';
    case 'NEWEST':
      return 'ORDER BY MIN(b.created_at) DESC, cm.name ASC, cm.id ASC';
    case 'NAME_ASC':
    default:
      return 'ORDER BY cm.name ASC, b.grade ASC, cm.id ASC';
  }
}

export const catalogRepo: CatalogRepo = {
  async listProducts(
    db: Executor,
    filters: ListProductsQuery,
  ): Promise<{ items: RawCatalogProductRow[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions: string[] = [
      "a.channel = 'ONLINE'",
      "b.status = 'ACTIVE'",
      "b.grade IN ('GRADE_1', 'GRADE_2', 'GRADE_3')",
      'cm.deleted_at IS NULL',
      'cm.is_active = true',
      'a.available_qty > 0',
    ];
    const params: unknown[] = [];

    if (filters.categoryId) {
      params.push(filters.categoryId);
      conditions.push(`cm.category_id = $${params.length}`);
    }

    if (filters.grade) {
      params.push(filters.grade);
      conditions.push(`b.grade = $${params.length}::produce_grade`);
    }

    if (filters.warehouseId) {
      params.push(filters.warehouseId);
      conditions.push(`a.warehouse_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const sortClause = buildSortClause(filters.sort);
    const limit = filters.limit;

    params.push(limit + 1);
    const limitParam = params.length;

    // BR-24: Stock is consolidated and pooled across batches and farmers.
    // Farmer identity is NEVER joined (BR-16).
    const sql = `
      WITH active_retail_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, price
          FROM retail_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      ),
      active_fair_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, ceiling_price
          FROM fair_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      )
      SELECT cm.id                                                AS crop_id,
             cm.name                                              AS name,
             cm.category_id                                       AS category_id,
             b.grade                                              AS grade,
             COALESCE(
               rp.price::text,
               fp.ceiling_price::text,
               '50.00'
             )                                                    AS price_per_kg,
             SUM(a.available_qty)::text                           AS available_qty,
             'kg'::text                                           AS unit,
             cm.icon_key                                          AS icon_key,
             NULL::text                                           AS photo_url,
             ARRAY[]::text[]                                      AS certification_badges,
             ARRAY_AGG(DISTINCT a.warehouse_id::text)             AS warehouse_ids,
             MIN(b.created_at)                                    AS created_at
        FROM allocations a
        JOIN inventory_batches b ON b.id = a.batch_id
        JOIN crop_master cm ON cm.id = b.crop_id
   LEFT JOIN active_retail_prices rp ON rp.crop_id = b.crop_id AND rp.grade = b.grade
   LEFT JOIN active_fair_prices fp ON fp.crop_id = b.crop_id AND fp.grade = b.grade
       WHERE ${whereClause}
       GROUP BY cm.id, cm.name, cm.category_id, b.grade, rp.price, fp.ceiling_price, cm.icon_key
       HAVING SUM(a.available_qty) > 0
       ${sortClause}
       LIMIT $${limitParam}
    `;

    const res = await db.query<RawCatalogProductRow>(sql, params);
    const rows = res.rows;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0 ? Buffer.from(items[items.length - 1]!.crop_id).toString('base64') : null;

    return { items, nextCursor, hasMore };
  },

  async getProductById(
    db: Executor,
    cropId: string,
    grade?: ProductGrade,
  ): Promise<RawCatalogProductRow | null> {
    const conditions: string[] = [
      "a.channel = 'ONLINE'",
      "b.status = 'ACTIVE'",
      "b.grade IN ('GRADE_1', 'GRADE_2', 'GRADE_3')",
      'cm.deleted_at IS NULL',
      'cm.is_active = true',
      'cm.id = $1',
      'a.available_qty > 0',
    ];
    const params: unknown[] = [cropId];

    if (grade) {
      params.push(grade);
      conditions.push(`b.grade = $${params.length}::produce_grade`);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      WITH active_retail_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, price
          FROM retail_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      ),
      active_fair_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, ceiling_price
          FROM fair_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      )
      SELECT cm.id                                                AS crop_id,
             cm.name                                              AS name,
             cm.category_id                                       AS category_id,
             b.grade                                              AS grade,
             COALESCE(
               rp.price::text,
               fp.ceiling_price::text,
               '50.00'
             )                                                    AS price_per_kg,
             SUM(a.available_qty)::text                           AS available_qty,
             'kg'::text                                           AS unit,
             cm.icon_key                                          AS icon_key,
             NULL::text                                           AS photo_url,
             ARRAY[]::text[]                                      AS certification_badges,
             ARRAY_AGG(DISTINCT a.warehouse_id::text)             AS warehouse_ids,
             MIN(b.created_at)                                    AS created_at
        FROM allocations a
        JOIN inventory_batches b ON b.id = a.batch_id
        JOIN crop_master cm ON cm.id = b.crop_id
   LEFT JOIN active_retail_prices rp ON rp.crop_id = b.crop_id AND rp.grade = b.grade
   LEFT JOIN active_fair_prices fp ON fp.crop_id = b.crop_id AND fp.grade = b.grade
       WHERE ${whereClause}
       GROUP BY cm.id, cm.name, cm.category_id, b.grade, rp.price, fp.ceiling_price, cm.icon_key
       HAVING SUM(a.available_qty) > 0
       ORDER BY b.grade ASC
       LIMIT 1
    `;

    const res = await db.query<RawCatalogProductRow>(sql, params);
    return res.rows[0] ?? null;
  },

  async searchProducts(
    db: Executor,
    filters: SearchCatalogQuery,
  ): Promise<{ items: RawCatalogProductRow[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions: string[] = [
      "a.channel = 'ONLINE'",
      "b.status = 'ACTIVE'",
      "b.grade IN ('GRADE_1', 'GRADE_2', 'GRADE_3')",
      'cm.deleted_at IS NULL',
      'cm.is_active = true',
      'a.available_qty > 0',
    ];
    const params: unknown[] = [];

    params.push(`%${filters.q}%`);
    conditions.push(`(cm.name ILIKE $${params.length} OR cm.slug ILIKE $${params.length})`);

    if (filters.warehouseId) {
      params.push(filters.warehouseId);
      conditions.push(`a.warehouse_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const limit = filters.limit;

    params.push(limit + 1);
    const limitParam = params.length;

    const sql = `
      WITH active_retail_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, price
          FROM retail_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      ),
      active_fair_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, ceiling_price
          FROM fair_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      )
      SELECT cm.id                                                AS crop_id,
             cm.name                                              AS name,
             cm.category_id                                       AS category_id,
             b.grade                                              AS grade,
             COALESCE(
               rp.price::text,
               fp.ceiling_price::text,
               '50.00'
             )                                                    AS price_per_kg,
             SUM(a.available_qty)::text                           AS available_qty,
             'kg'::text                                           AS unit,
             cm.icon_key                                          AS icon_key,
             NULL::text                                           AS photo_url,
             ARRAY[]::text[]                                      AS certification_badges,
             ARRAY_AGG(DISTINCT a.warehouse_id::text)             AS warehouse_ids,
             MIN(b.created_at)                                    AS created_at
        FROM allocations a
        JOIN inventory_batches b ON b.id = a.batch_id
        JOIN crop_master cm ON cm.id = b.crop_id
   LEFT JOIN active_retail_prices rp ON rp.crop_id = b.crop_id AND rp.grade = b.grade
   LEFT JOIN active_fair_prices fp ON fp.crop_id = b.crop_id AND fp.grade = b.grade
       WHERE ${whereClause}
       GROUP BY cm.id, cm.name, cm.category_id, b.grade, rp.price, fp.ceiling_price, cm.icon_key
       HAVING SUM(a.available_qty) > 0
       ORDER BY cm.name ASC, b.grade ASC
       LIMIT $${limitParam}
    `;

    const res = await db.query<RawCatalogProductRow>(sql, params);
    const rows = res.rows;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0 ? Buffer.from(items[items.length - 1]!.crop_id).toString('base64') : null;

    return { items, nextCursor, hasMore };
  },

  async listCategories(db: Executor): Promise<CategoryView[]> {
    const res = await db.query<{
      id: string;
      name: string;
      slug: string;
      image_key: string | null;
      sort_order: number;
      product_count: string;
    }>(
      `SELECT c.id,
              c.name,
              c.slug,
              c.image_key,
              c.sort_order,
              COUNT(DISTINCT cm.id)::text AS product_count
         FROM categories c
    LEFT JOIN crop_master cm ON cm.category_id = c.id AND cm.is_active = true AND cm.deleted_at IS NULL
        WHERE c.is_active = true
        GROUP BY c.id, c.name, c.slug, c.image_key, c.sort_order
        ORDER BY c.sort_order ASC, c.name ASC`,
    );

    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.image_key ? `https://cdn.tohfa.in/cat/${r.image_key}` : null,
      sortOrder: r.sort_order,
      productCount: Number(r.product_count || 0),
    }));
  },

  async getFeaturedProducts(db: Executor, warehouseId?: string): Promise<RawCatalogProductRow[]> {
    const conditions: string[] = [
      "a.channel = 'ONLINE'",
      "b.status = 'ACTIVE'",
      "b.grade = 'GRADE_1'",
      'cm.deleted_at IS NULL',
      'cm.is_active = true',
      'a.available_qty > 0',
    ];
    const params: unknown[] = [];

    if (warehouseId) {
      params.push(warehouseId);
      conditions.push(`a.warehouse_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      WITH active_retail_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, price
          FROM retail_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      ),
      active_fair_prices AS (
        SELECT DISTINCT ON (crop_id, grade)
               crop_id, grade, ceiling_price
          FROM fair_prices
         WHERE effective_from <= CURRENT_DATE
           AND (effective_to IS NULL OR effective_to > CURRENT_DATE)
         ORDER BY crop_id, grade, effective_from DESC
      )
      SELECT cm.id                                                AS crop_id,
             cm.name                                              AS name,
             cm.category_id                                       AS category_id,
             b.grade                                              AS grade,
             COALESCE(
               rp.price::text,
               fp.ceiling_price::text,
               '50.00'
             )                                                    AS price_per_kg,
             SUM(a.available_qty)::text                           AS available_qty,
             'kg'::text                                           AS unit,
             cm.icon_key                                          AS icon_key,
             NULL::text                                           AS photo_url,
             ARRAY[]::text[]                                      AS certification_badges,
             ARRAY_AGG(DISTINCT a.warehouse_id::text)             AS warehouse_ids,
             MIN(b.created_at)                                    AS created_at
        FROM allocations a
        JOIN inventory_batches b ON b.id = a.batch_id
        JOIN crop_master cm ON cm.id = b.crop_id
   LEFT JOIN active_retail_prices rp ON rp.crop_id = b.crop_id AND rp.grade = b.grade
   LEFT JOIN active_fair_prices fp ON fp.crop_id = b.crop_id AND fp.grade = b.grade
       WHERE ${whereClause}
       GROUP BY cm.id, cm.name, cm.category_id, b.grade, rp.price, fp.ceiling_price, cm.icon_key
       HAVING SUM(a.available_qty) > 0
       ORDER BY SUM(a.available_qty) DESC, cm.name ASC
       LIMIT 6
    `;

    const res = await db.query<RawCatalogProductRow>(sql, params);
    return res.rows;
  },
};
