import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export interface FairPrice {
  id: string;
  cropId: string;
  cropName: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  ceilingPrice: string;
  frequency: 'DAILY' | 'WEEKLY';
  effectiveFrom: string;
  effectiveTo: string | null;
  setBy?: string | null;
  notes?: string | null;
}

export interface FairPriceCreate {
  cropId: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  ceilingPrice: string;
  frequency: 'DAILY' | 'WEEKLY';
  effectiveFrom: string;
  notes?: string | undefined;
}

export interface BulkFairPriceItem extends FairPriceCreate {
  currentCeiling?: string | undefined;
  status?: 'pending' | 'success' | 'error' | undefined;
  errorMessage?: string | undefined;
}

export interface RetailPrice {
  id: string;
  cropId: string;
  cropName: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  price: string;
  ceilingPrice: string;
  markupPct: number | null;
  gstInclusive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface RetailPriceCreate {
  cropId: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  price: string;
  markupPct?: number | undefined;
  gstInclusive: boolean;
  effectiveFrom: string;
}

export interface ListFairPricesResponse {
  items: FairPrice[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface ListRetailPricesResponse {
  items: RetailPrice[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface PriceHistoryResponse {
  items: FairPrice[];
  page: { nextCursor: string | null; hasMore: boolean };
}

@Injectable({ providedIn: 'root' })
export class PricingService {
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

  createFairPrice(payload: FairPriceCreate): Observable<FairPrice> {
    return this.http.post<FairPrice>('/v1/fair-prices', payload);
  }

  bulkUpsertFairPrices(items: FairPriceCreate[]): Observable<{ applied: number; items: FairPrice[] }> {
    return this.http.post<{ applied: number; items: FairPrice[] }>('/v1/fair-prices/bulk', { items });
  }

  getFairPriceHistory(filters: {
    cropId: string;
    grade?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  }): Observable<PriceHistoryResponse> {
    let params = new HttpParams().set('cropId', filters.cropId);
    if (filters.grade) params = params.set('grade', filters.grade);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<PriceHistoryResponse>('/v1/fair-prices/history', { params });
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

  createRetailPrice(payload: RetailPriceCreate): Observable<RetailPrice> {
    return this.http.post<RetailPrice>('/v1/retail-prices', payload);
  }
}
