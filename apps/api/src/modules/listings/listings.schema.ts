import { z } from 'zod';

export const gradeEnum = z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT']);
export type Grade = z.infer<typeof gradeEnum>;

export const listingStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'COUNTER_OFFERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]);
export type ListingStatus = z.infer<typeof listingStatusEnum>;

const quantityRegex = /^\d+(\.\d{1,3})?$/;
const moneyRegex = /^\d+(\.\d{1,2})?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createListingBody = z.object({
  cropId: z.string().uuid(),
  grade: gradeEnum,
  quantityKg: z.string().regex(quantityRegex, 'Quantity must be a positive decimal up to 3 decimal places'),
  askingPricePerKg: z.string().regex(moneyRegex, 'Price must be a positive decimal up to 2 decimal places'),
  farmId: z.string().uuid().optional(),
  availableFrom: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});
export type CreateListingBody = z.infer<typeof createListingBody>;

export const updateListingBody = z.object({
  quantityKg: z.string().regex(quantityRegex).optional(),
  askingPricePerKg: z.string().regex(moneyRegex).optional(),
  availableFrom: z.string().regex(dateRegex).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  version: z.number().int().positive().optional(),
});
export type UpdateListingBody = z.infer<typeof updateListingBody>;

export const listListingsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: listingStatusEnum.optional(),
});
export type ListListingsQuery = z.infer<typeof listListingsQuery>;

export const listingIdParam = z.object({
  id: z.string().uuid(),
});
export type ListingIdParam = z.infer<typeof listingIdParam>;
