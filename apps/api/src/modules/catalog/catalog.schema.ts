import { z } from 'zod';

export const productGradeEnum = z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3']);
export type ProductGrade = z.infer<typeof productGradeEnum>;

export const productSortEnum = z.enum(['PRICE_ASC', 'PRICE_DESC', 'NAME_ASC', 'NEWEST']);
export type ProductSort = z.infer<typeof productSortEnum>;

export const listProductsQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    categoryId: z.string().uuid().optional(),
    grade: productGradeEnum.optional(),
    warehouseId: z.string().uuid().optional(),
    sort: productSortEnum.default('NAME_ASC'),
  })
  .strict();
export type ListProductsQuery = z.infer<typeof listProductsQuery>;

export const searchCatalogQuery = z
  .object({
    q: z.string().min(1).max(80),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    warehouseId: z.string().uuid().optional(),
  })
  .strict();
export type SearchCatalogQuery = z.infer<typeof searchCatalogQuery>;

export const getCatalogHomeQuery = z
  .object({
    warehouseId: z.string().uuid().optional(),
  })
  .strict();
export type GetCatalogHomeQuery = z.infer<typeof getCatalogHomeQuery>;

export const productIdParam = z
  .object({
    id: z.string().uuid(),
  })
  .strict();
export type ProductIdParam = z.infer<typeof productIdParam>;

/**
 * FARM-ANONYMOUS Product schema.
 * Strict allow-list of 10 fields per OpenAPI spec (BR-16).
 */
export const productSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    categoryId: z.string().uuid(),
    grade: productGradeEnum,
    pricePerKg: z.string(),
    availableQty: z.string(),
    unit: z.literal('kg'),
    photos: z.array(z.string()),
    certificationBadges: z.array(z.string()),
    warehouseIds: z.array(z.string().uuid()),
  })
  .strict();
export type ProductView = z.infer<typeof productSchema>;

export const categorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    imageUrl: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    productCount: z.number().int().optional(),
  })
  .strict();
export type CategoryView = z.infer<typeof categorySchema>;

export const bannerSchema = z
  .object({
    id: z.string().uuid(),
    imageUrl: z.string(),
    deeplink: z.string().nullable().optional(),
  })
  .strict();
export type BannerView = z.infer<typeof bannerSchema>;

export const catalogHomeSchema = z
  .object({
    banners: z.array(bannerSchema).optional(),
    categories: z.array(categorySchema),
    featured: z.array(productSchema),
    nearestWarehouseId: z.string().uuid().nullable().optional(),
  })
  .strict();
export type CatalogHomeView = z.infer<typeof catalogHomeSchema>;

export const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: boolean(),
});

function boolean() {
  return z.boolean();
}
