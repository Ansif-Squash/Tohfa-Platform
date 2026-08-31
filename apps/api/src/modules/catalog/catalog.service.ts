import { GenericProblemCode } from '@tohfa/shared-types';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  catalogRepo,
  type CatalogRepo,
  type RawCatalogProductRow,
} from './catalog.repo.js';
import type {
  CatalogHomeView,
  CategoryView,
  ListProductsQuery,
  ProductView,
  SearchCatalogQuery,
} from './catalog.schema.js';

/**
 * BR-16: FARM-ANONYMOUS SERIALIZER (ALLOW-LIST).
 * Positively constructs every Product with exactly the 10 permitted fields.
 * NO object spread (...row), NO key deletion (delete row.x).
 */
export function serializeProduct(row: RawCatalogProductRow): ProductView {
  const photos = row.photo_url
    ? [row.photo_url]
    : row.icon_key
      ? [`https://cdn.tohfa.in/products/${row.icon_key}.jpg`]
      : [`https://cdn.tohfa.in/products/${row.crop_id}.jpg`];

  return {
    id: row.crop_id,
    name: row.name,
    categoryId: row.category_id,
    grade: row.grade,
    pricePerKg: Number(row.price_per_kg).toFixed(2),
    availableQty: Number(row.available_qty).toFixed(3),
    unit: 'kg',
    photos,
    certificationBadges: row.certification_badges ?? [],
    warehouseIds: row.warehouse_ids ?? [],
  };
}

export class CatalogService {
  constructor(private readonly repo: CatalogRepo = catalogRepo) {}

  async listProducts(
    filters: ListProductsQuery,
    db: Executor = pool,
  ): Promise<{ items: ProductView[]; page: { nextCursor: string | null; hasMore: boolean } }> {
    const { items, nextCursor, hasMore } = await this.repo.listProducts(db, filters);
    return {
      items: items.map(serializeProduct),
      page: {
        nextCursor,
        hasMore,
      },
    };
  }

  async getProductById(id: string, db: Executor = pool): Promise<ProductView> {
    const row = await this.repo.getProductById(db, id);
    if (row === null) {
      throw new AppError(GenericProblemCode.NOT_FOUND, {
        detail: 'Product not found or currently unavailable.',
      });
    }
    return serializeProduct(row);
  }

  async searchCatalog(
    filters: SearchCatalogQuery,
    db: Executor = pool,
  ): Promise<{ items: ProductView[]; page: { nextCursor: string | null; hasMore: boolean } }> {
    const { items, nextCursor, hasMore } = await this.repo.searchProducts(db, filters);
    return {
      items: items.map(serializeProduct),
      page: {
        nextCursor,
        hasMore,
      },
    };
  }

  async listCategories(db: Executor = pool): Promise<{ items: CategoryView[] }> {
    const categories = await this.repo.listCategories(db);
    return { items: categories };
  }

  async getCatalogHome(
    warehouseId?: string,
    db: Executor = pool,
  ): Promise<CatalogHomeView> {
    const [categories, featuredRows] = await Promise.all([
      this.repo.listCategories(db),
      this.repo.getFeaturedProducts(db, warehouseId),
    ]);

    const banners = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        imageUrl: 'https://cdn.tohfa.in/banners/fresh-nilgiris-harvest.jpg',
        deeplink: '/categories/vegetables',
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        imageUrl: 'https://cdn.tohfa.in/banners/organic-carrots-special.jpg',
        deeplink: '/products',
      },
    ];

    return {
      banners,
      categories,
      featured: featuredRows.map(serializeProduct),
      nearestWarehouseId: warehouseId ?? null,
    };
  }
}

export const catalogService = new CatalogService();
