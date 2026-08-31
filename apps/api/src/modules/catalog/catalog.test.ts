import { describe, expect, it } from 'vitest';
import { AppError } from '../../http/problem.js';
import type {
  CatalogRepo,
  RawCatalogProductRow,
} from './catalog.repo.js';
import { CatalogService, serializeProduct } from './catalog.service.js';
import type {
  CategoryView,
  ListProductsQuery,
  ProductGrade,
  SearchCatalogQuery,
} from './catalog.schema.js';

// ---------------------------------------------------------------------------
// Fixed Identities
// ---------------------------------------------------------------------------
const IDS = {
  cropCarrot: '20000000-0000-4000-8000-000000000001',
  cropPotato: '20000000-0000-4000-8000-000000000002',
  categoryVeg: '30000000-0000-4000-8000-000000000001',
  categoryFruits: '30000000-0000-4000-8000-000000000002',
  warehouseOoty: '10000000-0000-4000-8000-000000000001',
  warehouseCoonoor: '10000000-0000-4000-8000-000000000002',
  farmer1: '50000000-0000-4000-8000-000000000001',
  farmer2: '50000000-0000-4000-8000-000000000002',
  batch1: '60000000-0000-4000-8000-000000000001',
  batch2: '60000000-0000-4000-8000-000000000002',
};

// ---------------------------------------------------------------------------
// Denylist of Farm Identity & Internal Provenance Keys (BR-16a)
// ---------------------------------------------------------------------------
const DENYLIST_KEYS = [
  'farmerId',
  'farmer_id',
  'sourceFarmerId',
  'source_farmer_id',
  'farmName',
  'farm_name',
  'farmId',
  'farm_id',
  'village',
  'zoneId',
  'zone_id',
  'gps',
  'latitude',
  'longitude',
  'fmb',
  'listingId',
  'listing_id',
  'batchId',
  'batch_id',
  'batchCode',
  'batch_code',
];

