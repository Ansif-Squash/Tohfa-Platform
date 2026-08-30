import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export type StockMovementType =
  | 'RECEIPT'
  | 'DISPATCH'
  | 'ALLOCATION_ONLINE'
  | 'ALLOCATION_LIVE_MARKET'
  | 'ALLOCATION_RESERVE'
  | 'ALLOCATION_BUFFER'
  | 'RESERVATION_HOLD'
  | 'RESERVATION_RELEASE'
  | 'CONSUMPTION'
  | 'WRITE_OFF'
  | 'ADJUSTMENT_UP'
  | 'ADJUSTMENT_DOWN';

export interface StockLedgerEntry {
  id: string;
  batchId: string;
  batchCode?: string;
  warehouseId: string;
  warehouseName?: string;
  movementType: StockMovementType;
  qtyDelta: string;
  balanceAfter: string;
  refType?: string | null;
  refId?: string | null;
  remarks?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface ListStockLedgerResponse {
  items: StockLedgerEntry[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface BatchSummary {
  id: string;
  batchCode: string;
  warehouseId: string;
  warehouseName?: string;
  cropId: string;
  cropName?: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  sourceFarmerId?: string;
  farmerName?: string;
  qtyReceived: string;
  qtyAvailable: string;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'WRITTEN_OFF';
  receivedOn: string;
  expiryOn?: string | null;
  storageLocation?: string | null;
  createdAt: string;
  movements?: StockLedgerEntry[];
}

export interface ListBatchesResponse {
  items: BatchSummary[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export type AllocationChannel = 'ONLINE' | 'LIVE_MARKET' | 'RESERVE' | 'BUFFER';

export interface AllocationItem {
  id: string;
  batchId: string;
  batchCode?: string;
  cropId?: string;
  cropName?: string;
  warehouseId: string;
  warehouseName?: string;
  channel: AllocationChannel;
  allocatedQty: string;
  consumedQty: string;
  reservedQty: string;
  availableQty: string;
  computedBy: string;
  createdAt: string;
}

export interface ListAllocationsResponse {
  items: AllocationItem[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city?: string;
  isMarketDayVenue?: boolean;
}

export interface StockLedgerFilters {
  warehouseId?: string | undefined;
  batchId?: string | undefined;
  movementType?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface BatchFilters {
  warehouseId?: string | undefined;
  cropId?: string | undefined;
  grade?: string | undefined;
  status?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface AllocationFilters {
  warehouseId?: string | undefined;
  batchId?: string | undefined;
  channel?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class AdminInventoryService {
  private readonly http = inject(HttpClient);

  listStockLedger(filters: StockLedgerFilters = {}): Observable<ListStockLedgerResponse> {
    let params = new HttpParams();
    if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    if (filters.batchId) params = params.set('batchId', filters.batchId);
    if (filters.movementType) params = params.set('movementType', filters.movementType);
    if (filters.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters.toDate) params = params.set('toDate', filters.toDate);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return this.http.get<ListStockLedgerResponse>('/v1/admin/stock-ledger', { params });
  }

  listBatches(filters: BatchFilters = {}): Observable<ListBatchesResponse> {
    let params = new HttpParams();
    if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    if (filters.cropId) params = params.set('cropId', filters.cropId);
    if (filters.grade) params = params.set('grade', filters.grade);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return this.http.get<ListBatchesResponse>('/v1/admin/batches', { params });
  }

  getBatch(id: string): Observable<BatchSummary> {
    return this.http.get<BatchSummary>(`/v1/admin/batches/${id}`);
  }

  listAllocations(filters: AllocationFilters = {}): Observable<ListAllocationsResponse> {
    let params = new HttpParams();
    if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    if (filters.batchId) params = params.set('batchId', filters.batchId);
    if (filters.channel) params = params.set('channel', filters.channel);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return this.http.get<ListAllocationsResponse>('/v1/admin/allocations', { params });
  }

  listWarehouses(): Observable<{ items: Warehouse[] }> {
    return this.http.get<{ items: Warehouse[] }>('/v1/warehouses');
  }

  exportStockLedgerCsv(items: StockLedgerEntry[]): void {
    const headers = ['ID', 'Batch ID', 'Warehouse ID', 'Movement Type', 'Quantity (kg)', 'Balance After (kg)', 'Remarks', 'Date'];
    const rows = items.map((e) => [
      e.id,
      e.batchId,
      e.warehouseId,
      e.movementType,
      e.qtyDelta,
      e.balanceAfter,
      e.remarks ? `"${e.remarks.replace(/"/g, '""')}"` : '',
      e.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-ledger-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
