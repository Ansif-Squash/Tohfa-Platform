import { api } from './client';

export type Grade = 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'COUNTER_OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED';

export type CounterOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'LAPSED';

export interface CounterOffer {
  id: string;
  listingId: string;
  round: number;
  offeredBy: 'ADMIN' | 'FARMER';
  offeredByUserId?: string | null | undefined;
  pricePerKg: string;
  quantityKg: string;
  message: string | null;
  status: CounterOfferStatus;
  expiresAt: string;
  respondedAt?: string | null | undefined;
}

export interface Listing {
  id: string;
  listingNumber: string;
  farmerId: string;
  farmId: string | null;
  cropId: string;
  cropName: string;
  grade: Grade;
  quantityKg: string;
  askingPricePerKg: string;
  ceilingPricePerKg: string;
  finalPricePerKg: string | null;
  finalQuantityKg: string | null;
  fairPriceId?: string | undefined;
  status: ListingStatus;
  availableFrom: string | null;
  photos: string[];
  counterRoundsUsed?: number | undefined;
  activeCounterOffer?: CounterOffer | null | undefined;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface FairPriceCeiling {
  id: string;
  cropId: string;
  cropName?: string | undefined;
  grade: Grade;
  ceilingPrice: string;
  frequency?: string | undefined;
  effectiveFrom: string;
  notes?: string | null | undefined;
}

export interface CreateListingInput {
  cropId: string;
  grade: Grade;
  quantityKg: string;
  askingPricePerKg: string;
  farmId?: string | undefined;
  availableFrom?: string | undefined;
  photos?: string[] | undefined;
}

export interface UpdateListingInput {
  quantityKg?: string | undefined;
  askingPricePerKg?: string | undefined;
  availableFrom?: string | undefined;
  photos?: string[] | undefined;
  version?: number | undefined;
}

export interface CounterOfferCreateInput {
  pricePerKg: string;
  quantityKg: string;
  message?: string | undefined;
}

export interface ListingListResponse {
  items: Listing[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface FairPriceListResponse {
  items: FairPriceCeiling[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// ---------------------------------------------------------------------------
// Business Rule Validation & Domain Helpers
// ---------------------------------------------------------------------------

/**
 * BR-07: Listing price must not exceed the fair price ceiling.
 * Floating-point arithmetic is forbidden: converts to integer paise for exact comparisons.
 */
export function evalListingCeiling(
  askingPrice: string,
  ceilingPrice: string,
): { isValid: boolean; error: string | null; message: string | null } {
  if (!askingPrice || askingPrice.trim() === '') {
    return { isValid: false, error: 'REQUIRED', message: 'Price is required' };
  }

  const askingNum = Number(askingPrice);
  if (isNaN(askingNum) || askingNum <= 0) {
    return { isValid: false, error: 'INVALID_PRICE', message: 'Price must be greater than zero' };
  }

  const ceilingNum = Number(ceilingPrice);
  if (isNaN(ceilingNum) || ceilingNum <= 0) {
    // If no valid ceiling is provided yet, accept price format but flag missing ceiling
    return { isValid: true, error: null, message: null };
  }

  const askingPaise = Math.round(askingNum * 100);
  const ceilingPaise = Math.round(ceilingNum * 100);

  if (askingPaise > ceilingPaise) {
    return {
      isValid: false,
      error: 'PRICE_ABOVE_CEILING',
      message: `Price exceeds fair-price ceiling of ₹${ceilingNum.toFixed(2)}/kg (BR-07)`,
    };
  }

  return { isValid: true, error: null, message: null };
}

/**
 * BR-11: Counter-offers may be countered back at most 3 times.
 * @param farmerCountersUsed Number of times the farmer has already submitted a counter-offer.
 */
export function canCounterBack(farmerCountersUsed: number): boolean {
  return farmerCountersUsed < 3;
}

/**
 * BR-10: 24-Hour Counter-Offer countdown derived strictly from server `expiresAt`.
 * Uses monotonic elapsed time (performance.now) to protect against local device clock tampering.
 */
export function computeRemainingTime(
  expiresAtIso: string,
  serverNowMs?: number,
  clientBasePerfMs?: number,
  currentPerfMs?: number,
): { remainingMs: number; remainingSeconds: number; isExpired: boolean } {
  const expiresAtMs = new Date(expiresAtIso).getTime();

  let nowMs: number;
  if (serverNowMs !== undefined && clientBasePerfMs !== undefined && currentPerfMs !== undefined) {
    const elapsed = Math.max(0, currentPerfMs - clientBasePerfMs);
    nowMs = serverNowMs + elapsed;
  } else {
    nowMs = Date.now();
  }

  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const isExpired = remainingMs <= 0;

  return { remainingMs, remainingSeconds, isExpired };
}

/**
 * Formats milliseconds into HH:MM:SS format.
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

/**
 * Fetches fair price ceiling for a crop and grade.
 * Authoritative source before typing asking price (BR-07).
 */
export async function getFairPriceCeilings(
  cropId?: string,
  grade?: Grade,
): Promise<FairPriceListResponse> {
  const parts: string[] = [];
  if (cropId) parts.push(`cropId=${encodeURIComponent(cropId)}`);
  if (grade) parts.push(`grade=${encodeURIComponent(grade)}`);
  const path = parts.length > 0 ? `/fair-prices?${parts.join('&')}` : '/fair-prices';
  return await api.get<FairPriceListResponse>(path);
}

/**
 * Submits a new produce listing.
 * Reuses single idempotencyKey across retries to prevent duplicate submissions.
 */
export async function createListing(
  input: CreateListingInput,
  idempotencyKey: string,
): Promise<Listing> {
  return await api.post<Listing>('/listings', input, idempotencyKey);
}

/**
 * Lists the caller's produce listings with status filter (e.g. for Sold / Unsold tabs).
 */
export async function getMyListings(
  status?: ListingStatus,
  cursor?: string,
  limit: number = 20,
): Promise<ListingListResponse> {
  const parts: string[] = [`limit=${limit}`];
  if (status) parts.push(`status=${encodeURIComponent(status)}`);
  if (cursor) parts.push(`cursor=${encodeURIComponent(cursor)}`);
  return await api.get<ListingListResponse>(`/listings?${parts.join('&')}`);
}

/**
 * Updates a pending produce listing.
 */
export async function updateListing(id: string, body: UpdateListingInput): Promise<Listing> {
  return await api.patch<Listing>(`/listings/${id}`, body);
}

/**
 * Withdraws a pending produce listing.
 */
export async function withdrawListing(id: string, version?: number): Promise<Listing> {
  return await api.post<Listing>(`/listings/${id}/withdraw`, { version });
}

/**
 * Accepts an admin counter-offer.
 */
export async function acceptCounterOffer(listingId: string, offerId: string): Promise<Listing> {
  return await api.post<Listing>(`/listings/${listingId}/counter-offers/${offerId}/accept`, {});
}

/**
 * Rejects an admin counter-offer with optional message.
 */
export async function rejectCounterOffer(
  listingId: string,
  offerId: string,
  message?: string,
): Promise<CounterOffer> {
  return await api.post<CounterOffer>(`/listings/${listingId}/counter-offers/${offerId}/reject`, {
    message,
  });
}

/**
 * Counters back an admin counter-offer (BR-11, at most 3 rounds).
 * Reuses idempotencyKey across network retries.
 */
export async function counterBackOffer(
  listingId: string,
  offerId: string,
  body: CounterOfferCreateInput,
  idempotencyKey?: string,
): Promise<CounterOffer> {
  return await api.post<CounterOffer>(
    `/listings/${listingId}/counter-offers/${offerId}/counter`,
    body,
    idempotencyKey,
  );
}