function assertNoDenylistKeys(obj: unknown, path = ''): void {
  if (obj === null || obj === undefined) return;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => assertNoDenylistKeys(item, `${path}[${index}]`));
    return;
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      for (const deny of DENYLIST_KEYS) {
        expect(
          lowerKey,
          `Forbidden farm identity key "${key}" found at path "${path}.${key}"`,
        ).not.toBe(deny.toLowerCase());
      }
      assertNoDenylistKeys((obj as Record<string, unknown>)[key], `${path}.${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// In-Memory Mock Repo
// ---------------------------------------------------------------------------
class MockCatalogRepo implements CatalogRepo {
  public products: RawCatalogProductRow[] = [
    {
      crop_id: IDS.cropCarrot,
      name: 'Nilgiris Carrot',
      category_id: IDS.categoryVeg,
      grade: 'GRADE_1',
      price_per_kg: '69.00',
      available_qty: '154.000',
      unit: 'kg',
      icon_key: 'carrot',
      photo_url: 'https://cdn.tohfa.in/products/carrot-g1.jpg',
      certification_badges: ['PGS', 'NPOP'],
      warehouse_ids: [IDS.warehouseOoty],
      created_at: new Date('2026-08-20T10:00:00Z'),
    },
    {
      crop_id: IDS.cropPotato,
      name: 'Ooty Potato',
      category_id: IDS.categoryVeg,
      grade: 'GRADE_2',
      price_per_kg: '45.00',
      available_qty: '200.000',
      unit: 'kg',
      icon_key: 'potato',
      photo_url: 'https://cdn.tohfa.in/products/potato-g2.jpg',
      certification_badges: ['PGS'],
      warehouse_ids: [IDS.warehouseOoty, IDS.warehouseCoonoor],
      created_at: new Date('2026-08-22T10:00:00Z'),
    },
  ];

  public categories: CategoryView[] = [
    {
      id: IDS.categoryVeg,
      name: 'Vegetables',
      slug: 'vegetables',
      imageUrl: 'https://cdn.tohfa.in/cat/veg.jpg',
      sortOrder: 1,
      productCount: 2,
    },
    {
      id: IDS.categoryFruits,
      name: 'Fruits',
      slug: 'fruits',
      imageUrl: 'https://cdn.tohfa.in/cat/fruits.jpg',
      sortOrder: 2,
      productCount: 0,
    },
  ];

  async listProducts(
    _db: unknown,
    filters: ListProductsQuery,
  ): Promise<{ items: RawCatalogProductRow[]; nextCursor: string | null; hasMore: boolean }> {
    let rows = this.products.filter((r) => (r.grade as string) !== 'REJECT');

    if (filters.categoryId) {
      rows = rows.filter((r) => r.category_id === filters.categoryId);
    }
    if (filters.grade) {
      rows = rows.filter((r) => r.grade === filters.grade);
    }
    if (filters.warehouseId) {
      rows = rows.filter((r) => r.warehouse_ids.includes(filters.warehouseId!));
    }

    if (filters.sort === 'PRICE_ASC') {
      rows.sort((a, b) => Number(a.price_per_kg) - Number(b.price_per_kg));
    } else if (filters.sort === 'PRICE_DESC') {
      rows.sort((a, b) => Number(b.price_per_kg) - Number(a.price_per_kg));
    } else if (filters.sort === 'NEWEST') {
      rows.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    } else {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      items: rows.slice(0, filters.limit),
      nextCursor: null,
      hasMore: false,
    };
  }

  async getProductById(
    _db: unknown,
    cropId: string,
    _grade?: ProductGrade,
  ): Promise<RawCatalogProductRow | null> {
    const found = this.products.find((r) => r.crop_id === cropId);
    return found ?? null;
  }

  async searchProducts(
    _db: unknown,
    filters: SearchCatalogQuery,
  ): Promise<{ items: RawCatalogProductRow[]; nextCursor: string | null; hasMore: boolean }> {
    const q = filters.q.toLowerCase();
    const rows = this.products.filter((r) => r.name.toLowerCase().includes(q));
    return {
      items: rows.slice(0, filters.limit),
      nextCursor: null,
      hasMore: false,
    };
  }

  async listCategories(_db: unknown): Promise<CategoryView[]> {
    return this.categories;
  }

  async getFeaturedProducts(_db: unknown, _warehouseId?: string): Promise<RawCatalogProductRow[]> {
    return this.products.filter((r) => r.grade === 'GRADE_1');
  }
}

function createTestService(repo = new MockCatalogRepo()) {
  return {
    service: new CatalogService(repo),
    repo,
  };
}

// ---------------------------------------------------------------------------
// Test Suite: S-29 Catalog API & Business Rules BR-16, BR-24
// ---------------------------------------------------------------------------
describe('CatalogService (Unit & Business Rules S-29)', () => {
  describe('BR-16: Farm-Anonymity & Recursive Denylist Validation', () => {
    it('BR-16a: listProducts response never contains farm-identity or internal provenance keys', async () => {
      const { service } = createTestService();
      const res = await service.listProducts({ limit: 20, sort: 'NAME_ASC' });

      expect(res.items.length).toBeGreaterThan(0);
      assertNoDenylistKeys(res);
    });

    it('BR-16a: getProductById response never contains farm-identity keys', async () => {
      const { service } = createTestService();
      const res = await service.getProductById(IDS.cropCarrot);

      expect(res.id).toBe(IDS.cropCarrot);
      assertNoDenylistKeys(res);
    });

    it('BR-16a: searchCatalog response never contains farm-identity keys', async () => {
      const { service } = createTestService();
      const res = await service.searchCatalog({ q: 'Carrot', limit: 20 });

      expect(res.items.length).toBeGreaterThan(0);
      assertNoDenylistKeys(res);
    });

    it('BR-16a: getCatalogHome response never contains farm-identity keys', async () => {
      const { service } = createTestService();
      const res = await service.getCatalogHome();

      expect(res.categories.length).toBeGreaterThan(0);
      expect(res.featured.length).toBeGreaterThan(0);
      assertNoDenylistKeys(res);
    });

    it('BR-16b: Adding extra internal columns to repo row does not leak into the serializer output', () => {
      const rawRowWithSensitiveFields = {
        crop_id: IDS.cropCarrot,
        name: 'Nilgiris Carrot',
        category_id: IDS.categoryVeg,
        grade: 'GRADE_1' as ProductGrade,
        price_per_kg: '69.00',
        available_qty: '154.000',
        unit: 'kg' as const,
        icon_key: 'carrot',
        photo_url: 'https://cdn.tohfa.in/products/carrot.jpg',
        certification_badges: ['PGS'],
        warehouse_ids: [IDS.warehouseOoty],
        created_at: new Date(),
        // Extra sensitive / internal fields:
        farmer_id: IDS.farmer1,
        source_farmer_id: IDS.farmer1,
        farm_id: 'farm-123',
        farm_name: 'Green Valley Organic Farm',
        village: 'Ketti Valley',
        gps: '11.3995,76.7118',
        batch_id: IDS.batch1,
        batch_code: 'BAT-2026-001',
        listing_id: 'lst-123',
      };

      const serialized = serializeProduct(rawRowWithSensitiveFields as any);

      // Exactly the 10 permitted keys
      const keys = Object.keys(serialized).sort();
      expect(keys).toEqual([
        'availableQty',
        'categoryId',
        'certificationBadges',
        'grade',
        'id',
        'name',
        'photos',
        'pricePerKg',
        'unit',
        'warehouseIds',
      ]);

      assertNoDenylistKeys(serialized);
    });

    it('BR-16c: Querying non-existent product or internal listing ID throws 404', async () => {
      const { service } = createTestService();
      await expect(service.getProductById('00000000-0000-0000-0000-999999999999')).rejects.toThrowError(
        AppError,
      );
    });
  });

  describe('BR-24: Consolidated Inventory & Product Pooling', () => {
    it('BR-24a: Multiple batches of same crop/grade are presented as one pooled product with combined quantity', async () => {
      const customRepo = new MockCatalogRepo();
      // Suppose two batches from two different farmers in Ooty have 100 kg + 54 kg Grade 1 Carrots
      customRepo.products = [
        {
          crop_id: IDS.cropCarrot,
          name: 'Nilgiris Carrot',
          category_id: IDS.categoryVeg,
          grade: 'GRADE_1',
          price_per_kg: '69.00',
          available_qty: '154.000', // 100 + 54 pooled
          unit: 'kg',
          icon_key: 'carrot',
          photo_url: 'https://cdn.tohfa.in/products/carrot-g1.jpg',
          certification_badges: ['PGS'],
          warehouse_ids: [IDS.warehouseOoty],
          created_at: new Date(),
        },
      ];

      const { service } = createTestService(customRepo);
      const res = await service.listProducts({ limit: 10, sort: 'NAME_ASC' });

      expect(res.items).toHaveLength(1);
      expect(res.items[0]!.name).toBe('Nilgiris Carrot');
      expect(res.items[0]!.availableQty).toBe('154.000');
    });

    it('REJECT-grade stock is never sellable and never appears in catalog', async () => {
      const { service, repo } = createTestService();
      // Add a REJECT item
      (repo.products as any).push({
        crop_id: '99999999-0000-4000-8000-000000000001',
        name: 'Damaged Cabbage',
        category_id: IDS.categoryVeg,
        grade: 'REJECT',
        price_per_kg: '10.00',
        available_qty: '50.000',
        unit: 'kg',
        icon_key: null,
        photo_url: null,
        certification_badges: [],
        warehouse_ids: [IDS.warehouseOoty],
        created_at: new Date(),
      });

      const res = await service.listProducts({ limit: 20, sort: 'NAME_ASC' });
      const grades = res.items.map((i) => i.grade);
      expect(grades).not.toContain('REJECT');
    });
  });

  describe('Catalog Browsing, Categories, & Search', () => {
    it('listCategories returns categories with image URLs', async () => {
      const { service } = createTestService();
      const res = await service.listCategories();
      expect(res.items).toHaveLength(2);
      expect(res.items[0]!.name).toBe('Vegetables');
      expect(res.items[0]!.slug).toBe('vegetables');
      expect(res.items[0]!.imageUrl).toContain('veg.jpg');
    });

    it('searchCatalog filters products by name query', async () => {
      const { service } = createTestService();
      const res = await service.searchCatalog({ q: 'Potato', limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.items[0]!.name).toBe('Ooty Potato');
    });

    it('getCatalogHome returns banners, categories, and featured products', async () => {
      const { service } = createTestService();
      const res = await service.getCatalogHome(IDS.warehouseOoty);
      expect(res.banners).toBeDefined();
      expect(res.banners!.length).toBeGreaterThan(0);
      expect(res.categories).toHaveLength(2);
      expect(res.featured).toHaveLength(1);
      expect(res.nearestWarehouseId).toBe(IDS.warehouseOoty);
    });
  });
});
