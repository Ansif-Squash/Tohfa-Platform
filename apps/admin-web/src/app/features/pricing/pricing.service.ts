import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

export interface FairPrice {
  id: string;
  cropId: string;
  cropName?: string;
  grade: string;
  ceilingPrice: string;
  frequency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt?: string;
}

export interface FairPriceCreate {
  cropId: string;
  grade: string;
  ceilingPrice: string;
  frequency?: string;
  effectiveFrom: string;
  notes?: string;
}

export interface ListFairPricesResponse {
  items: FairPrice[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface BulkFairPriceResponse {
  applied: number;
  items: FairPrice[];
}

export interface RetailPrice {
  id: string;
  cropId: string;
  cropName?: string;
  grade: string;
  price: string;
  markupPct?: number;
  gstInclusive?: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface RetailPriceCreate {
  cropId: string;
  grade: string;
  price: string;
  markupPct?: number;
  gstInclusive?: boolean;
  effectiveFrom: string;
}

export interface ListRetailPricesResponse {
  items: RetailPrice[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ApiProblemError {
  field?: string;
  message: string;
  code?: string;
  index?: number;
}

export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code?: string;
  errors?: ApiProblemError[];
  meta?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AdminPricingService {
  private readonly http = inject(HttpClient);

  listFairPrices(filters: {
    cropId?: string;
    grade?: string;
    effectiveOn?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ListFairPricesResponse> {
    let params = new HttpParams();
    if (filters.cropId) params = params.set('cropId', filters.cropId);
    if (filters.grade) params = params.set('grade', filters.grade);
    if (filters.effectiveOn) params = params.set('effectiveOn', filters.effectiveOn);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ListFairPricesResponse>('/v1/fair-prices', { params });
  }

  createFairPrice(body: FairPriceCreate): Observable<FairPrice> {
    return this.http.post<FairPrice>('/v1/fair-prices', body, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  }

  bulkUpsertFairPrices(items: FairPriceCreate[]): Observable<BulkFairPriceResponse> {
    return this.http.post<BulkFairPriceResponse>(
      '/v1/fair-prices/bulk',
      { items },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }

  getFairPriceHistory(filters: {
    cropId: string;
    grade?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ListFairPricesResponse> {
    let params = new HttpParams().set('cropId', filters.cropId);
    if (filters.grade) params = params.set('grade', filters.grade);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ListFairPricesResponse>('/v1/fair-prices/history', { params });
  }

  listRetailPrices(filters: {
    cropId?: string;
    grade?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ListRetailPricesResponse> {
    let params = new HttpParams();
    if (filters.cropId) params = params.set('cropId', filters.cropId);
    if (filters.grade) params = params.set('grade', filters.grade);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ListRetailPricesResponse>('/v1/retail-prices', { params });
  }

  createRetailPrice(body: RetailPriceCreate): Observable<RetailPrice> {
    return this.http.post<RetailPrice>('/v1/retail-prices', body, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  }
}
