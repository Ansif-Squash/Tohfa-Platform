import { HttpClient, HttpParams, type HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';

export interface CounterOffer {
  id: string;
  listingId: string | null;
  goodsReceiptId?: string | null;
  round: number;
  offeredBy: 'ADMIN' | 'FARMER';
  offeredByUserId?: string | null;
  pricePerKg: string;
  quantityKg: string;
  message?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LAPSED' | 'COUNTERED';
  expiresAt: string;
  respondedAt?: string | null;
}

export interface AdminListing {
  id: string;
  listingNumber?: string;
  farmerId: string;
  farmerName?: string;
  tohfaFarmerId?: string;
  zoneId?: string | null;
  farmerRating?: number | null;
  farmId?: string | null;
  cropId: string;
  cropName: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  quantityKg: string;
  askingPricePerKg: string;
  ceilingPricePerKg: string;
  finalPricePerKg?: string | null;
  finalQuantityKg?: string | null;
  availableFrom?: string | null;
  photos: string[];
  status: 'PENDING_APPROVAL' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  counterRoundsUsed: number;
  activeCounterOffer?: CounterOffer | null;
  rejectionReason?: string | null;
  purchaseOrderId?: string | null;
  routedAway?: boolean;
  version?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ListAdminListingsResponse {
  items: AdminListing[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}

export interface ApproveListingPayload {
  warehouseId: string;
  expectedDeliveryDate?: string;
  note?: string;
}

export interface RejectListingPayload {
  reasonCode: 'QUALITY_CONCERN' | 'PRICE_UNACCEPTABLE' | 'NO_DEMAND' | 'CERT_ISSUE' | 'DUPLICATE' | 'OTHER';
  reason: string;
}

export interface CounterOfferPayload {
  pricePerKg: string;
  quantityKg: string;
  message?: string;
}

export interface WarehouseOption {
  id: string;
  code: string;
  name: string;
  type: 'MAIN' | 'SUB';
  city?: string | null;
  capacityKg?: number | null;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ListingsService {
  private readonly http = inject(HttpClient);

  /**
   * Server clock offset in milliseconds (ServerTime - ClientTime).
   * Computed once per API response from the HTTP 'Date' response header.
   * Ensures live countdowns are strictly server-synchronized across refreshes (S-23).
   */
  private readonly serverClockOffsetMs = signal<number>(0);

  /** List of warehouse options cached for approval modal dropdown */
  readonly warehouses = signal<WarehouseOption[]>([]);

  /**
   * Fetch the admin produce listings queue.
   */
  listAdminQueue(filters: {
    status?: string;
    cropId?: string;
    zoneId?: string;
    cursor?: string;
    limit?: number;
  } = {}): Observable<HttpResponse<ListAdminListingsResponse>> {
    let params = new HttpParams();
    if (filters.status && filters.status !== 'ALL') params = params.set('status', filters.status);
    if (filters.cropId) params = params.set('cropId', filters.cropId);
    if (filters.zoneId) params = params.set('zoneId', filters.zoneId);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ListAdminListingsResponse>('/v1/admin/listings', {
      params,
      observe: 'response',
    }).pipe(
      tap((res) => {
        this.updateServerClockOffset(res.headers.get('date'));
      }),
    );
  }

  /**
   * Approve a listing and raise the purchase order.
   */
  approveListing(id: string, payload: ApproveListingPayload): Observable<unknown> {
    return this.http.post(`/v1/admin/listings/${id}/approve`, payload);
  }

  /**
   * Reject a listing with structured feedback for the farmer.
   */
  rejectListing(id: string, payload: RejectListingPayload): Observable<unknown> {
    return this.http.post(`/v1/admin/listings/${id}/reject`, payload);
  }

  /**
   * Send a counter-offer to the farmer with price and quantity.
   */
  sendCounterOffer(id: string, payload: CounterOfferPayload): Observable<CounterOffer> {
    return this.http.post<CounterOffer>(`/v1/admin/listings/${id}/counter-offers`, payload);
  }

  /**
   * Fetch list of active warehouses.
   */
  fetchWarehouses(): Observable<{ items: WarehouseOption[] }> {
    return this.http.get<{ items: WarehouseOption[] }>('/v1/warehouses').pipe(
      tap((res) => {
        if (res?.items) {
          this.warehouses.set(res.items.filter((w) => w.isActive !== false));
        }
      }),
    );
  }

  /**
   * Calculate current synchronized server time.
   */
  getSynchronizedServerNow(): Date {
    return new Date(Date.now() + this.serverClockOffsetMs());
  }

  /**
   * Computes remaining seconds for a given UTC expiry timestamp using the synchronized server clock.
   * Returns <= 0 if the offer has lapsed.
   */
  getRemainingSeconds(expiresAtUtc: string | null | undefined): number {
    if (!expiresAtUtc) return 0;
    const expiryMs = new Date(expiresAtUtc).getTime();
    if (isNaN(expiryMs)) return 0;
    const serverNowMs = Date.now() + this.serverClockOffsetMs();
    return Math.max(0, Math.floor((expiryMs - serverNowMs) / 1000));
  }

  /**
   * Format remaining seconds as HH:MM:SS string.
   */
  formatCountdown(secondsRemaining: number): string {
    if (secondsRemaining <= 0) return '00:00:00 (Lapsed)';
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  private updateServerClockOffset(dateHeader: string | null): void {
    if (!dateHeader) return;
    const serverDate = new Date(dateHeader);
    if (!isNaN(serverDate.getTime())) {
      this.serverClockOffsetMs.set(serverDate.getTime() - Date.now());
    }
  }
}
