import { z } from 'zod';

export const produceGradeEnum = z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3']);
export type ProduceGrade = z.infer<typeof produceGradeEnum>;

export const listingStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'COUNTER_OFFERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'FULFILLED',
  'EXPIRED',
]);
export type ListingStatus = z.infer<typeof listingStatusEnum>;

export const createListingBody = z.object({
  farmId: z.string().uuid().optional(),
  farmCropId: z.string().uuid().optional(),
  cropId: z.string().uuid(),
  grade: produceGradeEnum,
  quantityKg: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Invalid quantity format (max 3 decimals)'),
  askingPricePerKg: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format (max 2 decimals)'),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});
export type CreateListingBody = z.infer<typeof createListingBody>;

export const updateListingBody = z.object({
  quantityKg: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  askingPricePerKg: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  version: z.number().int().positive(),
});
export type UpdateListingBody = z.infer<typeof updateListingBody>;

export const withdrawListingBody = z.object({
  version: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});
export type WithdrawListingBody = z.infer<typeof withdrawListingBody>;

export const listingIdParams = z.object({
  id: z.string().uuid(),
});
export type ListingIdParams = z.infer<typeof listingIdParams>;

export const counterOfferParams = z.object({
  id: z.string().uuid(),
  offerId: z.string().uuid(),
});
export type CounterOfferParams = z.infer<typeof counterOfferParams>;

export const counterOfferBody = z.object({
  pricePerKg: z.string().regex(/^\d+(\.\d{1,2})?$/),
  quantityKg: z.string().regex(/^\d+(\.\d{1,3})?$/),
  message: z.string().max(500).optional(),
  version: z.number().int().positive().optional(),
});
export type CounterOfferBody = z.infer<typeof counterOfferBody>;

export const approveListingBody = z.object({
  version: z.number().int().positive().optional(),
  finalPricePerKg: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  finalQuantityKg: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
});
export type ApproveListingBody = z.infer<typeof approveListingBody>;

export const rejectListingBody = z.object({
  version: z.number().int().positive().optional(),
  reason: z.string().min(1).max(500),
});
export type RejectListingBody = z.infer<typeof rejectListingBody>;

export const listListingsQuery = z.object({
  status: listingStatusEnum.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListListingsQuery = z.infer<typeof listListingsQuery>;

export interface CounterOfferResponse {
  id: string;
  listingId: string;
  round: number;
  actor: 'ADMIN' | 'FARMER';
  actorUserId: string;
  pricePerKg: string;
  quantityKg: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LAPSED';
  expiresAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
  createdAt: string;
}

export interface ListingResponse {
  id: string;
  listingNumber: string;
  farmerId: string;
  farmId: string | null;
  farmCropId: string | null;
  cropId: string;
  grade: ProduceGrade;
  quantityKg: string;
  askingPricePerKg: string;
  fairPriceId: string;
  status: ListingStatus;
  availableFrom: string | null;
  photoKeys: string[];
  certificationBadges: unknown[];
  version: number;
  createdAt: string;
  updatedAt: string | null;
  activeCounterOffer?: CounterOfferResponse | null;
}

export interface ListListingsResponse {
  items: ListingResponse[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  summary?: {
    totalListings: number;
    soldKg: string;
    unsoldKg: string;
  };
}
