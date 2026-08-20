/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.schema.ts holds ONLY Zod schemas and the types inferred from them.
 * Rules:
 *  - Request schemas are the single source of truth for input types; never
 *    hand-write an interface that duplicates one.
 *  - Response schemas exist so the shape stays in step with docs/openapi.yaml.
 *  - `.strict()` on request bodies: an unexpected field is a client bug and we
 *    would rather fail loudly than silently ignore it.
 *  - Never put SQL, HTTP or business logic in this file.
 */
import { z } from 'zod';

/** Matches the CHECK constraint on `warehouses.type` in db/migrations/0005. */
export const warehouseTypes = ['MAIN', 'SUB'] as const;
export type WarehouseType = (typeof warehouseTypes)[number];

/** GET /v1/warehouses/:id */
export const warehouseIdParams = z
  .object({
    id: z.string().uuid('warehouse id must be a UUID'),
  })
  .strict();
export type WarehouseIdParams = z.infer<typeof warehouseIdParams>;

/** GET /v1/warehouses */
export const listWarehousesQuery = z
  .object({
    /** Free-text match on name or code. */
    q: z.string().trim().min(1).max(120).optional(),
    type: z.enum(warehouseTypes).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListWarehousesQuery = z.infer<typeof listWarehousesQuery>;

/** Wire representation of one warehouse. Keep aligned with docs/openapi.yaml. */
export const warehouseResponse = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.enum(warehouseTypes),
  city: z.string().nullable(),
  capacityKg: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type WarehouseResponse = z.infer<typeof warehouseResponse>;

export const listWarehousesResponse = z.object({
  items: z.array(warehouseResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListWarehousesResponse = z.infer<typeof listWarehousesResponse>;
