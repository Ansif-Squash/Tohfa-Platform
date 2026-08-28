/**
 * counter-offers.schema — Zod request schemas for the counter-offer state
 * machine. Shapes mirror docs/openapi.yaml exactly (CounterOfferCreate, the
 * admin reject body, the admin approve body, the farmer reject message).
 *
 * Unknown keys are stripped (Zod's default): a client-supplied timestamp of
 * any name can never reach the service, which is one half of proving that the
 * countdown is computed from the server clock alone (BR-10).
 */
import { z } from 'zod';

const quantityRegex = /^\d+(\.\d{1,3})?$/;
const moneyRegex = /^\d+(\.\d{1,2})?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/** POST /admin/listings/{id}/counter-offers and POST .../counter-offers/{offerId}/counter */
export const counterOfferCreateBody = z.object({
  pricePerKg: z.string().regex(moneyRegex, 'Price must be a positive decimal up to 2 decimal places'),
  quantityKg: z.string().regex(quantityRegex, 'Quantity must be a positive decimal up to 3 decimal places'),
  message: z.string().max(500).optional(),
});
export type CounterOfferCreateBody = z.infer<typeof counterOfferCreateBody>;

/** POST /listings/{id}/counter-offers/{offerId}/reject — body optional per spec. */
export const counterOfferRejectBody = z.object({
  message: z.string().max(500).optional(),
});
export type CounterOfferRejectBody = z.infer<typeof counterOfferRejectBody>;

/** POST /admin/listings/{id}/approve. The purchase order itself is raised by S-24. */
export const adminApproveListingBody = z.object({
  warehouseId: z.string().uuid(),
  expectedDeliveryDate: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  note: z.string().max(500).optional(),
});
export type AdminApproveListingBody = z.infer<typeof adminApproveListingBody>;

/** POST /admin/listings/{id}/reject — the reason the farmer sees. */
export const adminRejectListingBody = z.object({
  reasonCode: z.enum(['QUALITY_CONCERN', 'PRICE_UNACCEPTABLE', 'NO_DEMAND', 'CERT_ISSUE', 'DUPLICATE', 'OTHER']),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
});
export type AdminRejectListingBody = z.infer<typeof adminRejectListingBody>;

export const counterOfferParams = z.object({
  id: z.string().uuid(),
  offerId: z.string().uuid(),
});
export type CounterOfferParams = z.infer<typeof counterOfferParams>;

export const listingIdParams = z.object({
  id: z.string().uuid(),
});
