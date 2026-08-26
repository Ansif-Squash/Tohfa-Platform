import { z } from 'zod';

const moneyRegex = /^\d+(\.\d{1,2})?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const gradeEnum = z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT']);
export type GradeEnum = z.infer<typeof gradeEnum>;

export const listFairPricesQuery = z.object({
  cropId: z.string().uuid().optional(),
  grade: gradeEnum.optional(),
  effectiveOn: z.string().regex(dateRegex, { message: 'Must be YYYY-MM-DD' }).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListFairPricesQuery = z.infer<typeof listFairPricesQuery>;

export const fairPriceCreateSchema = z.object({
  cropId: z.string().uuid(),
  grade: gradeEnum,
  ceilingPrice: z.string().regex(moneyRegex, { message: 'Must be a valid decimal amount' }),
  frequency: z.enum(['DAILY', 'WEEKLY']).default('WEEKLY'),
  effectiveFrom: z.string().regex(dateRegex, { message: 'Must be YYYY-MM-DD' }),
  notes: z.string().max(300).optional(),
});
export type FairPriceCreate = z.infer<typeof fairPriceCreateSchema>;

export const bulkUpsertFairPricesBody = z.object({
  items: z.array(fairPriceCreateSchema).min(1).max(500),
});
export type BulkUpsertFairPricesBody = z.infer<typeof bulkUpsertFairPricesBody>;

export const getFairPriceHistoryQuery = z.object({
  cropId: z.string().uuid(),
  grade: gradeEnum.optional(),
  from: z.string().regex(dateRegex, { message: 'Must be YYYY-MM-DD' }).optional(),
  to: z.string().regex(dateRegex, { message: 'Must be YYYY-MM-DD' }).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type GetFairPriceHistoryQuery = z.infer<typeof getFairPriceHistoryQuery>;

export const listRetailPricesQuery = z.object({
  cropId: z.string().uuid().optional(),
  grade: gradeEnum.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListRetailPricesQuery = z.infer<typeof listRetailPricesQuery>;

export const retailPriceCreateSchema = z.object({
  cropId: z.string().uuid(),
  grade: gradeEnum,
  price: z.string().regex(moneyRegex, { message: 'Must be a valid decimal amount' }),
  markupPct: z.number().min(0).max(200).optional(),
  gstInclusive: z.boolean().default(true),
  effectiveFrom: z.string().regex(dateRegex, { message: 'Must be YYYY-MM-DD' }),
});
export type RetailPriceCreate = z.infer<typeof retailPriceCreateSchema>;
